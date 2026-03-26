import type { LeaderboardEntry } from '../types/game'

interface Props {
  entries: LeaderboardEntry[]
  currentUsername: string
}

export default function Leaderboard({ entries, currentUsername }: Props) {
  return (
    <div className="w-full bg-gray-800 rounded-xl p-4 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Leaderboard
      </h2>

      {entries.length === 0 && (
        <p className="text-xs text-gray-600 text-center py-2">No data yet</p>
      )}

      {entries.map((entry) => {
        const isMe = entry.username === currentUsername
        const total = entry.wins + entry.losses
        const winRate = total > 0 ? Math.round((entry.wins / total) * 100) : 0

        return (
          <div
            key={entry.username}
            className={`flex items-center justify-between px-3 py-2 rounded-lg ${
              isMe ? 'bg-purple-900 border border-purple-700' : 'bg-gray-700'
            }`}
          >
            {/* Rank + name */}
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold w-5 text-center ${
                entry.rank === 1 ? 'text-yellow-400' :
                entry.rank === 2 ? 'text-gray-300' :
                entry.rank === 3 ? 'text-amber-600' :
                'text-gray-500'
              }`}>
                {entry.rank}
              </span>
              <span className={`text-sm font-medium ${isMe ? 'text-purple-300' : 'text-white'}`}>
                {entry.username} {isMe && '(you)'}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs">
              <span className="text-teal-400">{entry.wins}W</span>
              <span className="text-red-400">{entry.losses}L</span>
              <span className="text-gray-400">{winRate}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}