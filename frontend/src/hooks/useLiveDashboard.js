import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { useUserAuth } from '../user/UserAuth.jsx'

const REFRESH_MS = 5 * 60 * 1000

/** Fetch fresh dashboard data; auto-refresh on focus and every 5 minutes while tab is open. */
export function useLiveDashboard() {
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
        setData(null)
        throw e
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === 'visible') {
        refresh().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onFocus)
    window.addEventListener('focus', onFocus)
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refresh().catch(() => {})
      }
    }, REFRESH_MS)
    return () => {
      document.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('focus', onFocus)
      clearInterval(timer)
    }
  }, [refresh])

  return { data, loading, error, refresh }
}
