import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useUserAuth } from '../user/UserAuth.jsx'

export default function FranchiseeLogin() {
  const navigate = useNavigate()
  const { applySession } = useUserAuth()
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
      if (res.user.role === 'admin') {
        setStatus({ type: 'error', text: 'Please use the main login page for admin access.' })
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
        <p className="sub">Access the partner portal.</p>

        <div className="demo-creds">
          <strong>Demo partner account</strong>
          <div>Email: <code>partner@kgffarming.com</code></div>
          <div>Password: <code>partner1234</code></div>
          <button
            type="button"
            className="demo-fill"
            onClick={() =>
              setForm({
                email: 'partner@kgffarming.com',
                password: 'partner1234',
              })
            }
          >
            Fill demo credentials
          </button>
        </div>

        {status && <div className={`form-message ${status.type}`}>{status.text}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Partner Email</label>
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
            {loading ? 'Logging in…' : 'Login as Franchisee'}
          </button>
        </form>

        <p className="alt-link">
          Want to become a partner? <Link to="/contact">Get in touch</Link>
        </p>
      </div>
    </div>
  )
}
