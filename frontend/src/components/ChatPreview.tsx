import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import './ChatPreview.css'

interface DiscussionComment {
  _id?: string
  userId?: string
  text: string
  userName: string
  userInfluence: number
  timestamp: string
  isStatic?: boolean
}

const API_BASE_URL = 'http://localhost:5030'
const POLL_INTERVAL_MS = 5000
const POST_COOLDOWN_MS = 30000

const getInfluenceTier = (influence: number) => {
  if (influence > 50) return 'high'
  if (influence > 30) return 'medium'
  return 'low'
}

const getBadge = (influence: number) => {
  if (influence > 50) return 'Expert'
  if (influence > 30) return 'Reliable'
  return ''
}

const ChatPreview = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [comments, setComments] = useState<DiscussionComment[]>([])
  const [commentText, setCommentText] = useState('')
  const [error, setError] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [lastPostTime, setLastPostTime] = useState(0)
  const [showAllComments, setShowAllComments] = useState(true)

  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/comments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch comments (${response.status})`)
      }

      const data = await response.json()
      setComments(Array.isArray(data) ? data : [])
    } catch (fetchError) {
      console.error('Error fetching comments:', fetchError)
    }
  }

  useEffect(() => {
    void fetchComments()

    const intervalId = window.setInterval(() => {
      void fetchComments()
    }, POLL_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const hiddenLowQualityCount = useMemo(
    () => comments.filter((comment) => comment.userInfluence <= 3).length,
    [comments]
  )

  const visibleComments = useMemo(
    () => (showAllComments ? comments : comments.filter((comment) => comment.userInfluence > 3)),
    [comments, showAllComments]
  )

  const displayedComments = useMemo(() => [ ...visibleComments], [visibleComments])

  const handlePost = async (event: FormEvent) => {
    event.preventDefault()

    if (!user) return

    const trimmedComment = commentText.trim()
    if (!trimmedComment) {
      setError('Write something before posting.')
      return
    }

    if (user.influenceLevel < 1) {
      setError('Complete at least 1 verified transaction to comment.')
      return
    }

    const now = Date.now()
    if (now - lastPostTime < POST_COOLDOWN_MS) {
      setError('Please wait before posting again.')
      return
    }

    try {
      setIsPosting(true)
      setError('')

      const response = await fetch(`${API_BASE_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ text: trimmedComment }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Unable to post comment')
      }

      setCommentText('')
      setLastPostTime(now)
      await fetchComments()
    } catch (postError) {
      const message = postError instanceof Error ? postError.message : 'Unable to post comment'
      setError(message)
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <div className="chat-preview-section">
      <div className="chat-header-row">
        <h3 className="chat-title">Financial Discussions</h3>
        {hiddenLowQualityCount > 0 && (
          <button
            type="button"
            className="chat-filter-btn"
            onClick={() => setShowAllComments((prev) => !prev)}
          >
            {showAllComments ? 'Hide low-quality comments' : 'Show all comments'}
          </button>
        )}
      </div>

      {user && (
        <form className="chat-composer" onSubmit={handlePost}>
          <textarea
            className="chat-textarea"
            placeholder="Share your financial insight..."
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            maxLength={500}
          />
          <div className="chat-composer-footer">
            <div className="chat-composer-meta">
              {user.influenceLevel < 1
                ? 'Complete at least 1 verified transaction to unlock comments.'
                : 'Comments are ranked by influence first.'}
            </div>
            <button
              type="submit"
              className="chat-post-btn"
              disabled={isPosting || !commentText.trim() || user.influenceLevel < 1}
            >
              {isPosting ? 'Posting...' : 'Post'}
            </button>
          </div>
          {error && <div className="chat-error">{error}</div>}
        </form>
      )}

      <div className="chat-messages">
        {displayedComments.map((comment, index) => {
          const influenceTier = getInfluenceTier(comment.userInfluence)
          const badge = getBadge(comment.userInfluence)
          const hasProfile = Boolean(comment.userId && !comment.isStatic)
          const className = `chat-message ${influenceTier}-influence ${comment.isStatic ? 'seeded-comment' : 'live-comment'} ${hasProfile ? 'chat-message-clickable' : ''}`
          const content = (
            <>
              <div className="chat-user-header">
                <div className="chat-user-meta">
                  <span className={`chat-username ${influenceTier === 'high' ? 'bold' : ''}`}>
                    {comment.userName}
                  </span>
                  {badge && <span className="chat-badge">{badge}</span>}
                 
                  {hasProfile && <span className="chat-profile-tag">View profile</span>}
                <span className="chat-influence">{'\u2B50'} {Math.floor(comment.userInfluence)}</span>
                </div>
                
              </div>
              <p className="chat-text">{comment.text}</p>
            </>
          )

          if (hasProfile && comment.userId) {
            return (
              <button
                key={comment._id ?? `${comment.userName}-${index}`}
                type="button"
                className={`${className} chat-message-button`}
                onClick={() => navigate(`/profile/${comment.userId}`)}
              >
                {content}
              </button>
            )
          }

          return (
            <div key={comment._id ?? `${comment.userName}-${index}`} className={className}>
              {content}
            </div>
          )
        })}

        {displayedComments.length === 0 && (
          <div className="chat-empty">No comments yet. Verified investors can start the discussion.</div>
        )}
      </div>
    </div>
  )
}

export default ChatPreview
