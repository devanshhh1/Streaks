import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import './Profile.css'

const API_BASE_URL = 'http://localhost:5030'
const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024
const ALLOWED_PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

interface ProfileUser {
  _id: string
  name: string
  email?: string
  influenceLevel: number
  verified: boolean
  profileImage?: string
  token?: string
  tokenExpiry?: string
}

const Profile = () => {
  const { user, logout, login } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const isOwnProfile = useMemo(() => !id || id === user?._id, [id, user?._id])

  useEffect(() => {
    if (!user) return

    if (isOwnProfile) {
      setProfileUser(user)
      setProfileError('')
      return
    }

    const fetchProfile = async () => {
      if (!id) return

      try {
        setIsLoadingProfile(true)
        setProfileError('')

        const response = await fetch(`${API_BASE_URL}/user/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw new Error(errorData?.message || 'Unable to load profile')
        }

        const fetchedProfile = await response.json()
        setProfileUser(fetchedProfile)
      } catch (error) {
        console.error('Profile fetch error:', error)
        setProfileUser(null)
        setProfileError('Unable to load this investor profile.')
      } finally {
        setIsLoadingProfile(false)
      }
    }

    void fetchProfile()
  }, [id, isOwnProfile, user])

  if (!user) {
    return <div>Please log in to view your profile.</div>
  }

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
    } catch (err) {
      console.error('Logout error:', err)
    }
    localStorage.removeItem('user')
    logout()
    navigate('/login')
  }

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !isOwnProfile) return

    setUploadError('')
    setUploadMessage('')

    if (!ALLOWED_PROFILE_IMAGE_TYPES.includes(file.type)) {
      setUploadError('Only JPG, PNG, WEBP, or GIF images are allowed.')
      e.target.value = ''
      return
    }

    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      setUploadError('Profile image must be 2MB or smaller.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = typeof reader.result === 'string' ? reader.result : ''

      if (!base64) {
        setUploadError('Unable to read this file. Please try another image.')
        e.target.value = ''
        return
      }

      try {
        setIsUploadingImage(true)

        const response = await fetch(`${API_BASE_URL}/user/${user._id}/profile-image`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ userId: user._id, profileImage: base64 }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw new Error(errorData?.message || 'Unable to update profile image')
        }

        const updatedUser = await response.json()
        login(updatedUser)
        setProfileUser(updatedUser)
        setUploadMessage('Profile photo updated successfully.')
      } catch (error) {
        console.error('Profile image upload error:', error)
        setUploadError(error instanceof Error ? error.message : 'Unable to update profile image')
      } finally {
        setIsUploadingImage(false)
        e.target.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  if (isLoadingProfile) {
    return <div className="profile-container">Loading profile...</div>
  }

  if (!profileUser) {
    return <div className="profile-container">{profileError || 'Profile not found.'}</div>
  }

  const influenceLevel = Math.floor(profileUser.influenceLevel || 0)
  const investorLevel = influenceLevel >= 100 ? 'Elite' : influenceLevel >= 50 ? 'Rising' : 'Starter'

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-photo">
            {profileUser.profileImage ? (
              <img src={profileUser.profileImage} alt="profile" className="profile-img" />
            ) : (
              <span className="photo-placeholder">{profileUser.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="profile-header-right">
            <div className="profile-header-row">
              <h1 className="profile-name">{profileUser.name}</h1>
              {isOwnProfile && (
                <button className="logout-btn-profile" onClick={handleLogout}>
                  Logout
                </button>
              )}
            </div>
            {profileUser.verified && <div className="verified-badge-profile"> Verified Investor</div>}
          </div>
        </div>

        <div className="profile-stats-grid">
          {isOwnProfile && profileUser.email && (
            <div className="stat-card">
              
              <div className="stat-content">
                <div className="stat-label">Email</div>
                <div className="stat-value">{profileUser.email}</div>
              </div>
            </div>
          )}

          <div className="stat-card">
            
            <div className="stat-content">
              <div className="stat-label">Influence Level</div>
              <div className="stat-value">{influenceLevel}</div>
            </div>
          </div>

          <div className="stat-card">
           
            <div className="stat-content">
              <div className="stat-label">Investor Level</div>
              <div className="stat-value">{investorLevel}</div>
            </div>
          </div>
        </div>

        {isOwnProfile && (
          <div className="profile-section">
            <h3>Profile Photo</h3>
            
            {uploadError && <p className="photo-feedback photo-feedback-error">{uploadError}</p>}
            {uploadMessage && <p className="photo-feedback photo-feedback-success">{uploadMessage}</p>}
            <label className={`photo-upload ${isUploadingImage ? 'photo-upload-disabled' : ''}`}>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleImageUpload}
                disabled={isUploadingImage}
              />
              <span>{isUploadingImage ? 'Uploading...' : 'Click to upload photo'}</span>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
