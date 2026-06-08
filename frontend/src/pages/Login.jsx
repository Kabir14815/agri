import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import { useUserAuth } from '../user/UserAuth.jsx'
import {
  resolveReferralCodeFromUrl,
  clearStoredReferralCode,
  buildRegisterPath,
  normalizeReferralCode,
} from '../utils/referral.js'

const LOGIN_MEMBER_ID_KEY = 'kgf_login_member_id'

export default function Login() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const { applySession: applyUserSession } = useUserAuth()
  const [form, setForm] = useState({ member_id: '', password: '' })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [sponsorName, setSponsorName] = useState(null)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(LOGIN_MEMBER_ID_KEY)
      if (saved) {
        setForm((f) => ({ ...f, member_id: saved }))
        sessionStorage.removeItem(LOGIN_MEMBER_ID_KEY)
      }
    } catch {
      /* ignore */
    }
  }, [])

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

  const onChange = (e) => {
    const { name, value } = e.target
    setForm({
      ...form,
      [name]:
        name === 'member_id'
          ? value.includes('@')
            ? value.toLowerCase()
            : value.toUpperCase()
          : value,
    })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      const res = await api.login({
        member_id: form.member_id.trim(),
        password: form.password,
      })

      if (res.user.role === 'admin') {
        setStatus({
          type: 'error',
          text: 'Admin accounts must sign in at /admin/login',
        })
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
        <h2>Member Login</h2>
        <p className="sub">
          Sign in with your <strong>Member ID</strong> or email and password from registration.
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

        {status && <div className={`form-message ${status.type}`}>{status.text}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Member ID</label>
            <input
              className="form-control"
              name="member_id"
              value={form.member_id}
              onChange={onChange}
              placeholder="Your member ID or email"
              autoComplete="username"
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
              autoComplete="current-password"
            />
          </div>
          <button className="btn btn-accent" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p className="alt-link">
          New here? <Link to={ref ? buildRegisterPath(ref) : '/register'}>Create an account</Link>
        </p>
        <p className="alt-link" style={{ marginTop: 8 }}>
          Admin? <Link to="/admin/login">Admin login</Link>
        </p>
      </div>
    </div>
  )
}
