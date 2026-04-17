import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  _id: string
  name: string
  email: string
  token: string
  tokenExpiry: string
  influenceLevel: number
  verified: boolean
  profileImage?: string
}

interface AuthContextType {
  user: User | null
  login: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

const normalizeUser = (userData: User): User => ({
  ...userData,
  influenceLevel: Number.isFinite(userData.influenceLevel) ? userData.influenceLevel : 0,
  verified: Boolean(userData.verified),
})

const hasValidSession = (userData: Partial<User> | null | undefined): userData is User => {
  if (!userData?.token || !userData.tokenExpiry) {
    return false
  }

  const tokenExpiry = new Date(userData.tokenExpiry)
  return !Number.isNaN(tokenExpiry.getTime()) && tokenExpiry > new Date()
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as Partial<User>
        if (hasValidSession(parsedUser)) {
          setUser(normalizeUser(parsedUser))
        } else {
          localStorage.removeItem('user')
        }
      } catch (error) {
        console.error('Unable to restore auth session:', error)
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = (userData: User) => {
    if (!hasValidSession(userData)) {
      console.error('Auth response did not include a usable token.')
      localStorage.removeItem('user')
      setUser(null)
      return
    }

    const normalizedUser = normalizeUser(userData)
    setUser(normalizedUser)
    localStorage.setItem('user', JSON.stringify(normalizedUser))
  }

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
