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
    idle:       'Preparing matchmaker...',
    connecting: 'Connecting to game server...',
    matchmaking:'Finding a random player...',
    in_match:   'Match found.',
    gameover:   'Round complete.',
    error:      'Unable to connect.',
  }

  return (
    <section className="screen screen-matchmaking">
      <div className="match-center">
        <p className="match-title">{statusText[status]}</p>
        <p className="match-subtitle">
          {status === 'error'
            ? 'Please refresh and try again.'
            : 'It usually takes 26 seconds.'}
        </p>
        <button type="button" className="ghost-btn" disabled>
          Cancel
        </button>
      </div>
      <p className="match-player">Logged in as {username}</p>
    </section>
  )
}
