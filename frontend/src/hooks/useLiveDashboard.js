import { useCallback, useEffect, useState } from 'react'
import { useUserAuth } from '../user/UserAuth.jsx'

/** Fetch fresh dashboard data from the API (MongoDB), not cached login snapshot. */
export function useLiveDashboard() {
  const { reloadUser } = useUserAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    return reloadUser()
      .then((d) => {
        setData(d)
        return d
      })
      .catch((e) => {
        setError(e)
        setData(null)
        throw e
      })
      .finally(() => setLoading(false))
  }, [reloadUser])

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  return { data, loading, error, refresh }
}
