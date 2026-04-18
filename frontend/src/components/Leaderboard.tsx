import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Leaderboard.css'

export interface LeaderboardUser {
  _id: string
  name: string
  influenceLevel: number
  profileImage?: string
}

interface LeaderboardProps {
  users: LeaderboardUser[]
  isLoading: boolean
}

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M7 3h10v2h2a1 1 0 0 1 1 1v1a5 5 0 0 1-5 5h-.35A5.99 5.99 0 0 1 13 15.92V18h3v2H8v-2h3v-2.08A5.99 5.99 0 0 1 9.35 12H9a5 5 0 0 1-5-5V6a1 1 0 0 1 1-1h2V3Zm10 4V7h1a3 3 0 0 0-3-3h-1v4a4 4 0 0 0 3 3.87V7ZM7 7v4.87A4 4 0 0 1 4 8V7h3Z"
      fill="currentColor"
    />
  </svg>
)

const Leaderboard = ({ users, isLoading }: LeaderboardProps) => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="leaderboard-trigger"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <span className="leaderboard-trigger-icon">
          <TrophyIcon />
        </span>
        <span className="leaderboard-trigger-copy">
          <span className="leaderboard-trigger-title">Top Investors</span>
          <span className="leaderboard-trigger-subtitle">
            {isLoading ? 'Loading the current top 5' : 'Tap to view the top  investors'}
          </span>
        </span>
      </button>

      {isOpen && (
        <div className="leaderboard-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="leaderboard-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="leaderboard-header">
              <div>
                <h2 className="leaderboard-title">Top Investors</h2>
                   </div>
              <button type="button" className="leaderboard-close" onClick={() => setIsOpen(false)}>
                Close
              </button>
            </div>

            <div className="leaderboard-list">
              {isLoading ? (
                <div className="leaderboard-empty">Loading investors...</div>
              ) : users.length === 0 ? (
                <div className="leaderboard-empty">No investors with influence yet.</div>
              ) : (
                users.slice(0, 5).map((leader, index) => (
                  <button
                    key={leader._id}
                    type="button"
                    className={`leaderboard-item ${index === 0 ? 'leaderboard-item-top' : ''}`}
                    onClick={() => {
                      setIsOpen(false)
                      navigate(`/profile/${leader._id}`)
                    }}
                  >
                    <span className="leaderboard-rank">#{index + 1}</span>

                    {leader.profileImage ? (
                      <img
                        src={leader.profileImage}
                        alt={`${leader.name} avatar`}
                        className="leaderboard-avatar"
                      />
                    ) : (
                      <span className="leaderboard-avatar leaderboard-avatar-fallback">
                        {leader.name.charAt(0).toUpperCase()}
                      </span>
                    )}

                    <div className="leaderboard-info">
                      <span className="leaderboard-name">{leader.name}</span>
                      <span className="leaderboard-score">⭐ {Math.floor(leader.influenceLevel)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Leaderboard
