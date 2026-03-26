import { useState } from 'react'
import Lobby from './components/Lobby'
import Matchmaking from './components/Matchmaking'
import Board from './components/Board'
import GameOver from './components/GameOver'
import { useNakama } from './hooks/useNakama'
import type { GameStatus } from './types/game'
import './App.css'

function App() {
  const [screen, setScreen]   = useState<GameStatus>('lobby')
  const [username, setUsername] = useState('')
  const nakama = useNakama()
  const showBoard =
    Boolean(nakama.gameState) &&
    (
      screen === 'playing' ||
      (screen === 'gameover' && nakama.status === 'in_match' && !nakama.gameState?.winner)
    )

  return (
    <div className="app-shell">
      <main className="phone-frame">
        {screen === 'lobby' && (
          <Lobby
            onJoin={(name) => {
              setUsername(name)
              setScreen('matchmaking')
            }}
          />
        )}

        {screen === 'matchmaking' && (
          <Matchmaking
            username={username}
            nakama={nakama}
            onMatchFound={() => setScreen('playing')}
          />
        )}

        {showBoard && nakama.gameState && (
          <Board
            gameState={nakama.gameState}
            nakama={nakama}
            username={username}
            onGameOver={() => setScreen('gameover')}
          />
        )}

        {screen === 'gameover' && nakama.status === 'gameover' && nakama.gameState && (
          <GameOver
            gameState={nakama.gameState}
            leaderboard={nakama.leaderboard}
            username={username}
            onPlayAgain={() => {
              nakama.requestRematch()
            }}
          />
        )}
      </main>
    </div>
  )
}

export default App
