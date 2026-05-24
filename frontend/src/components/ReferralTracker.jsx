import { useEffect } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { persistReferralCode, resolveReferralCode } from '../utils/referral.js'

/** Captures ?ref= from any public page and records visit once per session */
export default function ReferralTracker() {
  const { pathname, search } = useLocation()
  const params = useParams()

  useEffect(() => {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) return

    const searchParams = new URLSearchParams(search)
    const routeCode = params.code || params.memberId || ''
    const code = resolveReferralCode(searchParams, routeCode)
    if (!code) return

    const trackedKey = `kgf_ref_tracked_${code}`
    if (sessionStorage.getItem(trackedKey)) return

    api
      .trackReferralVisit({ code, path: pathname + search })
      .then(() => sessionStorage.setItem(trackedKey, '1'))
      .catch(() => {})
  }, [pathname, search, params.code, params.memberId])

  return null
}
