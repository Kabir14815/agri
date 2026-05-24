import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  FiGrid,
  FiPackage,
  FiTool,
  FiHelpCircle,
  FiMessageCircle,
  FiBookOpen,
  FiAward,
  FiMail,
  FiUsers,
  FiGitBranch,
  FiDollarSign,
  FiRefreshCw,
  FiLifeBuoy,
  FiLogOut,
  FiMenu,
  FiExternalLink,
} from 'react-icons/fi'
import { useAdminAuth } from './AdminAuth.jsx'

const NAV = [
  { to: '/admin', icon: <FiGrid />, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: <FiPackage />, label: 'Products' },
  { to: '/admin/services', icon: <FiTool />, label: 'Services' },
  { to: '/admin/blog', icon: <FiBookOpen />, label: 'Blog' },
  { to: '/admin/achievers', icon: <FiAward />, label: 'Achievers' },
  { to: '/admin/testimonials', icon: <FiMessageCircle />, label: 'Testimonials' },
  { to: '/admin/faqs', icon: <FiHelpCircle />, label: 'FAQs' },
  { to: '/admin/contacts', icon: <FiMail />, label: 'Contact Inbox' },
  { to: '/admin/users', icon: <FiUsers />, label: 'Users' },
  { to: '/admin/referrals', icon: <FiGitBranch />, label: 'Referrals' },
  { to: '/admin/deposits', icon: <FiDollarSign />, label: 'Deposits' },
  { to: '/admin/exchange', icon: <FiRefreshCw />, label: 'Exchange Fund' },
  { to: '/admin/help-desk', icon: <FiLifeBuoy />, label: 'Help Desk' },
]

export default function AdminLayout() {
  const { user, logout } = useAdminAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const onLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="admin-brand">
          <div className="brand-logo">K</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700 }}>KGF Admin</div>
            <small style={{ color: 'rgba(255,255,255,0.55)' }}>Control Panel</small>
          </div>
        </div>

        <nav>
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="admin-nav-icon">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: 18 }}>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="admin-nav-link"
            style={{ color: '#9be39a' }}
          >
            <span className="admin-nav-icon"><FiExternalLink /></span>
            View public site
          </a>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <FiMenu />
          </button>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 15 }}>Welcome, {user?.full_name}</strong>
            <div style={{ color: 'var(--color-muted)', fontSize: 13 }}>
              {user?.email}
            </div>
          </div>
          <button className="btn btn-outline" onClick={onLogout}>
            <FiLogOut /> Logout
          </button>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
