import { useState } from 'react'
import Lobby from './components/Lobby'
import Matchmaking from './components/Matchmaking'
import Board from './components/Board'
import GameOver from './components/GameOver'
import { useNakama } from './hooks/useNakama'
import type { GameStatus } from './types/game'

function App() {
  const [screen, setScreen]   = useState<GameStatus>('lobby')
  const [username, setUsername] = useState('')
  const nakama = useNakama()

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">

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

      {screen === 'playing' && nakama.gameState && (
        <Board
          gameState={nakama.gameState}
          nakama={nakama}
          onGameOver={() => setScreen('gameover')}
        />
      )}

      {screen === 'gameover' && nakama.gameState && (
        <GameOver
          gameState={nakama.gameState}
          leaderboard={nakama.leaderboard}
          username={username}
          onPlayAgain={() => {
            nakama.disconnect()
            setScreen('matchmaking')
          }}
        />
      )}

    </div>
  )
}

export default App