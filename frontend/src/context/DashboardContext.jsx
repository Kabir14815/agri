import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { useUserAuth } from '../user/UserAuth.jsx'

export const DashboardContext = createContext(null)

const REFRESH_MS = 5 * 60 * 1000

export function DashboardProvider({ children }) {
  const { refreshUser } = useUserAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const refreshUserRef = useRef(refreshUser)
  refreshUserRef.current = refreshUser

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    return api
      .userDashboard()
      .then((d) => {
        setData(d)
        refreshUserRef.current(d)
        return d
      })
      .catch((e) => {
        setError(e?.message || 'Could not load dashboard')
        throw e
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === 'visible') refresh().catch(() => {})
    }
    document.addEventListener('visibilitychange', onFocus)
    window.addEventListener('focus', onFocus)
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh().catch(() => {})
    }, REFRESH_MS)
    return () => {
      document.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('focus', onFocus)
      clearInterval(timer)
    }
  }, [refresh])

  return (
    <DashboardContext.Provider value={{ data, loading, error, refresh }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider')
  return ctx
}
