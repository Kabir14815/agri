import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiTag } from 'react-icons/fi'
import { api } from '../api.js'
import {
  resolveReferralCode,
  normalizeReferralCode,
  clearStoredReferralCode,
  buildLoginPath,
  buildReferralShareUrl,
} from '../utils/referral.js'

export default function Register() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const { code: routeCode } = useParams()
  const initialCode = resolveReferralCode(searchParams, routeCode, pathname)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    sponsor_member_id: initialCode,
  })
  const [sponsorName, setSponsorName] = useState(null)
  const [codeStatus, setCodeStatus] = useState(null)
  const [sponsorLookupDone, setSponsorLookupDone] = useState(!initialCode)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const activeCode = normalizeReferralCode(form.sponsor_member_id)

  useEffect(() => {
    const code = resolveReferralCode(searchParams, routeCode, pathname)
    setForm((f) => ({ ...f, sponsor_member_id: code }))
  }, [searchParams, routeCode, pathname])

  useEffect(() => {
    if (!activeCode || activeCode.length < 3) {
      setSponsorName(null)
      setCodeStatus(null)
      setSponsorLookupDone(true)
      return
    }
    setSponsorLookupDone(false)
    const t = setTimeout(() => {
      api
        .lookupReferral(activeCode)
        .then((r) => {
          setSponsorName(r.sponsor_name)
          setCodeStatus({ type: 'success', text: `Valid — sponsor: ${r.sponsor_name}` })
        })
        .catch(() => {
          setSponsorName(null)
          setCodeStatus({ type: 'error', text: 'Invalid referral code' })
        })
        .finally(() => setSponsorLookupDone(true))
    }, 400)
    return () => clearTimeout(t)
  }, [activeCode])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm({
      ...form,
      [name]: name === 'sponsor_member_id' ? value.toUpperCase() : value,
    })
  }

  const referralInvalid =
    Boolean(activeCode) && sponsorLookupDone && codeStatus?.type === 'error'

  const onSubmit = async (e) => {
    e.preventDefault()
    if (referralInvalid) {
      setStatus({
        type: 'error',
        text: 'Enter a valid sponsor referral code, or leave the field empty.',
      })
      return
    }
    setLoading(true)
    setStatus(null)
    try {
      const sponsor = normalizeReferralCode(form.sponsor_member_id)
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
        sponsor_member_id: sponsor || undefined,
      }
      if (form.address?.trim()) payload.address = form.address.trim()
      if (form.city?.trim()) payload.city = form.city.trim()
      if (form.state?.trim()) payload.state = form.state.trim()
      if (form.pincode?.trim()) payload.pincode = form.pincode.trim()
      if (form.country?.trim()) payload.country = form.country.trim()
      const res = await api.register(payload)
      clearStoredReferralCode()
      const mid = res.user?.member_id || ''
      try {
        if (mid) sessionStorage.setItem('kgf_login_member_id', mid)
      } catch {
        /* ignore */
      }
      setStatus({
        type: 'success',
        text: mid
          ? `${res.message}! Your Member ID is ${mid}. Save it — you will use it to log in.`
          : `${res.message}! Redirecting to login…`,
      })
      setTimeout(() => navigate(buildLoginPath(sponsor)), 2200)
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
            {activeCode && sponsorName
              ? `You are joining under ${sponsorName}. Their code is applied automatically.`
              : activeCode && codeStatus?.type === 'error'
                ? 'This referral code is not valid. Check the link or enter a different sponsor code.'
                : 'Optional: enter your sponsor’s referral code so they appear in your team tree.'}
          </p>
          {activeCode && sponsorName ? (
            <ul className="auth-visual-list">
              <li>
                Sponsor: <strong>{sponsorName}</strong>
              </li>
              <li>
                Code: <strong className="referral-code-pill">{activeCode}</strong>
              </li>
              <li>
                Link:{' '}
                <code style={{ fontSize: '0.85em', wordBreak: 'break-all' }}>
                  {buildReferralShareUrl(window.location.origin, activeCode)}
                </code>
              </li>
            </ul>
          ) : activeCode ? (
            <p className="auth-visual-note">Checking referral code…</p>
          ) : null}
        </aside>

        <div className="auth-card auth-card-premium">
          <h2>Register</h2>
          <p className="sub">Fill in your profile to get started.</p>

          {status && <div className={`form-message ${status.type}`}>{status.text}</div>}

          <form onSubmit={onSubmit}>
            <div className="form-group referral-code-group">
              <label>
                <FiTag /> Referral / sponsor code
              </label>
              <input
                className="form-control"
                name="sponsor_member_id"
                value={form.sponsor_member_id}
                onChange={onChange}
                placeholder="Sponsor member ID (any KGF member)"
                autoComplete="off"
              />
              {codeStatus && (
                <small className={`referral-code-hint ${codeStatus.type}`}>
                  {codeStatus.text}
                </small>
              )}
              {sponsorName && !codeStatus?.type && (
                <small className="referral-code-hint success">Sponsor: {sponsorName}</small>
              )}
            </div>

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

            <button
              className="btn btn-accent"
              style={{ width: '100%' }}
              disabled={loading || referralInvalid || (Boolean(activeCode) && !sponsorLookupDone)}
            >
              {loading
                ? 'Creating profile…'
                : Boolean(activeCode) && !sponsorLookupDone
                  ? 'Checking referral code…'
                  : 'Create account'}
            </button>
          </form>

          <p className="alt-link">
            Already registered? <Link to={buildLoginPath(activeCode)}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
