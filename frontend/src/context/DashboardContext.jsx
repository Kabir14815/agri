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

  const refresh = useCallback((opts = {}) => {
    // Only show the blocking spinner on the very first load (no data yet).
    // Subsequent refreshes keep showing stale data until new data arrives.
    if (!opts.silent) setLoading((prev) => prev || false)
    setError(null)
    return api
      .userDashboard()
      .then((d) => {
        setData(d)
        setLoading(false)
        refreshUserRef.current(d)
        return d
      })
      .catch((e) => {
        setLoading(false)
        setError(e?.message || 'Could not load dashboard')
        throw e
      })
  }, [])

  useEffect(() => {
    setLoading(true)
    refresh().catch(() => {})
  }, [refresh])

  useEffect(() => {
    const silentRefresh = () => {
      if (document.visibilityState === 'visible') refresh({ silent: true }).catch(() => {})
    }
    document.addEventListener('visibilitychange', silentRefresh)
    window.addEventListener('focus', silentRefresh)
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh({ silent: true }).catch(() => {})
    }, REFRESH_MS)
    return () => {
      document.removeEventListener('visibilitychange', silentRefresh)
      window.removeEventListener('focus', silentRefresh)
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
