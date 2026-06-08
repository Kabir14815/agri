import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from './AdminAuth.jsx'

export default function AdminLogin() {
  const { login } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/admin'

  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      await login(form.email.trim(), form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap" style={{ background: '#0d1f12' }}>
      <div className="auth-card">
        <h2>Admin Portal</h2>
        <p className="sub">Sign in to manage KGF Farming.</p>

        {status && (
          <div className={`form-message ${status.type}`}>{status.text}</div>
        )}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Admin Email</label>
            <input
              type="email"
              className="form-control"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="admin@kgffarming.com"
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
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in to Admin'}
          </button>
        </form>
      </div>
    </div>
  )
}
