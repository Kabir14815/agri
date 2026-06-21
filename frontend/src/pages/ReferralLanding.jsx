import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiUserPlus, FiLogIn } from 'react-icons/fi'
import { api } from '../api.js'
import {
  buildLoginPath,
  buildRegisterPath,
  persistReferralCode,
  normalizeReferralCode,
} from '../utils/referral.js'
import { AuthBrandHeader } from '../components/BrandLogo.jsx'
import { BRAND } from '../constants/brand.js'

export default function ReferralLanding() {
  const { code: routeCode } = useParams()
  const code = normalizeReferralCode(routeCode)
  const [sponsor, setSponsor] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) {
      setError('No referral code in link.')
      setLoading(false)
      return
    }
    persistReferralCode(code)
    api
      .lookupReferral(code)
      .then((data) => {
        setSponsor(data)
        const trackedKey = `kgf_ref_tracked_${code}`
        if (!sessionStorage.getItem(trackedKey)) {
          api
            .trackReferralVisit({ code, path: `/ref/${code}` })
            .then(() => sessionStorage.setItem(trackedKey, '1'))
            .catch(() => {})
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [code])

  if (loading) {
    return (
      <div className="auth-wrap auth-premium">
        <div className="auth-card auth-card-premium" style={{ maxWidth: 480, textAlign: 'center' }}>
          <p>Checking referral code…</p>
        </div>
      </div>
    )
  }

  if (error || !sponsor?.valid) {
    return (
      <div className="auth-wrap auth-premium">
        <div className="auth-card auth-card-premium" style={{ maxWidth: 480 }}>
          <h2>Invalid referral link</h2>
          <p className="sub">{error || 'This referral code was not found.'}</p>
          <Link to="/register" className="btn btn-accent" style={{ width: '100%' }}>
            Register without referral
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrap auth-premium">
      <div className="auth-card auth-card-premium referral-landing-card" style={{ maxWidth: 520 }}>
        <AuthBrandHeader />
        <span className="auth-visual-badge">{BRAND.name} referral</span>
        <h2>You&apos;re invited!</h2>
        <p className="sub">
          Join under <strong>{sponsor.sponsor_name}</strong> using referral code{' '}
          <strong className="referral-code-pill">{sponsor.member_id}</strong>
        </p>

        <div className="referral-landing-actions">
          <Link to={buildRegisterPath(code)} className="btn btn-accent">
            <FiUserPlus /> Register with this code
          </Link>
          <Link to={buildLoginPath(code)} className="btn btn-outline">
            <FiLogIn /> Already have an account? Login
          </Link>
        </div>

        <p className="alt-link" style={{ marginTop: 20 }}>
          Your sponsor will be saved when you create a new account.
        </p>
      </div>
    </div>
  )
}
