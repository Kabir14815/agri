import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiDroplet, FiLogIn } from 'react-icons/fi'
import { api } from '../api.js'
import { useFarmerAuth } from '../farmer/FarmerAuth.jsx'

export default function FarmerLogin() {
  const navigate = useNavigate()
  const { applySession } = useFarmerAuth()
  const [form, setForm] = useState({ member_id: '', password: '' })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const onMemberIdChange = (value) => {
    const next = value.includes('@') ? value.toLowerCase() : value.toUpperCase()
    setForm((f) => ({ ...f, member_id: next }))
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
      if (res.user.role !== 'farmer') {
        setStatus({
          type: 'error',
          text:
            res.user.role === 'admin'
              ? 'Use /admin/login for admin accounts.'
              : 'This portal is for registered farmers only. Use Member Login for investors.',
        })
        return
      }
      applySession(res.token, res.user)
      navigate('/farmer', { replace: true })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap auth-premium farmer-auth-wrap">
      <div className="auth-card auth-card-premium farmer-login-card">
        <div className="farmer-login-badge">
          <FiDroplet aria-hidden />
          <span>Farmer Portal</span>
        </div>
        <h2>Daily crop log</h2>
        <p className="sub">
          Sign in with your farmer Member ID and password. Upload one photo each day showing
          whether crops were watered.
        </p>

        {status && (
          <div className={`form-status ${status.type === 'error' ? 'error' : 'success'}`}>
            {status.text}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="member_id">Member ID</label>
            <input
              id="member_id"
              name="member_id"
              value={form.member_id}
              onChange={(e) => onMemberIdChange(e.target.value)}
              required
              autoComplete="username"
              placeholder="Member ID or email address"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-accent btn-block" disabled={loading}>
            <FiLogIn style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="alt-link">
          Investor or franchisee? <Link to="/login">Member login</Link>
        </p>
        <p className="alt-link" style={{ marginTop: 8 }}>
          <Link to="/">← Back to website</Link>
        </p>
      </div>
    </div>
  )
}
