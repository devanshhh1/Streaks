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
        <button className="leaderboard-trigger-title">Top Investors</button>
        
        
      </button>

      {isOpen && (
        <div className="leaderboard-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="leaderboard-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="leaderboard-header">
              <h2 className="leaderboard-title">Top Investors</h2>
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
                      <span className="leaderboard-score">{`\u2B50 ${Math.floor(leader.influenceLevel)}`}</span>
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
