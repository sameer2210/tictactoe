import { useState } from 'react'

interface Props {
  onJoin: (username: string) => void
}

export default function Lobby({ onJoin }: Props) {
  const [name, setName] = useState('')

  return (
    <section className="screen screen-lobby">
      <header className="screen-header">
        <h1>Who are you?</h1>
        <span className="header-close" aria-hidden="true">x</span>
      </header>

      <div className="name-box">
        <input
          className="nickname-input"
          placeholder="Nickname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onJoin(name.trim())}
          maxLength={20}
        />
      </div>

      <button
        className="continue-btn"
        disabled={!name.trim()}
        onClick={() => onJoin(name.trim())}
      >
        Continue
      </button>
    </section>
  )
}
