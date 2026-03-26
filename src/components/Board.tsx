import { useEffect } from 'react'
import type { GameState } from '../types/game'
import type { useNakama } from '../hooks/useNakama'
import Cell from './Cell'

interface Props {
  gameState: GameState
  nakama: ReturnType<typeof useNakama>
  onGameOver: () => void
}

export default function Board({ gameState, nakama, onGameOver }: Props) {
  const { sendMove, status } = nakama
  const isMyTurn = gameState.currentTurn === gameState.mySymbol

  // Watch for game over
  useEffect(() => {
    if (status === 'gameover' || gameState.winner) {
      onGameOver()
    }
  }, [status, gameState.winner])

  const handleMove = (index: number) => {
    if (!isMyTurn || gameState.board[index] || gameState.winner) return
    sendMove(index)  // send to Nakama — server validates and broadcasts back
  }

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-gray-900 rounded-2xl shadow-xl">
      {/* Header */}
      <div className="flex justify-between w-full text-sm text-gray-400">
        <span className="text-purple-400 font-semibold">
          You ({gameState.mySymbol})
        </span>
        <span>vs</span>
        <span className="text-teal-400 font-semibold">
          {gameState.opponentName}
        </span>
      </div>

      {/* Turn indicator */}
      <div className={`text-sm font-medium px-4 py-1 rounded-full ${
        isMyTurn ? 'bg-purple-900 text-purple-300' : 'bg-gray-800 text-gray-400'
      }`}>
        {isMyTurn ? 'Your turn' : `${gameState.opponentName}'s turn`}
      </div>

      {/* Timer */}
      <div className={`text-2xl font-bold tabular-nums ${
        gameState.timeLeft <= 10 ? 'text-red-400' : 'text-gray-300'
      }`}>
        {gameState.timeLeft}s
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2">
        {gameState.board.map((cell, i) => (
          <Cell
            key={i}
            value={cell}
            index={i}
            isMyTurn={isMyTurn}
            onClick={handleMove}
          />
        ))}
      </div>
    </div>
  )
}