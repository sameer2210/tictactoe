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
  const resultMark = winner === 'draw' ? '=' : winner ?? mySymbol
  const resultTitle = didWin ? 'WINNER!' : isDraw ? 'DRAW' : 'DEFEAT'
  const pointsText = didWin ? '+200 pts' : isDraw ? '+80 pts' : '+0 pts'

  return (
    <section className="screen screen-gameover">
      <div className={`result-mark ${didWin ? 'result-win' : isDraw ? 'result-draw' : 'result-loss'}`}>
        {resultMark}
      </div>

      <div className="result-line">
        <span className="result-title">{resultTitle}</span>
        <span className="result-points">{pointsText}</span>
      </div>

      <p className="result-subtitle">
        {didWin ? `You beat ${opponentName}!`
          : isDraw ? 'No winner this time'
          : `${opponentName} won this round`}
      </p>

      <Leaderboard entries={leaderboard} currentUsername={username} />

      {opponentReadyFirst && (
        <p className="rematch-note rematch-note-opp">
          {opponentName} wants to play again.
        </p>
      )}

      {waitingForOpponent && (
        <p className="rematch-note rematch-note-me">
          Waiting for {opponentName} to accept rematch...
        </p>
      )}

      <button
        className="play-again-btn"
        onClick={onPlayAgain}
      >
        {waitingForOpponent ? 'Waiting for opponent... (tap again)' : 'Play again'}
      </button>
    </section>
  )
}
