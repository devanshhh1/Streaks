import { useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import ChatPreview from './ChatPreview'
import AddInvestmentForm, { InvestmentData } from './AddInvestmentForm'
import Leaderboard, { LeaderboardUser } from './Leaderboard'
import './Dashboard.css'

interface StreakInterface {
  _id?: string
  streakName: string
  streak: number
  lastDate: string
  dates: string[]
  done: boolean
  influenceLevel: number
  verified: boolean
  investmentAmount: number
  investmentType: string
  tenure: number
  bank: string
  autoDebit: boolean
  createdAt: string
  delayPenaltyApplied?: boolean
}

const API_BASE_URL = 'http://localhost:5030'

const normalizeNumber = (value: unknown, fallback = 0): number => {
  const parsedValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : fallback
}

const normalizeStreak = (streak: Partial<StreakInterface>): StreakInterface => ({
  _id: streak._id,
  streakName: streak.streakName ?? '',
  streak: normalizeNumber(streak.streak),
  lastDate: streak.lastDate ?? '',
  dates: Array.isArray(streak.dates) ? streak.dates : [],
  done: Boolean(streak.done),
  influenceLevel: normalizeNumber(streak.influenceLevel),
  verified: Boolean(streak.verified),
  investmentAmount: normalizeNumber(streak.investmentAmount),
  investmentType: streak.investmentType ?? '',
  tenure: normalizeNumber(streak.tenure),
  bank: streak.bank ?? '',
  autoDebit: Boolean(streak.autoDebit),
  createdAt: streak.createdAt ?? new Date().toISOString(),
  delayPenaltyApplied: Boolean(streak.delayPenaltyApplied),
})

const normalizeLeaderboardUser = (leader: Partial<LeaderboardUser>): LeaderboardUser => ({
  _id: leader._id ?? '',
  name: leader.name ?? 'Investor',
  influenceLevel: normalizeNumber(leader.influenceLevel),
  profileImage: typeof leader.profileImage === 'string' ? leader.profileImage : '',
})

const getTodayJson = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today.toJSON()
}

const Dashboard = () => {
  const [streakData, setStreakData] = useState<StreakInterface[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true)
  const { user, updateUser } = useAuth()
  const [newStreakModal, setNewStreakModal] = useState(false)
  const [streakDisplayModal, setStreakDisplayModal] = useState(false)
  const [streakDisplayName, setStreakDisplayName] = useState('')
  const focusRef = useRef<HTMLInputElement>(null)
  const [loadingStreaks, setLoadingStreaks] = useState<Set<string>>(new Set())
  const [showSuccessPopup, setShowSuccessPopup] = useState<string | null>(null)

  const fetchLeaderboard = async (showLoader = true) => {
    if (showLoader) {
      setIsLeaderboardLoading(true)
    }

    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard (${response.status})`)
      }

      const leaders = await response.json()
      setLeaderboard(
        Array.isArray(leaders)
          ? leaders.map((leader: Partial<LeaderboardUser>) => normalizeLeaderboardUser(leader))
          : []
      )
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setLeaderboard([])
    } finally {
      if (showLoader) {
        setIsLeaderboardLoading(false)
      }
    }
  }

  const syncUserInfluence = async () => {
    if (!user?.token) return

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        updateUser({
          influenceLevel: userData.influenceLevel,
          verified: userData.verified,
        })
        await fetchLeaderboard(false)
      }
    } catch (error) {
      console.error('Error syncing user influence:', error)
    }
  }

  useEffect(() => {
    void fetchLeaderboard()
  }, [])

  useEffect(() => {
    const fetchStreaks = async () => {
      if (!user?.token) return

      try {
        const response = await fetch(`${API_BASE_URL}/streaks`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch streaks (${response.status})`)
        }

        const fetchedStreaks = await response.json()
        const todayJson = getTodayJson()

        const processedStreaks = Array.isArray(fetchedStreaks)
          ? fetchedStreaks.map((streak: Partial<StreakInterface>) => {
              const normalizedStreak = normalizeStreak(streak)
              const isDone = normalizedStreak.lastDate === todayJson

              if (!isDone) {
                const hoursPassed =
                  (Date.now() - new Date(normalizedStreak.createdAt).getTime()) / (1000 * 60 * 60)
                const wasDelayed = hoursPassed > 24

                if (wasDelayed && !normalizedStreak.delayPenaltyApplied) {
                  fetch(`${API_BASE_URL}/streaks/penalty`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${user.token}`,
                    },
                    body: JSON.stringify({
                      type: 'broken_promise',
                      streakName: normalizedStreak.streakName,
                    }),
                  })
                    .then(() => {
                      normalizedStreak.delayPenaltyApplied = true
                    })
                    .catch((error) => {
                      console.error('Error applying penalty:', error)
                    })
                }
              }

              return {
                ...normalizedStreak,
                done: isDone,
              }
            })
          : []

        setStreakData(processedStreaks)
      } catch (error) {
        console.error('Error fetching streaks:', error)
      }
    }

    void fetchStreaks()
  }, [user?.token])

  useEffect(() => {
    if (focusRef.current != null) focusRef.current.focus()
  }, [newStreakModal, streakDisplayModal])

  const addNewStreak = async (data: InvestmentData) => {
    if (!user?.token) return

    const streakName = `${data.investmentType} - ${data.amount}`

    if (streakData.find((streak) => streak.streakName === streakName)) return

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    const newStreak: StreakInterface = {
      streakName,
      streak: 0,
      done: false,
      dates: [],
      lastDate: yesterday.toJSON(),
      influenceLevel: 0,
      verified: true,
      investmentAmount: data.amount,
      investmentType: data.investmentType,
      tenure: data.tenure,
      bank: data.bank,
      autoDebit: data.autoDebit,
      createdAt: new Date().toISOString(),
    }

    try {
      const response = await fetch(`${API_BASE_URL}/streaks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ ...newStreak, amount: data.amount }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Unable to create streak')
      }

      const createdStreak = normalizeStreak(await response.json())

      setStreakData((prev) => [...prev, createdStreak])
    } catch (error) {
      console.error('Error creating streak:', error)
    }
  }

  const serverUpdateStreak = async (changeStreakName: string) => {
    if (!user?.token) return

    const existingStreak = streakData.find((streak) => streak.streakName === changeStreakName)
    if (!existingStreak) return

    const todayJson = getTodayJson()
    const updatedPayload = {
      ...existingStreak,
      lastDate: todayJson,
      dates: [...existingStreak.dates, todayJson],
    }

    try {
      await fetch(`${API_BASE_URL}/streaks`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(updatedPayload),
      })

      setStreakData((prev) =>
        prev.map((streak) =>
          streak.streakName === changeStreakName
            ? {
                ...streak,
                done: true,
                streak: streak.streak + 1,
                lastDate: todayJson,
                dates: [...streak.dates, todayJson],
              }
            : streak
        )
      )

      await syncUserInfluence()
    } catch (error) {
      console.error('Error updating streak:', error)
    }

    setStreakDisplayModal(false)
  }

  const deleteStreak = async (streakName: string) => {
    if (!user?.token) return

    const nextStreaks = streakData.filter((streak) => streak.streakName !== streakName)
    setStreakData(nextStreaks)

    try {
      await fetch(`${API_BASE_URL}/streaks`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ streakName }),
      })

      await syncUserInfluence()
    } catch (error) {
      console.error('Error deleting streak:', error)
    }
  }

  const completeStreak = async (streakName: string) => {
    if (!user?.token) return

    setLoadingStreaks((prev) => new Set(prev).add(streakName))

    setTimeout(async () => {
      const existingStreak = streakData.find((streak) => streak.streakName === streakName)
      if (!existingStreak) {
        setLoadingStreaks((prev) => {
          const nextLoading = new Set(prev)
          nextLoading.delete(streakName)
          return nextLoading
        })
        return
      }

      const todayJson = getTodayJson()
      const updatedPayload = {
        ...existingStreak,
        lastDate: todayJson,
        dates: [...existingStreak.dates, todayJson],
        done: true,
        streak: existingStreak.streak + 1,
      }

      try {
        const response = await fetch(`${API_BASE_URL}/streaks`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(updatedPayload),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw new Error(errorData?.message || 'Unable to update streak')
        }

        const result = await response.json()
        const normalizedUpdatedStreak = normalizeStreak(result.updStreak)

        setStreakData((prev) =>
          prev.map((streak) =>
            streak.streakName === streakName ? { ...normalizedUpdatedStreak, done: true } : streak
          )
        )

        await syncUserInfluence()

        setShowSuccessPopup(streakName)
        setTimeout(() => {
          setShowSuccessPopup(null)
        }, 3000)
      } catch (error) {
        console.error('Error updating streak:', error)
      } finally {
        setLoadingStreaks((prev) => {
          const nextLoading = new Set(prev)
          nextLoading.delete(streakName)
          return nextLoading
        })
      }
    }, 3000)
  }

  const totalInfluenceLevel = normalizeNumber(user?.influenceLevel)

  return (
    <div className="dashboard-container">
      <div className="dashboard-stats">
        <div className="stat-pill influence-pill">Influence {'\u2B50'} {Math.floor(totalInfluenceLevel)}</div>
        <Leaderboard users={leaderboard} isLoading={isLeaderboardLoading} />
      </div>

      <div className="dashboard-content">
        <div className="streaks-section">
          <div className="section-header">
            <button className="add-streak-btn" onClick={() => setNewStreakModal(true)}>
              Promise To Invest
            </button>
          </div>

          <div className="streaks-grid">
            <div className="streak-column">
              <h3 className="column-title done">Completed Transactions</h3>
              <div className="streak-list">
                {streakData.filter((streak) => streak.done).map((streak) => (
                  <div
                    key={streak._id ?? streak.streakName}
                    className="streak-card done-card"
                    onClick={() => deleteStreak(streak.streakName)}
                  >
                    <div className="streak-header">
                      <span className="streak-name">{streak.investmentType}</span>
                      <span className="streak-name">₹{streak.investmentAmount.toFixed(0)}</span>
                      <span className="streak-count">{streak.streak}🔥</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="streak-column">
              <h3 className="column-title not-done">Pending Transactions</h3>
              <div className="streak-list">
                {streakData.filter((streak) => !streak.done).map((streak) => {
                  const hoursPassed =
                    (Date.now() - new Date(streak.createdAt).getTime()) / (1000 * 60 * 60)
                  const isDelayed = hoursPassed > 24
                  const isLoading = loadingStreaks.has(streak.streakName)

                  return (
                    <div
                      key={streak._id ?? streak.streakName}
                      className={`streak-card not-done-card ${isDelayed ? 'delayed' : ''}`}
                    >
                      <div className="streak-header">
                        <span className="streak-name">{streak.investmentType}</span>
                      <span className="streak-name">₹{streak.investmentAmount.toFixed(0)}</span>
                     
                      </div>
                      {isDelayed && (
                        <div className="delay-warning">Delay detected. Influence may drop.</div>
                      )}
                      {isLoading ? (
                        <div className="loading-state">
                          <div className="spinner"></div>
                          <span>Verifying transaction via Blostem...</span>
                        </div>
                      ) : (
                        <button
                          className="cta-button"
                          onClick={() => completeStreak(streak.streakName)}
                          disabled={isLoading}
                        >
                          {streak.investmentType === 'Savings Goal' ? 'Sync with Bank' : 'Complete Deposit'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <ChatPreview />
      </div>

      {newStreakModal && (
        <AddInvestmentForm
          onClose={() => setNewStreakModal(false)}
          onSubmit={(data) => {
            void addNewStreak(data)
            setNewStreakModal(false)
          }}
        />
      )}

      {streakDisplayModal && (
        <div className="modal-overlay" onClick={() => setStreakDisplayModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Mark Complete?</h2>
            <p>Complete "{streakDisplayName}"?</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setStreakDisplayModal(false)}>
                Cancel
              </button>
              <button className="btn-complete" onClick={() => void serverUpdateStreak(streakDisplayName)}>
                Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <div className="popup-success">
              <svg className="popup-checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <h3>Transaction Completed</h3>
              <p>Verification successful!</p>
            </div>
            <button className="popup-button" onClick={() => setShowSuccessPopup(null)}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
