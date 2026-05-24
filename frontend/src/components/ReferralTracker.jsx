import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../api.js'
import {
  persistReferralCode,
  referralCodeFromPathname,
  resolveReferralCodeFromUrl,
} from '../utils/referral.js'

/** Captures ?ref= and /ref/CODE from any public page; records visit once per session */
export default function ReferralTracker() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) return

    const searchParams = new URLSearchParams(search)
    const pathCode = referralCodeFromPathname(pathname)
    const code = resolveReferralCodeFromUrl(searchParams, pathCode, pathname)
    if (!code) return

    persistReferralCode(code)

    const trackedKey = `kgf_ref_tracked_${code}`
    if (sessionStorage.getItem(trackedKey)) return

    api
      .trackReferralVisit({ code, path: pathname + search })
      .then(() => sessionStorage.setItem(trackedKey, '1'))
      .catch(() => {})
  }, [pathname, search])

  return null
}
