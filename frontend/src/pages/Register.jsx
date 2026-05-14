import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
  })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      const res = await api.register(form)
      setStatus({ type: 'success', text: `${res.message}! Redirecting to login…` })
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: 540 }}>
        <h2>Create your account</h2>
        <p className="sub">Join KGF Farming and explore our products.</p>

        {status && <div className={`form-message ${status.type}`}>{status.text}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              className="form-control"
              name="full_name"
              value={form.full_name}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-row">
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
              <label>Phone</label>
              <input
                className="form-control"
                name="phone"
                value={form.phone}
                onChange={onChange}
                required
              />
            </div>
          </div>
          <div className="form-row">
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
            <div className="form-group">
              <label>Account Type</label>
              <select
                className="form-control"
                name="role"
                value={form.role}
                onChange={onChange}
              >
                <option value="customer">Customer</option>
                <option value="franchisee">Franchisee</option>
              </select>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating…' : 'Register'}
          </button>
        </form>

        <p className="alt-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}
