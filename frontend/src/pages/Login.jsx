import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import { useAdminAuth } from '../admin/AdminAuth.jsx'
import { useUserAuth } from '../user/UserAuth.jsx'
import {
  resolveReferralCodeFromUrl,
  clearStoredReferralCode,
  buildRegisterPath,
  normalizeReferralCode,
} from '../utils/referral.js'

export default function Login() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const { applySession: applyAdminSession } = useAdminAuth()
  const { applySession: applyUserSession } = useUserAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [sponsorName, setSponsorName] = useState(null)

  useEffect(() => {
    const code = resolveReferralCodeFromUrl(searchParams, '', pathname)
    setReferralCode(code)
    if (code) {
      api
        .lookupReferral(code)
        .then((r) => setSponsorName(r.sponsor_name))
        .catch(() => setSponsorName(null))
    } else {
      setSponsorName(null)
    }
  }, [searchParams, pathname])

  const dismissReferral = () => {
    clearStoredReferralCode()
    setReferralCode('')
    setSponsorName(null)
    navigate('/login', { replace: true })
  }

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      const res = await api.login(form)

      if (res.user.role === 'admin') {
        applyAdminSession(res.token, res.user)
        setStatus({
          type: 'success',
          text: `Welcome, ${res.user.full_name}. Taking you to the admin panel…`,
        })
        setTimeout(() => navigate('/admin', { replace: true }), 700)
        return
      }

      applyUserSession(res.token, res.user, 'customer')
      setStatus({
        type: 'success',
        text: `Welcome back, ${res.user.full_name}! Opening your dashboard…`,
      })
      setTimeout(() => navigate('/dashboard', { replace: true }), 700)
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const ref = normalizeReferralCode(referralCode)

  return (
    <div className="auth-wrap auth-premium">
      <div className="auth-card auth-card-premium" style={{ maxWidth: 480 }}>
        <h2>Login</h2>
        <p className="sub">
          Sign in to your KGF Farming account. Admins are taken straight to the admin panel.
        </p>

        {ref && (
          <div className="referral-login-banner">
            <strong>Referral code: {ref}</strong>
            {sponsorName ? (
              <span> — invited by {sponsorName}</span>
            ) : (
              <span> — checking sponsor…</span>
            )}
            <p>
              New member?{' '}
              <Link to={buildRegisterPath(ref)}>Register with this referral code</Link> so we
              can track your sponsor.
            </p>
            <button type="button" className="referral-banner-dismiss" onClick={dismissReferral}>
              Not joining under this sponsor
            </button>
          </div>
        )}

        <div className="demo-creds">
          <strong>Demo accounts</strong>
          <div>
            Customer: <code>demo@kgffarming.com</code> / <code>demo1234</code>
          </div>
          <div>
            Admin: <code>admin@kgffarming.com</code> / <code>admin1234</code>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <button
              type="button"
              className="demo-fill"
              onClick={() =>
                setForm({ email: 'demo@kgffarming.com', password: 'demo1234' })
              }
            >
              Fill customer demo
            </button>
            <button
              type="button"
              className="demo-fill"
              onClick={() =>
                setForm({ email: 'admin@kgffarming.com', password: 'admin1234' })
              }
            >
              Fill admin demo
            </button>
          </div>
        </div>

        {status && <div className={`form-message ${status.type}`}>{status.text}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              name="email"
              value={form.email}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              name="password"
              value={form.password}
              onChange={onChange}
              required
              minLength={6}
            />
          </div>
          <button className="btn btn-accent" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p className="alt-link">
          New here? <Link to={ref ? buildRegisterPath(ref) : '/register'}>Create an account</Link>
        </p>
      </div>
    </div>
  )
}
