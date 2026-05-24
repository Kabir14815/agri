import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FiUser, FiMail, FiPhone, FiMapPin, FiLock } from 'react-icons/fi'
import { api } from '../api.js'

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref') || ''
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
    address: '',
    city: '',
    state: 'Haryana',
    pincode: '',
    country: 'India',
    sponsor_member_id: refCode,
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
      setStatus({
        type: 'success',
        text: `${res.message}! Your profile is saved — redirecting to login…`,
      })
      setTimeout(() => navigate('/login'), 1400)
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap auth-premium">
      <div className="auth-split">
        <aside className="auth-split-visual">
          <span className="auth-visual-badge">Join KGF Farming</span>
          <h2>Create your member profile</h2>
          <p>
            Register once — your details appear instantly in our admin panel so our team
            can support you with products, pricing and delivery.
          </p>
          <ul className="auth-visual-list">
            <li>Organic vermicompost & crop care</li>
            <li>Pan-India partner network</li>
            <li>Secure member account</li>
          </ul>
        </aside>

        <div className="auth-card auth-card-premium">
          <h2>Register</h2>
          <p className="sub">Fill in your profile to get started.</p>
          {refCode && (
            <p className="sub" style={{ color: 'var(--color-primary)' }}>
              Referred by: <strong>{refCode}</strong>
            </p>
          )}

          {status && <div className={`form-message ${status.type}`}>{status.text}</div>}

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label><FiUser /> Full name</label>
              <input
                className="form-control"
                name="full_name"
                value={form.full_name}
                onChange={onChange}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><FiMail /> Email</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="you@email.com"
                  required
                />
              </div>
              <div className="form-group">
                <label><FiPhone /> Phone</label>
                <input
                  className="form-control"
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  placeholder="10-digit mobile"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label><FiMapPin /> Street address</label>
              <input
                className="form-control"
                name="address"
                value={form.address}
                onChange={onChange}
                placeholder="House no., colony, road"
              />
            </div>

            <div className="form-row form-row-3">
              <div className="form-group">
                <label>City</label>
                <input
                  className="form-control"
                  name="city"
                  value={form.city}
                  onChange={onChange}
                  placeholder="Jind"
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  className="form-control"
                  name="state"
                  value={form.state}
                  onChange={onChange}
                />
              </div>
              <div className="form-group">
                <label>Country</label>
                <input
                  className="form-control"
                  name="country"
                  value={form.country}
                  onChange={onChange}
                />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input
                  className="form-control"
                  name="pincode"
                  value={form.pincode}
                  onChange={onChange}
                  placeholder="126102"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><FiLock /> Password</label>
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
                <label>Account type</label>
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

            <button className="btn btn-accent" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Creating profile…' : 'Create account'}
            </button>
          </form>

          <p className="alt-link">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
