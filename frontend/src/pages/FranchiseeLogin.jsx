import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useUserAuth } from '../user/UserAuth.jsx'

export default function FranchiseeLogin() {
  const navigate = useNavigate()
  const { applySession } = useUserAuth()
  const [form, setForm] = useState({ member_id: '', password: '' })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm({
      ...form,
      [name]: name === 'member_id' ? value.toUpperCase() : value,
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
        setStatus({ type: 'error', text: 'Please use the admin login page for admin access.' })
        return
      }
      if (res.user.role !== 'franchisee') {
        setStatus({ type: 'error', text: 'This account is not a franchisee partner.' })
        return
      }
      applySession(res.token, res.user, 'franchisee')
      setStatus({ type: 'success', text: `Welcome, partner ${res.user.full_name}!` })
      setTimeout(() => navigate('/dashboard', { replace: true }), 700)
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2>Franchisee Login</h2>
        <p className="sub">Sign in with your partner Member ID and password.</p>

        {status && <div className={`form-message ${status.type}`}>{status.text}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Member ID</label>
            <input
              className="form-control"
              name="member_id"
              value={form.member_id}
              onChange={onChange}
              placeholder="Your member ID"
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
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in…' : 'Login as Franchisee'}
          </button>
        </form>

        <p className="alt-link">
          <Link to="/login">Member login</Link> ·{' '}
          <Link to="/contact">Become a partner</Link>
        </p>
      </div>
    </div>
  )
}
