import { createContext, useContext, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { farmerApi } from '../api.js'

const FarmerAuthContext = createContext(null)

function readStored() {
  try {
    return JSON.parse(localStorage.getItem('kgf_farmer_user') || 'null')
  } catch {
    return null
  }
}

export function FarmerAuthProvider({ children }) {
  const [dashboard, setDashboard] = useState(null)
  const [bootstrapped, setBootstrapped] = useState(false)

  const profile = dashboard?.profile || readStored()

  const refresh = () =>
    farmerApi.dashboard().then((data) => {
      setDashboard(data)
      if (data?.profile) {
        localStorage.setItem('kgf_farmer_user', JSON.stringify(data.profile))
      }
      return data
    })

  useEffect(() => {
    const token = localStorage.getItem('kgf_farmer_token')
    if (!token) {
      setBootstrapped(true)
      return
    }
    refresh()
      .catch(() => {
        localStorage.removeItem('kgf_farmer_token')
        localStorage.removeItem('kgf_farmer_user')
        setDashboard(null)
      })
      .finally(() => setBootstrapped(true))
  }, [])

  const applySession = (token, userData) => {
    localStorage.setItem('kgf_farmer_token', token)
    localStorage.setItem('kgf_farmer_user', JSON.stringify(userData))
    setDashboard({ profile: userData, today: null, history: [] })
  }

  const logout = () => {
    localStorage.removeItem('kgf_farmer_token')
    localStorage.removeItem('kgf_farmer_user')
    setDashboard(null)
  }

  return (
    <FarmerAuthContext.Provider
      value={{ profile, dashboard, setDashboard, applySession, logout, refresh, bootstrapped }}
    >
      {children}
    </FarmerAuthContext.Provider>
  )
}

export function useFarmerAuth() {
  const ctx = useContext(FarmerAuthContext)
  if (!ctx) throw new Error('useFarmerAuth must be used inside FarmerAuthProvider')
  return ctx
}

export function RequireFarmer({ children }) {
  const { profile, bootstrapped } = useFarmerAuth()
  const location = useLocation()
  if (!bootstrapped) {
    return <div className="farmer-loading">Loading farmer portal…</div>
  }
  if (!profile || !localStorage.getItem('kgf_farmer_token')) {
    return <Navigate to="/farmer-login" state={{ from: location }} replace />
  }
  return children
}
