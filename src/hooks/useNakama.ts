import { useState, useEffect, useRef } from 'react'
import { Client, Session } from '@heroiclabs/nakama-js'
import type { Socket } from '@heroiclabs/nakama-js'
import type { GameState, LeaderboardEntry } from '../types/game'

const NAKAMA_HOST = 'localhost'
const NAKAMA_PORT = '7350'
const NAKAMA_KEY  = 'defaultkey'
const USE_SSL     = false

// Opcodes must match tictactoe.js
const OP_MOVE     = 1
const OP_STATE    = 2
const OP_TIMER    = 3
const OP_GAMEOVER = 4

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

  const connect = async (username: string) => {
    try {
      setStatus('connecting')

      // 1. Create Nakama client
      const client = new Client(NAKAMA_KEY, NAKAMA_HOST, NAKAMA_PORT, USE_SSL)
      clientRef.current = client

      // Use sessionStorage so each tab gets a unique ID
      const deviceId = sessionStorage.getItem('nakama_device_id') || crypto.randomUUID()
      sessionStorage.setItem('nakama_device_id', deviceId)

      const uniqueUsername = username + '_' + deviceId.slice(0, 6)
      const session = await client.authenticateDevice(deviceId, true, uniqueUsername)
      sessionRef.current = session
      myUserIdRef.current = session.user_id ?? null
      console.log('Nakama: authenticated as', uniqueUsername)

      // 3. Open WebSocket connection
      const socket = client.createSocket(USE_SSL, false)
      socketRef.current = socket

      // 4. Listen for match state updates from server
      socket.onmatchdata = (data) => {
        const payload = JSON.parse(new TextDecoder().decode(data.data))

        if (data.op_code === OP_STATE) {
          // Server sent updated board state
          setGameState(prev => ({
            board: payload.board,
            currentTurn: payload.currentTurn,
            winner: null,
            mySymbol: mySymbolRef.current ?? 'X',
            opponentName: prev?.opponentName ?? 'Opponent',
            timeLeft: payload.timeLeft,
          }))
        }

        if (data.op_code === OP_TIMER) {
          // Server sent timer tick
          setGameState(prev => prev ? { ...prev, timeLeft: payload.timeLeft } : prev)
        }

        if (data.op_code === OP_GAMEOVER) {
          // Game ended
          setGameState(prev => prev ? {
            ...prev,
            board: payload.board,
            winner: payload.winner,
          } : prev)
          setStatus('gameover')
          fetchLeaderboard(client, session)
        }
      }

      // 5. Listen for when matchmaker finds a match
      socket.onmatchmakermatched = async (matched) => {
  try {
    console.log('Nakama: matchmaker matched:', JSON.stringify(matched))

    // Join using token — NOT match_id
    const match = await socket.joinMatch(undefined, matched.token)
    console.log('Nakama: joined match', match.match_id)
    matchIdRef.current = match.match_id

    // Parse presences from matched.users
    const users = matched.users ?? []
    const presenceList = users.map((u: any) => u.presence)
    console.log('Nakama: presences', JSON.stringify(presenceList))

    // Find my symbol using session_id from matched.self
    const mySessionId = matched.self?.presence?.session_id
    const myIndex = presenceList.findIndex(
      (p: any) => p.session_id === mySessionId
    )
    mySymbolRef.current = myIndex === 0 ? 'X' : 'O'

    // Get opponent
    const opponent = presenceList.find(
      (p: any) => p.session_id !== mySessionId
    ) as any

    console.log('Nakama: I am', mySymbolRef.current)
    console.log('Nakama: opponent', opponent?.username)

    setGameState({
      board: Array(9).fill(null),
      currentTurn: 'X',
      winner: null,
      mySymbol: mySymbolRef.current ?? 'X',
      opponentName: opponent?.username ?? 'Opponent',
      timeLeft: 30,
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
    const payload = new TextEncoder().encode(JSON.stringify({ cell: cellIndex }))
    socketRef.current.sendMatchState(matchIdRef.current, OP_MOVE, payload)
    console.log('Nakama: move sent', cellIndex)
  }

  // Fetch leaderboard after game ends
  const fetchLeaderboard = async (client: Client, session: Session) => {
    try {
      const result = await client.listLeaderboardRecords(session, 'tictactoe_wins', [], 10)
      const entries: LeaderboardEntry[] = (result.records ?? []).map((r: any, i: number) => ({
        rank: i + 1,
        username: r.username ?? 'Unknown',
        wins: parseInt(r.score ?? '0'),
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
  }

  useEffect(() => {
    return () => { disconnect() }
  }, [])

  return { status, gameState, leaderboard, connect, sendMove, disconnect }
}