import { ChangeEvent } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate } from 'react-router-dom'
import './Profile.css'

const Profile = () => {
  const { user, logout, login } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return <div>Please log in to view your profile.</div>
  }

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5030/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
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
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      const updatedUser = { ...user, profileImage: base64 }
      login(updatedUser)
    }
    reader.readAsDataURL(file)
  }

  // For now, hardcode influence level, in real app fetch from API
  const influenceLevel = user.influenceLevel

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-photo">
            {user.profileImage ? (
              <img src={user.profileImage} alt="profile" className="profile-img" />
            ) : (
              <span className="photo-placeholder">{user.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="profile-header-right">
            <div className="profile-header-row">
              <h1 className="profile-name">{user.name}</h1>
              <button className="logout-btn-profile" onClick={handleLogout}>
                Logout
              </button>
            </div>
            {user.verified && <div className="verified-badge-profile">✔ Verified Investor</div>}
          </div>
        </div>

        <div className="profile-stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📧</div>
            <div className="stat-content">
              <div className="stat-label">Email</div>
              <div className="stat-value">{user.email}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-label">Influence Level</div>
              <div className="stat-value">{influenceLevel}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-label">Investor Level</div>
              <div className="stat-value">Elite</div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Profile Photo</h3>
          <label className="photo-upload">
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <span>Click to upload photo</span>
          </label>
        </div>
      </div>
    </div>
  )
}

export default Profile
