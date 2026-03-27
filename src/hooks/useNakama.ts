import { useState, useEffect, useRef } from 'react'
import { Client, Session } from '@heroiclabs/nakama-js'
import type { LeaderboardRecord, MatchmakerMatched, Presence, Socket } from '@heroiclabs/nakama-js'
import type { GameState, LeaderboardEntry } from '../types/game'

const NAKAMA_HOST = import.meta.env.VITE_NAKAMA_HOST ?? 'nakama-production-dd82.up.railway.app'
const NAKAMA_PORT = import.meta.env.VITE_NAKAMA_PORT ?? '443'
const NAKAMA_KEY = import.meta.env.VITE_NAKAMA_KEY ?? 'defaultkey'
const USE_SSL = (import.meta.env.VITE_NAKAMA_USE_SSL ?? 'true').toLowerCase() === 'true'

// Opcodes must match tictactoe.js
const OP_MOVE     = 1
const OP_STATE    = 2
const OP_TIMER    = 3
const OP_GAMEOVER = 4
const OP_REMATCH  = 5

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'matchmaking'
  | 'in_match'
  | 'gameover'
  | 'error'

export interface UseNakamaReturn {
  status: ConnectionStatus
  gameState: GameState | null
  leaderboard: LeaderboardEntry[]
  connect: (username: string) => Promise<void>
  sendMove: (cellIndex: number) => void
  requestRematch: () => void
  disconnect: () => void
}

export function useNakama(): UseNakamaReturn {
  const [status, setStatus]           = useState<ConnectionStatus>('idle')
  const [gameState, setGameState]     = useState<GameState | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  const clientRef  = useRef<Client | null>(null)
  const socketRef  = useRef<Socket | null>(null)
  const sessionRef = useRef<Session | null>(null)
  const matchIdRef = useRef<string | null>(null)
  const myUserIdRef = useRef<string | null>(null)
  const mySymbolRef = useRef<'X' | 'O' | null>(null)

  const applyRematchReadyPlayers = (readyPlayers: string[] | undefined) => {
    if (!Array.isArray(readyPlayers)) return

    setGameState(prev => {
      if (!prev || !myUserIdRef.current) return prev

      const rematchRequestedByMe = readyPlayers.includes(myUserIdRef.current)
      const opponentWantsRematch = readyPlayers.some((id) => id !== myUserIdRef.current)

      return {
        ...prev,
        rematchRequestedByMe,
        opponentWantsRematch,
      }
    })
  }

  const connect = async (username: string) => {
    if (clientRef.current) {
      console.log('Nakama: already connected/connecting, skipping...')
      return
    }

    try {
      setStatus('connecting')

      // 1. Create Nakama client
      const client = new Client(NAKAMA_KEY, NAKAMA_HOST, NAKAMA_PORT, USE_SSL)
      clientRef.current = client

      const existingDeviceId = sessionStorage.getItem('nakama_device_id')
      let deviceId = existingDeviceId
      let uniqueUsername: string | undefined = undefined

      if (!deviceId) {
        deviceId = crypto.randomUUID()
        sessionStorage.setItem('nakama_device_id', deviceId)
        uniqueUsername = username + '_' + deviceId.slice(0, 6)
      }

      const session = await client.authenticateDevice(deviceId, true, uniqueUsername)
      sessionRef.current = session
      myUserIdRef.current = session.user_id ?? null
      console.log('Nakama: authenticated as', uniqueUsername)

      // 3. Open WebSocket connection
      const socket = client.createSocket(USE_SSL, false)
      socketRef.current = socket

      socket.ondisconnect = (event) => {
        console.warn('Nakama: socket disconnected', event)
        setStatus('error')
      }

      socket.onerror = (event) => {
        console.error('Nakama: socket error', event)
        setStatus('error')
      }

      // 4. Listen for match state updates from server
      socket.onmatchdata = (data) => {
        const payload = JSON.parse(new TextDecoder().decode(data.data))
        console.log('Nakama: OP_STATE received', data.op_code, payload)

        if (data.op_code === OP_STATE) {
          // Sync server-assigned symbols if they provide it in the payload
          if (payload.symbols && myUserIdRef.current) {
            mySymbolRef.current = payload.symbols[myUserIdRef.current]
          }

          const usernames = payload.usernames as Record<string, string> | undefined
          const opponentNameFromPayload =
            usernames && myUserIdRef.current
              ? Object.entries(usernames).find(([userId]) => userId !== myUserIdRef.current)?.[1]
              : undefined

          // Server sent updated board state
          setGameState(prev => ({
            board: payload.board,
            currentTurn: payload.currentTurn,
            winner: payload.winner ?? null,
            mySymbol: mySymbolRef.current ?? prev?.mySymbol ?? 'X',
            opponentName: opponentNameFromPayload ?? prev?.opponentName ?? 'Opponent',
            timeLeft: payload.timeLeft,
            rematchRequestedByMe: false,
            opponentWantsRematch: false,
          }))

          setStatus('in_match')
        }

        if (data.op_code === OP_TIMER) {
          // Server sent timer tick
          setGameState(prev => prev ? { ...prev, timeLeft: payload.timeLeft } : prev)
        }

        if (data.op_code === OP_GAMEOVER) {
          // Game ended
          setGameState(prev => prev ? {
            ...prev,
            board: payload.board ?? prev.board,
            winner: payload.winner,
            rematchRequestedByMe: false,
            opponentWantsRematch: false,
          } : prev)
          setStatus('gameover')
          fetchLeaderboard(client, session)
        }

        if (data.op_code === OP_REMATCH) {
          applyRematchReadyPlayers(payload.readyPlayers as string[] | undefined)
        }
      }

      // 5. Listen for when matchmaker finds a match
      socket.onmatchmakermatched = async (matched: MatchmakerMatched) => {
        try {
          console.log('Nakama: matchmaker matched:', JSON.stringify(matched))

          // Join using match_id from server
          const match = await socket.joinMatch(matched.match_id, matched.token)
          console.log('Nakama: joined match', match.match_id)
          matchIdRef.current = match.match_id

          // Parse presences from matched.users
          const users = matched.users ?? []
          const presenceList: Presence[] = users.map((u) => u.presence)
          console.log('Nakama: presences', JSON.stringify(presenceList))

          // Do NOT guess X or O based on index, as Nakama's array order is random per client!
          // The server's OP_STATE will definitively assign mySymbolRef.current.

          // Get opponent
          const mySessionId = matched.self?.presence?.session_id
          const opponent = presenceList.find((p) => p.session_id !== mySessionId)

          console.log('Nakama: opponent', opponent?.username)
          console.log('Nakama: I am (pending OP_STATE)', mySymbolRef.current)

          setGameState({
            board: Array(9).fill(null),
            currentTurn: 'X',
            winner: null,
            mySymbol: mySymbolRef.current ?? 'X',
            opponentName: opponent?.username ?? 'Opponent',
            timeLeft: 30,
            rematchRequestedByMe: false,
            opponentWantsRematch: false,
          })

          setStatus('in_match')

        } catch (err) {
          console.error('Nakama: failed to join match:', err)
          setStatus('error')
        }
      }

      await socket.connect(session, true)
      console.log('Nakama: socket connected')

      // 6. Start matchmaking — find any available opponent
      await socket.addMatchmaker('*', 2, 2)
      console.log('Nakama: matchmaking started')
      setStatus('matchmaking')

    } catch (err) {
      console.error('Nakama error:', err)
      setStatus('error')
    }
  }

  // Send a move to the server
  const sendMove = (cellIndex: number) => {
    if (!socketRef.current || !matchIdRef.current) {
      console.warn('Nakama: not in a match')
      return
    }
    if (gameState?.winner) {
      console.warn('Nakama: game is already over! Ignoring click.')
      return
    }
    const payload = new TextEncoder().encode(JSON.stringify({ cell: cellIndex }))
    void socketRef.current
      .sendMatchState(matchIdRef.current, OP_MOVE, payload)
      .then(() => {
        console.log('Nakama: move sent', cellIndex)
      })
      .catch((err) => {
        console.error('Nakama: failed to send move', err)
        setStatus('error')
      })
  }

  const requestRematch = () => {
    if (!socketRef.current || !matchIdRef.current) {
      console.warn('Nakama: cannot request rematch, match not available')
      return
    }

    if (!gameState?.winner) {
      console.warn('Nakama: rematch is only available after game over')
      return
    }

    setGameState(prev => prev && !prev.rematchRequestedByMe ? { ...prev, rematchRequestedByMe: true } : prev)
    const payload = new TextEncoder().encode(JSON.stringify({ request: true }))
    void socketRef.current
      .sendMatchState(matchIdRef.current, OP_REMATCH, payload)
      .then(() => {
        console.log('Nakama: rematch requested')
      })
      .catch((err) => {
        console.error('Nakama: failed to request rematch', err)
        setStatus('error')
      })
  }

  // Fetch leaderboard after game ends
  const fetchLeaderboard = async (client: Client, session: Session) => {
    try {
      const result = await client.listLeaderboardRecords(session, 'tictactoe_wins', [], 10)
      const entries: LeaderboardEntry[] = (result.records ?? []).map((r: LeaderboardRecord, i: number) => ({
        rank: i + 1,
        username: r.username ?? 'Unknown',
        wins: Number(r.score ?? 0),
        losses: 0,
      }))
      setLeaderboard(entries)
    } catch (err) {
      console.error('Nakama: leaderboard fetch failed', err)
    }
  }

  const disconnect = () => {
    socketRef.current?.disconnect(true)
    clientRef.current  = null
    socketRef.current  = null
    sessionRef.current = null
    matchIdRef.current = null
    myUserIdRef.current = null
    mySymbolRef.current = null
    setStatus('idle')
    setGameState(null)
    setLeaderboard([])
  }

  // Retry rematch requests in case the first packet is dropped.
  useEffect(() => {
    if (
      status !== 'gameover' ||
      !gameState?.winner ||
      !gameState.rematchRequestedByMe ||
      gameState.opponentWantsRematch ||
      !socketRef.current ||
      !matchIdRef.current
    ) {
      return
    }

    const intervalId = window.setInterval(() => {
      if (!socketRef.current || !matchIdRef.current) return
      const retryPayload = new TextEncoder().encode(JSON.stringify({ request: true, retry: true }))
      void socketRef.current
        .sendMatchState(matchIdRef.current, OP_REMATCH, retryPayload)
        .then(() => {
          console.log('Nakama: rematch request retried')
        })
        .catch((err) => {
          console.error('Nakama: rematch retry failed', err)
          setStatus('error')
        })
    }, 2500)

    return () => { window.clearInterval(intervalId) }
  }, [status, gameState?.winner, gameState?.rematchRequestedByMe, gameState?.opponentWantsRematch])

  useEffect(() => {
    return () => { disconnect() }
  }, [])

  return { status, gameState, leaderboard, connect, sendMove, requestRematch, disconnect }
}
