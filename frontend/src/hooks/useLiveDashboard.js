import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { useUserAuth } from '../user/UserAuth.jsx'

/** Fetch fresh dashboard data once per mount (avoids infinite reload loops). */
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

  return { data, loading, error, refresh }
}
