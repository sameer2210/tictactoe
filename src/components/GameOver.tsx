import type { GameState, LeaderboardEntry } from '../types/game'
import Leaderboard from './Leaderboard'

interface Props {
  gameState: GameState
  leaderboard: LeaderboardEntry[]
  username: string
  onPlayAgain: () => void
}

export default function GameOver({ gameState, leaderboard, username, onPlayAgain }: Props) {
  const { winner, mySymbol, opponentName } = gameState
  const didWin = winner === mySymbol
  const isDraw = winner === 'draw'
  const waitingForOpponent = gameState.rematchRequestedByMe && !gameState.opponentWantsRematch
  const opponentReadyFirst = !gameState.rematchRequestedByMe && gameState.opponentWantsRematch

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-gray-900 rounded-2xl w-80 shadow-xl">
      <div className={`text-5xl font-black ${
        didWin ? 'text-yellow-400' : isDraw ? 'text-gray-400' : 'text-red-400'
      }`}>
        {didWin ? '🏆 Win!' : isDraw ? 'Draw' : 'Lost'}
      </div>

      <p className="text-gray-400 text-sm text-center">
        {didWin ? `You beat ${opponentName}!`
          : isDraw ? 'No winner this time'
          : `${opponentName} won this round`}
      </p>

      <Leaderboard entries={leaderboard} currentUsername={username} />

      {opponentReadyFirst && (
        <p className="text-xs text-teal-300 text-center">
          {opponentName} wants to play again.
        </p>
      )}

      {waitingForOpponent && (
        <p className="text-xs text-purple-300 text-center">
          Waiting for {opponentName} to accept rematch...
        </p>
      )}

      <button
        className="w-full bg-purple-600 hover:bg-purple-500 transition-colors rounded-lg py-2 font-semibold"
        onClick={onPlayAgain}
      >
        {waitingForOpponent ? 'Waiting for opponent... (tap again)' : 'Play again'}
      </button>
    </div>
  )
}
