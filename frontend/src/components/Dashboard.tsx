import { useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import ChatPreview from './ChatPreview'
import Leaderboard, { LeaderboardUser } from './Leaderboard'
import './Dashboard.css'
import { ConsistencyHeatmap } from './ConsistencyHeatmap'
import { StreakMenu } from './StreakMenu'
import { RecurringStreakForm } from './RecurringStreakForm'
import type { RecurringStreakData } from './RecurringStreakForm'

interface StreakInterface {
  _id?: string
  streakName: string
  frequency: 'weekly' | 'monthly'
  streakCount: number
  nextDueDate: string
  completionHistory: Array<{ date: string; status: 'success' | 'missed' }>
  status: 'pending' | 'completed'
  influenceLevel: number
  verified: boolean
  investmentAmount: number
  investmentType: string
  tenure: number
  bank: string
  autoDebit: boolean
  createdAt: string
  updatedAt: string
}

const API_BASE_URL = 'http://localhost:5030'

const normalizeNumber = (value: unknown, fallback = 0): number => {
  const parsedValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : fallback
}

const normalizeStreak = (streak: Partial<StreakInterface>): StreakInterface => ({
  _id: streak._id,
  streakName: streak.streakName ?? '',
  frequency: streak.frequency ?? 'weekly',
  streakCount: normalizeNumber(streak.streakCount),
  nextDueDate: streak.nextDueDate ?? new Date().toISOString(),
  completionHistory: Array.isArray(streak.completionHistory) ? streak.completionHistory : [],
  status: streak.status ?? 'pending',
  influenceLevel: normalizeNumber(streak.influenceLevel),
  verified: Boolean(streak.verified),
  investmentAmount: normalizeNumber(streak.investmentAmount),
  investmentType: streak.investmentType ?? '',
  tenure: normalizeNumber(streak.tenure),
  bank: streak.bank ?? '',
  autoDebit: Boolean(streak.autoDebit),
  createdAt: streak.createdAt ?? new Date().toISOString(),
  updatedAt: streak.updatedAt ?? new Date().toISOString(),
})

const normalizeLeaderboardUser = (leader: Partial<LeaderboardUser>): LeaderboardUser => ({
  _id: leader._id ?? '',
  name: leader.name ?? 'Investor',
  influenceLevel: normalizeNumber(leader.influenceLevel),
  profileImage: typeof leader.profileImage === 'string' ? leader.profileImage : '',
})

const formatDateInputValue = (dateValue?: string) => {
  const date = new Date(dateValue ?? '')

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const formatDueDate = (dateValue: string) => {
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return 'Not set'
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const Dashboard = () => {
  const { user, updateUser } = useAuth()
  const [streakData, setStreakData] = useState<StreakInterface[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true)
  const [loadingStreaks, setLoadingStreaks] = useState<Set<string>>(new Set())
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingStreak, setEditingStreak] = useState<StreakInterface | null>(null)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [selectedStreak, setSelectedStreak] = useState<StreakInterface | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
    } catch (fetchError) {
      console.error('Error fetching leaderboard:', fetchError)
      setLeaderboard([])
    } finally {
      if (showLoader) {
        setIsLeaderboardLoading(false)
      }
    }
  }

  const syncUserInfluence = async () => {
    if (!user?.token) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      })

      if (!response.ok) {
        return
      }

      const userData = await response.json()
      updateUser({
        influenceLevel: userData.influenceLevel,
        verified: userData.verified,
      })
      await fetchLeaderboard(false)
    } catch (syncError) {
      console.error('Error syncing user influence:', syncError)
    }
  }

  const fetchStreaks = async () => {
    if (!user?.token) {
      return
    }

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
      setStreakData(
        Array.isArray(fetchedStreaks)
          ? fetchedStreaks.map((streak: Partial<StreakInterface>) => normalizeStreak(streak))
          : []
      )
      setError(null)
    } catch (fetchError) {
      console.error('Error fetching streaks:', fetchError)
      setError('Unable to load your streaks right now.')
    }
  }

  useEffect(() => {
    void fetchLeaderboard()
  }, [])

  useEffect(() => {
    void fetchStreaks()
  }, [user?.token])

  const handleCreateStreak = async (data: RecurringStreakData) => {
    if (!user?.token) {
      setError('Authentication required. Please log in.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/streaks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || `Error: ${response.status}`)
      }

      const createdStreak = normalizeStreak(await response.json())
      setStreakData((previous) => [...previous, createdStreak])
      setShowCreateForm(false)
      await syncUserInfluence()
    } catch (createError) {
      const errorMessage = createError instanceof Error ? createError.message : 'Failed to create streak'
      setError(errorMessage)
      throw createError
    } finally {
      setLoading(false)
    }
  }

  const handleEditStreak = (streakId: string) => {
    const streakToEdit = streakData.find((streak) => streak._id === streakId)

    if (!streakToEdit) {
      setError('Unable to find that streak.')
      return
    }

    setEditingStreak(streakToEdit)
  }

  const handleUpdateStreak = async (data: RecurringStreakData) => {
    if (!user?.token || !editingStreak?._id) {
      setError('Authentication required. Please log in.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/streaks/${editingStreak._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          streakName: data.streakName,
          frequency: data.frequency,
          investmentAmount: data.investmentAmount,
          nextDueDate: data.nextDueDate,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Failed to update streak')
      }

      const updatedStreak = normalizeStreak(await response.json())
      setStreakData((previous) =>
        previous.map((streak) => (streak._id === updatedStreak._id ? updatedStreak : streak))
      )
      setEditingStreak(null)
      await syncUserInfluence()
    } catch (updateError) {
      const errorMessage = updateError instanceof Error ? updateError.message : 'Failed to update streak'
      setError(errorMessage)
      throw updateError
    } finally {
      setLoading(false)
    }
  }

  const handleViewHeatmap = async (streakId: string) => {
    if (!user?.token) {
      setError('Authentication required. Please log in.')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/streaks/${streakId}/heatmap`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to get heatmap')
      }

      const streak = streakData.find((item) => item._id === streakId)
      if (!streak) {
        throw new Error('Streak not found')
      }

      setSelectedStreak(streak)
      setShowHeatmap(true)
    } catch (heatmapError) {
      const errorMessage = heatmapError instanceof Error ? heatmapError.message : 'Failed to load heatmap'
      setError(errorMessage)
    }
  }

  const handleDeleteStreak = async (streakId: string) => {
    if (!window.confirm('Are you sure you want to delete this streak?')) {
      return
    }

    if (!user?.token) {
      setError('Authentication required. Please log in.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/streaks/${streakId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Failed to delete streak')
      }

      setStreakData((previous) => previous.filter((streak) => streak._id !== streakId))
      await syncUserInfluence()
    } catch (deleteError) {
      const errorMessage = deleteError instanceof Error ? deleteError.message : 'Failed to delete streak'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const completeStreak = async (streakId: string, amount: number) => {
    if (!user?.token) {
      setError('Authentication required. Please log in.')
      return
    }

    setLoadingStreaks((previous) => new Set(previous).add(streakId))
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/streaks/${streakId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ investmentAmount: amount }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Unable to complete streak')
      }

      await fetchStreaks()
      await syncUserInfluence()

      setShowSuccessPopup(streakId)
      setTimeout(() => {
        setShowSuccessPopup(null)
      }, 3000)
    } catch (completeError) {
      const errorMessage = completeError instanceof Error ? completeError.message : 'Unable to complete streak'
      setError(errorMessage)
    } finally {
      setLoadingStreaks((previous) => {
        const nextLoading = new Set(previous)
        nextLoading.delete(streakId)
        return nextLoading
      })
    }
  }

  const totalInfluenceLevel = normalizeNumber(user?.influenceLevel)

  return (
    <div className="dashboard-container">
      <div className="dashboard-stats">
        <div className="stat-pill influence-pill">
          <span className="influence-pill-label">Influence</span>
          <span className="influence-pill-value">⭐ {Math.floor(totalInfluenceLevel)}</span>
        </div>
        <Leaderboard users={leaderboard} isLoading={isLeaderboardLoading} />
      </div>

      <div className="dashboard-content">
        <div className="streaks-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Your Investment Streaks</h2>
              <p className="section-subtitle">Track recurring deposits, edit upcoming schedules, and keep momentum visible.</p>
            </div>
            <button className="add-streak-btn" onClick={() => setShowCreateForm(true)}>
              Create New Streak
            </button>
          </div>

          {streakData.length === 0 ? (
            <div className="empty-state">
              <h3>No streaks yet</h3>
              <p>Create your first recurring investment streak to start building influence.</p>
            </div>
          ) : (
            <div className="streaks-grid">
              {streakData.map((streak) => {
                const streakId = streak._id ?? ''
                const isCompleting = loadingStreaks.has(streakId)

                return (
                  <div key={streakId} className="streak-card">
                    <div className="streak-card-header">
                      <div className="streak-info">
                        <span className="frequency-badge">
                          {streak.frequency === 'weekly' ? 'Weekly' : 'Monthly'}
                        </span>
                        <h3 className="streak-name">{streak.streakName}</h3>
                        <p className="streak-supporting-text">
                          {streak.investmentType || 'Recurring investment'}
                          {streak.bank ? ` with ${streak.bank}` : ''}
                        </p>
                      </div>

                      <StreakMenu
                        streakId={streakId}
                        streakName={streak.streakName}
                        onViewHeatmap={handleViewHeatmap}
                        onEdit={handleEditStreak}
                        onDelete={handleDeleteStreak}
                      />
                    </div>

                    <div className="streak-highlight-grid">
                      <div className="stat stat-highlight">
                        <span className="stat-label">Amount</span>
                        <span className="stat-value stat-value-money">Rs {streak.investmentAmount.toLocaleString()}</span>
                      </div>
                      <div className="stat stat-highlight">
                        <span className="stat-label">Next Due Date</span>
                        <span className="stat-value stat-value-neutral">{formatDueDate(streak.nextDueDate)}</span>
                      </div>
                    </div>

                    <div className="streak-meta-grid">
                      <div className="stat">
                        <span className="stat-label">Completed</span>
                        <span className="stat-value">{streak.streakCount}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Status</span>
                        <span className={`status-chip ${streak.status === 'completed' ? 'status-chip-completed' : 'status-chip-pending'}`}>
                          {streak.status === 'completed' ? 'Completed today' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="streak-details">
                      {streak.autoDebit && <span className="detail-tag">Auto-debit</span>}
                      {streak.tenure > 0 && <span className="detail-tag">{streak.tenure} month tenure</span>}
                      {streak.verified && <span className="detail-tag">Verified</span>}
                    </div>

                    {streak.status === 'pending' && (
                      <button
                        className="btn-complete"
                        onClick={() => completeStreak(streakId, streak.investmentAmount)}
                        disabled={isCompleting}
                      >
                        {isCompleting ? 'Processing...' : 'Complete Deposit'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <ChatPreview />
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>x</button>
        </div>
      )}

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <RecurringStreakForm
              onSubmit={handleCreateStreak}
              onCancel={() => setShowCreateForm(false)}
              isLoading={loading}
              mode="create"
              title="Create New Streak"
              submitLabel="Create Streak"
            />
          </div>
        </div>
      )}

      {editingStreak && (
        <div className="modal-overlay" onClick={() => setEditingStreak(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <RecurringStreakForm
              onSubmit={handleUpdateStreak}
              onCancel={() => setEditingStreak(null)}
              isLoading={loading}
              mode="edit"
              title="Edit Streak"
              submitLabel="Save Changes"
              initialData={{
                streakName: editingStreak.streakName,
                frequency: editingStreak.frequency,
                investmentAmount: editingStreak.investmentAmount,
                nextDueDate: formatDateInputValue(editingStreak.nextDueDate),
              }}
            />
          </div>
        </div>
      )}

      {showHeatmap && selectedStreak && (
        <ConsistencyHeatmap
          completionHistory={selectedStreak.completionHistory || []}
          streakName={selectedStreak.streakName}
          onClose={() => {
            setShowHeatmap(false)
            setSelectedStreak(null)
          }}
        />
      )}

      {showSuccessPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <div className="popup-success">
              <h3>Transaction Completed</h3>
              <p>Verification successful.</p>
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
