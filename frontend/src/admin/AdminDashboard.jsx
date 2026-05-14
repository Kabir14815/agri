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
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([adminApi.stats(), adminApi.contacts()])
      .then(([s, c]) => {
        setStats(s)
        setRecent(c.slice(0, 5))
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
