import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import './Navbar.css'

const Navbar = () => {
  const { user } = useAuth()
  const avatarLetter = user?.name?.charAt(0).toUpperCase() || ''

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h1 className="navbar-logo">FinCred</h1>
      </div>
      <div className="navbar-right">
        {user ? (
          <Link to="/profile" className="user-info">
            {user.profileImage ? (
              <img src={user.profileImage} alt="avatar" className="nav-avatar" />
            ) : (
              <div className="nav-avatar-fallback">{avatarLetter}</div>
            )}
            <span className="user-name">{user.name}</span>
            {user.verified && <span className="verified-badge">✔</span>}
          </Link>
        ) : (
          <>
            <Link to="/login" className="nav-btn">Login</Link>
            <Link to="/register" className="nav-btn primary">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
