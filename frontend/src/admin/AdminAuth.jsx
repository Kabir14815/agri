import { createContext, useContext, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api, adminApi } from '../api.js'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kgf_admin_user') || 'null')
    } catch {
      return null
    }
  })
  const [bootstrapped, setBootstrapped] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('kgf_admin_token')
    if (!token) {
      setBootstrapped(true)
      return
    }
    adminApi
      .me()
      .then((u) => {
        setUser(u)
        localStorage.setItem('kgf_admin_user', JSON.stringify(u))
      })
      .catch(() => {
        localStorage.removeItem('kgf_admin_token')
        localStorage.removeItem('kgf_admin_user')
        setUser(null)
      })
      .finally(() => setBootstrapped(true))
  }, [])

  const applySession = (token, user) => {
    localStorage.setItem('kgf_admin_token', token)
    localStorage.setItem('kgf_admin_user', JSON.stringify(user))
    setUser(user)
  }

  const login = async (email, password) => {
    const res = await api.login({ member_id: email, password })
    if (res.user.role !== 'admin') {
      throw new Error('This account does not have admin access')
    }
    applySession(res.token, res.user)
    return res.user
  }

  const logout = () => {
    localStorage.removeItem('kgf_admin_token')
    localStorage.removeItem('kgf_admin_user')
    setUser(null)
  }

  return (
    <AdminAuthContext.Provider
      value={{ user, login, logout, bootstrapped, applySession }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider')
  return ctx
}

export function RequireAdmin({ children }) {
  const { user, bootstrapped } = useAdminAuth()
  const location = useLocation()
  if (!bootstrapped) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>Loading admin…</div>
    )
  }
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }
  return children
}
