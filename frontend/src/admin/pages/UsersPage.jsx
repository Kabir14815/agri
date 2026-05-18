import { useEffect, useState } from 'react'
import {
  FiTrash2,
  FiMail,
  FiPhone,
  FiMapPin,
  FiUser,
  FiCalendar,
  FiX,
  FiDollarSign,
} from 'react-icons/fi'
import { adminApi } from '../../api.js'
import { useAdminAuth } from '../AdminAuth.jsx'

const ROLE_COLORS = {
  admin: '#c2410c',
  franchisee: '#7b3eb1',
  customer: '#1f7a3a',
}

function initials(name) {
  return (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatDate(iso) {
  if (!iso) return '—'
  return iso.slice(0, 16).replace('T', ' ')
}

function formatInr(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n ?? 0)
}

function ProfileModal({ user, onClose, onDelete, canDelete, onAmountSaved }) {
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) setAmount(String(user.amount ?? 0))
  }, [user])

  if (!user) return null

  const saveAmount = async () => {
    setSaving(true)
    try {
      const value = Number(amount)
      await adminApi.updateUserAmount(user.id, value)
      onAmountSaved?.(value)
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal admin-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-head">
          <h3>Member profile</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>
        <div className="admin-profile-modal-body">
          <div className="admin-profile-hero">
            <div
              className="user-avatar xl"
              style={{ background: ROLE_COLORS[user.role] || '#475569' }}
            >
              {initials(user.full_name)}
            </div>
            <div>
              <h2>{user.full_name}</h2>
              <span
                className="role-pill"
                style={{ background: ROLE_COLORS[user.role] || '#475569' }}
              >
                {user.role}
              </span>
              <p className="user-id">Member ID #{user.id}</p>
            </div>
          </div>
          <div className="admin-profile-details">
            <div className="profile-detail-row">
              <FiMail />
              <div>
                <small>Email</small>
                <a href={`mailto:${user.email}`}>{user.email}</a>
              </div>
            </div>
            <div className="profile-detail-row">
              <FiPhone />
              <div>
                <small>Phone</small>
                <a href={`tel:${user.phone}`}>{user.phone}</a>
              </div>
            </div>
            <div className="profile-detail-row">
              <FiMapPin />
              <div>
                <small>Address</small>
                <p>
                  {[user.address, user.city, user.state, user.pincode]
                    .filter(Boolean)
                    .join(', ') || 'Not provided'}
                </p>
              </div>
            </div>
            <div className="profile-detail-row">
              <FiDollarSign />
              <div>
                <small>Amount (₹)</small>
                {user.role !== 'admin' ? (
                  <div className="admin-amount-edit">
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      step="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={saving}
                      onClick={saveAmount}
                    >
                      {saving ? 'Saving…' : 'Update amount'}
                    </button>
                  </div>
                ) : (
                  <p>{formatInr(user.amount)}</p>
                )}
              </div>
            </div>
            <div className="profile-detail-row">
              <FiCalendar />
              <div>
                <small>Registered</small>
                <p>{formatDate(user.registered_at)}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="admin-modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          {canDelete && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => onDelete(user)}
            >
              <FiTrash2 /> Delete account
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const { user: me } = useAdminAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const load = () => {
    setLoading(true)
    adminApi
      .users()
      .then(setItems)
      .catch((e) => setStatus({ type: 'error', text: e.message }))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const remove = async (u) => {
    if (!confirm(`Delete user "${u.full_name}"?`)) return
    try {
      await adminApi.deleteUser(u.id)
      setSelected(null)
      setStatus({ type: 'success', text: 'User removed.' })
      load()
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    }
  }

  const filtered =
    filter === 'all' ? items : items.filter((u) => u.role === filter)

  const counts = {
    all: items.length,
    customer: items.filter((u) => u.role === 'customer').length,
    franchisee: items.filter((u) => u.role === 'franchisee').length,
    admin: items.filter((u) => u.role === 'admin').length,
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Registered members</h1>
          <p>Full profiles of everyone who signed up on the website.</p>
        </div>
      </div>

      {status && <div className={`form-message ${status.type}`}>{status.text}</div>}

      <div className="admin-filter-tabs">
        {['all', 'customer', 'franchisee', 'admin'].map((role) => (
          <button
            key={role}
            type="button"
            className={`admin-filter-tab ${filter === role ? 'active' : ''}`}
            onClick={() => setFilter(role)}
          >
            {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
            <span className="tab-count">{counts[role]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading profiles…</p>
      ) : filtered.length === 0 ? (
        <section className="admin-panel admin-empty-state">
          <FiUser size={48} />
          <h3>No members yet</h3>
          <p>New registrations will appear here with full profile details.</p>
        </section>
      ) : (
        <div className="admin-user-grid">
          {filtered.map((u) => (
            <article key={u.id} className="admin-user-card">
              <div className="admin-user-card-top">
                <div
                  className="user-avatar"
                  style={{ background: ROLE_COLORS[u.role] || '#475569' }}
                >
                  {initials(u.full_name)}
                </div>
                <div className="admin-user-card-meta">
                  <h3>{u.full_name}</h3>
                  <span
                    className="role-pill sm"
                    style={{ background: ROLE_COLORS[u.role] || '#475569' }}
                  >
                    {u.role}
                  </span>
                </div>
              </div>
              <ul className="admin-user-card-info">
                <li>
                  <FiMail /> {u.email}
                </li>
                <li>
                  <FiPhone /> {u.phone}
                </li>
                <li>
                  <FiMapPin />
                  {u.city || u.state
                    ? [u.city, u.state].filter(Boolean).join(', ')
                    : 'Location not set'}
                </li>
                <li>
                  <FiDollarSign /> {formatInr(u.amount)}
                </li>
                <li>
                  <FiCalendar /> Joined {formatDate(u.registered_at)}
                </li>
              </ul>
              <div className="admin-user-card-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setSelected(u)}
                >
                  View profile
                </button>
                {u.id !== me?.id && (
                  <button
                    type="button"
                    className="icon-btn danger"
                    onClick={() => remove(u)}
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <ProfileModal
        user={selected}
        onClose={() => setSelected(null)}
        onDelete={remove}
        canDelete={selected && selected.id !== me?.id}
        onAmountSaved={(newAmount) => {
          load()
          setSelected((prev) =>
            prev ? { ...prev, amount: newAmount } : null,
          )
        }}
      />
    </>
  )
}
