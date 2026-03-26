import { useState } from 'react'

interface Props {
  onJoin: (username: string) => void
}

export default function Lobby({ onJoin }: Props) {
  const [name, setName] = useState('')

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-gray-900 rounded-2xl w-80 shadow-xl">
      <h1 className="text-2xl font-bold text-purple-400">Tic-Tac-Toe</h1>
      <p className="text-gray-400 text-sm text-center">
        Multiplayer • Real-time • Server-authoritative
      </p>

      <div className="w-full flex flex-col gap-2">
        <label className="text-sm text-gray-400">Your nickname</label>
        <input
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
          placeholder="Enter nickname..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onJoin(name.trim())}
          maxLength={20}
        />
      </div>

      <button
        className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors rounded-lg py-2 font-semibold"
        disabled={!name.trim()}
        onClick={() => onJoin(name.trim())}
      >
        Find a match
      </button>
    </div>
  )
}