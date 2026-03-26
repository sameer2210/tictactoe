import { useEffect } from 'react'
import type { GameState } from '../types/game'
import type { useNakama } from '../hooks/useNakama'
import Cell from './Cell'

interface Props {
  gameState: GameState
  nakama: ReturnType<typeof useNakama>
  username: string
  onGameOver: () => void
}

export default function Board({ gameState, nakama, username, onGameOver }: Props) {
  const { sendMove, status } = nakama
  const isMyTurn = gameState.currentTurn === gameState.mySymbol

  // Watch for game over
  useEffect(() => {
    if (status === 'gameover' || gameState.winner) {
      onGameOver()
    }
  }, [status, gameState.winner, onGameOver])

  const handleMove = (index: number) => {
    if (!isMyTurn || gameState.board[index] || gameState.winner) return
    sendMove(index)  // send to Nakama — server validates and broadcasts back
  }

  const opponentSymbol = gameState.mySymbol === 'X' ? 'O' : 'X'

  return (
    <section className="screen screen-board">
      <header className="board-players">
        <div className="board-player">
          <span className="board-player-name">{(username || 'You').toUpperCase()}</span>
          <span className="board-player-meta">(you) {gameState.mySymbol}</span>
        </div>
        <div className="board-player">
          <span className="board-player-name">{gameState.opponentName.toUpperCase()}</span>
          <span className="board-player-meta">(opp) {opponentSymbol}</span>
        </div>
      </header>

      <div className="board-turn">
        {gameState.currentTurn} Turn
      </div>

      <div className="game-grid" role="grid" aria-label="Tic tac toe board">
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

      <div className="board-footer">
        <span className="turn-chip">
          {isMyTurn ? 'Your move' : `${gameState.opponentName}'s move`}
        </span>
        <span className={`timer-chip ${gameState.timeLeft <= 10 ? 'timer-danger' : ''}`}>
          {gameState.timeLeft}s
        </span>
      </div>

      <button type="button" className="leave-room-btn" disabled>
        Leave room (2)
      </button>
    </section>
  )
}
