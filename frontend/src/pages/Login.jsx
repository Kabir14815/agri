import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAdminAuth } from '../admin/AdminAuth.jsx'

export default function Login() {
  const navigate = useNavigate()
  const { applySession } = useAdminAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      const res = await api.login(form)
      localStorage.setItem('kgf_token', res.token)
      localStorage.setItem('kgf_user', JSON.stringify(res.user))

      if (res.user.role === 'admin') {
        applySession(res.token, res.user)
        setStatus({
          type: 'success',
          text: `Welcome, ${res.user.full_name}. Taking you to the admin panel…`,
        })
        setTimeout(() => navigate('/admin', { replace: true }), 700)
        return
      }

      setStatus({ type: 'success', text: `Welcome back, ${res.user.full_name}!` })
      setTimeout(() => navigate('/'), 800)
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2>Login</h2>
        <p className="sub">
          Sign in to your KGF Farming account. Admins are taken straight to the
          admin panel.
        </p>

        <div className="demo-creds">
          <strong>Demo accounts</strong>
          <div>
            Customer: <code>demo@kgffarming.com</code> /{' '}
            <code>demo1234</code>
          </div>
          <div>
            Admin: <code>admin@kgffarming.com</code> /{' '}
            <code>admin1234</code>
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
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p className="alt-link">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  )
}
