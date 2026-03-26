import type { LeaderboardEntry } from '../types/game'

interface Props {
  entries: LeaderboardEntry[]
  currentUsername: string
}

export default function Leaderboard({ entries, currentUsername }: Props) {
  return (
    <section className="leaderboard-card">
      <h2 className="leaderboard-title">Leaderboard</h2>
      <div className="leaderboard-head">
        <span>Player</span>
        <span>W/L/D</span>
        <span>Score</span>
      </div>

      {entries.length === 0 && (
        <p className="leaderboard-empty">No data yet</p>
      )}

      {entries.map((entry) => {
        const isMe = entry.username === currentUsername
        const score = Math.max(0, (entry.wins * 200) - (entry.losses * 50))

        return (
          <div
            key={entry.username}
            className={`leaderboard-row ${isMe ? 'is-me' : ''}`}
          >
            <span className="leaderboard-player">
              {entry.rank}. {entry.username} {isMe ? '(you)' : ''}
            </span>
            <span className="leaderboard-record">
              {entry.wins}/{entry.losses}/0
            </span>
            <span className="leaderboard-score">
              {score}
            </span>
          </div>
        )
      })}
    </section>
  )
}
