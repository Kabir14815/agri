import { createContext, useContext, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api } from '../api.js'

const UserAuthContext = createContext(null)

function getStoredSession() {
  const token =
    localStorage.getItem('kgf_token') || localStorage.getItem('kgf_franchisee_token')
  let user = null
  try {
    user = JSON.parse(
      localStorage.getItem('kgf_user') ||
        localStorage.getItem('kgf_franchisee_user') ||
        'null',
    )
  } catch {
    user = null
  }
  return { token, user }
}

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredSession().user)
  const [bootstrapped, setBootstrapped] = useState(false)

  useEffect(() => {
    const { token } = getStoredSession()
    if (!token) {
      setBootstrapped(true)
      return
    }
    api
      .userDashboard()
      .then((data) => {
        setUser(data)
        const key = localStorage.getItem('kgf_franchisee_token')
          ? 'kgf_franchisee_user'
          : 'kgf_user'
        localStorage.setItem(key, JSON.stringify(data))
      })
      .catch(() => {
        localStorage.removeItem('kgf_token')
        localStorage.removeItem('kgf_user')
        localStorage.removeItem('kgf_franchisee_token')
        localStorage.removeItem('kgf_franchisee_user')
        setUser(null)
      })
      .finally(() => setBootstrapped(true))
  }, [])

  const applySession = (token, userData, storage = 'customer') => {
    if (storage === 'franchisee') {
      localStorage.setItem('kgf_franchisee_token', token)
      localStorage.setItem('kgf_franchisee_user', JSON.stringify(userData))
      localStorage.removeItem('kgf_token')
      localStorage.removeItem('kgf_user')
    } else {
      localStorage.setItem('kgf_token', token)
      localStorage.setItem('kgf_user', JSON.stringify(userData))
      localStorage.removeItem('kgf_franchisee_token')
      localStorage.removeItem('kgf_franchisee_user')
    }
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('kgf_token')
    localStorage.removeItem('kgf_user')
    localStorage.removeItem('kgf_franchisee_token')
    localStorage.removeItem('kgf_franchisee_user')
    setUser(null)
  }

  return (
    <UserAuthContext.Provider value={{ user, applySession, logout, bootstrapped }}>
      {children}
    </UserAuthContext.Provider>
  )
}

export function useUserAuth() {
  const ctx = useContext(UserAuthContext)
  if (!ctx) throw new Error('useUserAuth must be used inside UserAuthProvider')
  return ctx
}

export function RequireUser({ children }) {
  const { user, bootstrapped } = useUserAuth()
  const location = useLocation()
  if (!bootstrapped) {
    return <div className="user-dash-loading">Loading your dashboard…</div>
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}
