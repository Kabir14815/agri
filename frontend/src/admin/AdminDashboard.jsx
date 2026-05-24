import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiPackage,
  FiTool,
  FiBookOpen,
  FiAward,
  FiMessageCircle,
  FiHelpCircle,
  FiUsers,
  FiMail,
  FiDollarSign,
  FiLifeBuoy,
  FiRefreshCw,
} from 'react-icons/fi'
import { adminApi } from '../api.js'

const STAT_CARDS = [
  { key: 'products', label: 'Products', icon: <FiPackage />, link: '/admin/products', color: '#1f7a3a' },
  { key: 'services', label: 'Services', icon: <FiTool />, link: '/admin/services', color: '#0d8abc' },
  { key: 'blog_posts', label: 'Blog Posts', icon: <FiBookOpen />, link: '/admin/blog', color: '#7b3eb1' },
  { key: 'achievers', label: 'Achievers', icon: <FiAward />, link: '/admin/achievers', color: '#d97706' },
  { key: 'testimonials', label: 'Testimonials', icon: <FiMessageCircle />, link: '/admin/testimonials', color: '#b91c1c' },
  { key: 'faqs', label: 'FAQs', icon: <FiHelpCircle />, link: '/admin/faqs', color: '#475569' },
  { key: 'users', label: 'Users', icon: <FiUsers />, link: '/admin/users', color: '#0e7490' },
  { key: 'contacts', label: 'Contact Messages', icon: <FiMail />, link: '/admin/contacts', color: '#c2410c' },
  { key: 'deposits_pending', label: 'Pending Deposits', icon: <FiDollarSign />, link: '/admin/deposits', color: '#15803d' },
  { key: 'help_tickets_open', label: 'Open Tickets', icon: <FiLifeBuoy />, link: '/admin/help-desk', color: '#0d9488' },
  { key: 'exchange_pending', label: 'Pending Exchange', icon: <FiRefreshCw />, link: '/admin/exchange', color: '#1e40af' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [error, setError] = useState(null)

  const [recentUsers, setRecentUsers] = useState([])

  useEffect(() => {
    Promise.all([adminApi.stats(), adminApi.contacts(), adminApi.users()])
      .then(([s, c, users]) => {
        setStats(s)
        setRecent(c.slice(0, 5))
        setRecentUsers(users.filter((u) => u.role !== 'admin').slice(0, 5))
      })
      .catch((e) => setError(e.message))
  }, [])

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of everything happening on the KGF Farming site.</p>
        </div>
      </div>

      {error && <div className="form-message error">{error}</div>}

      <div className="admin-stats-grid">
        {STAT_CARDS.map((c) => (
          <Link key={c.key} to={c.link} className="stat-card" style={{ '--accent': c.color }}>
            <div className="stat-icon">{c.icon}</div>
            <div>
              <div className="stat-value">{stats ? stats[c.key] : '…'}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2>Recent registrations</h2>
          <Link to="/admin/users" className="btn btn-outline" style={{ padding: '8px 18px' }}>
            All members
          </Link>
        </div>
        {recentUsers.length === 0 ? (
          <p style={{ color: 'var(--color-muted)' }}>No member registrations yet.</p>
        ) : (
          <div className="admin-user-grid compact">
            {recentUsers.map((u) => (
              <Link key={u.id} to="/admin/users" className="admin-user-card mini">
                <div className="admin-user-card-top">
                  <div className="user-avatar sm">
                    {(u.full_name || '?')
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="admin-user-card-meta">
                    <h3>{u.full_name}</h3>
                    <span className="role-pill sm">{u.role}</span>
                  </div>
                </div>
                <p className="mini-email">{u.email}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2>Recent contact submissions</h2>
          <Link to="/admin/contacts" className="btn btn-outline" style={{ padding: '8px 18px' }}>
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p style={{ color: 'var(--color-muted)' }}>No contact submissions yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.email}</td>
                  <td>{m.subject || '—'}</td>
                  <td className="truncate">{m.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
