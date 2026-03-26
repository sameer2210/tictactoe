import { useEffect } from 'react'
import type { GameState } from '../types/game'
import type { UseNakamaReturn } from '../hooks/useNakama'

interface Props {
  username: string
  nakama: UseNakamaReturn
  onMatchFound: (state: GameState) => void
}

export default function Matchmaking({ username, nakama, onMatchFound }: Props) {
  const { status, gameState, connect } = nakama

  useEffect(() => {
    connect(username)
  }, [])

  useEffect(() => {
    if (status === 'in_match' && gameState) {
      onMatchFound(gameState)
    }
  }, [status, gameState])

  const statusText = {
    idle:       'Starting...',
    connecting: 'Connecting to server...',
    matchmaking:'Finding a player...',
    in_match:   'Match found!',
    gameover:   'Game over',
    error:      'Connection failed. Refresh and try again.',
  }

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-gray-900 rounded-2xl w-80 shadow-xl">
      {status !== 'error'
        ? <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        : <div className="text-red-400 text-3xl">✕</div>
      }
      <div className="text-center">
        <p className="text-lg font-semibold text-white">{statusText[status]}</p>
        <p className="text-sm text-gray-400 mt-1">Usually takes 10–20 seconds</p>
      </div>
      <p className="text-xs text-gray-600">Playing as: {username}</p>
    </div>
  )
}