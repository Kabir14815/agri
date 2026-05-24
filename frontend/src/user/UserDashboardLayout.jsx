import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  FiHome,
  FiUser,
  FiPlusCircle,
  FiUsers,
  FiCreditCard,
  FiPower,
  FiBell,
  FiLogOut,
  FiChevronRight,
  FiChevronDown,
  FiAward,
} from 'react-icons/fi'
import { useUserAuth } from './UserAuth.jsx'

const NAV = [
  { to: '/dashboard', end: true, icon: FiHome, label: 'Dashboards', color: '#f97316' },
  { to: '/dashboard/rewards', icon: FiAward, label: 'Rewards', color: '#eab308' },
  {
    key: 'profile',
    to: '/dashboard/profile',
    icon: FiUser,
    label: 'Profile',
    color: '#22d3ee',
    submenu: [
      { to: '/dashboard/profile', end: true, label: 'Profile' },
      { to: '/dashboard/profile/edit', label: 'Edit Profile' },
      { to: '/dashboard/profile/bank', label: 'Bank Detail' },
      { to: '/dashboard/profile/password', label: 'Change Password' },
    ],
  },
  { to: '/dashboard/deposit', icon: FiPlusCircle, label: 'Deposit', color: '#22c55e' },
  { to: '/dashboard/team', icon: FiUsers, label: 'Team', color: '#ec4899' },
  { to: '/dashboard/wallet', icon: FiCreditCard, label: 'Wallet', color: '#a855f7' },
  { to: '/dashboard/activate', icon: FiPower, label: 'Activate', color: '#84cc16' },
]

const TITLES = {
  '/dashboard': 'Dashboard',
  '/dashboard/rewards': 'Rewards',
  '/dashboard/profile': 'Profile',
  '/dashboard/profile/edit': 'Edit Profile',
  '/dashboard/profile/bank': 'Bank Detail',
  '/dashboard/profile/password': 'Change Password',
  '/dashboard/deposit': 'Deposit',
  '/dashboard/team': 'Team',
  '/dashboard/wallet': 'Wallet',
  '/dashboard/activate': 'Activate',
}

export default function UserDashboardLayout() {
  const { user, logout, reloadUser } = useUserAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [profileOpen, setProfileOpen] = useState(pathname.startsWith('/dashboard/profile'))

  useEffect(() => {
    if (pathname.startsWith('/dashboard/profile')) setProfileOpen(true)
  }, [pathname])

  useEffect(() => {
    reloadUser?.().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  const pageTitle = TITLES[pathname] || 'Dashboard'

  return (
    <div className="mlm-dash">
      <aside className="mlm-sidebar">
        <div className="mlm-logo">
          <span className="mlm-logo-badge">KGF</span>
          <span>GROUP</span>
        </div>
        <nav className="mlm-nav">
          {NAV.map((item) => {
            if (item.submenu) {
              const Icon = item.icon
              const active = pathname.startsWith(item.to)
              return (
                <div key={item.key} className="mlm-nav-group">
                  <button
                    type="button"
                    className={`mlm-nav-item mlm-nav-toggle${active ? ' active' : ''}`}
                    onClick={() => setProfileOpen((o) => !o)}
                  >
                    <span className="mlm-nav-icon" style={{ color: item.color }}>
                      <Icon />
                    </span>
                    <span>{item.label}</span>
                    {profileOpen ? (
                      <FiChevronDown className="mlm-nav-chevron" />
                    ) : (
                      <FiChevronRight className="mlm-nav-chevron" />
                    )}
                  </button>
                  {profileOpen && (
                    <div className="mlm-nav-sub">
                      {item.submenu.map((sub) => (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          end={sub.end}
                          className={({ isActive }) =>
                            `mlm-nav-sub-item${isActive ? ' active' : ''}`
                          }
                        >
                          {sub.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            }
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `mlm-nav-item${isActive ? ' active' : ''}`}
              >
                <span className="mlm-nav-icon" style={{ color: item.color }}>
                  <Icon />
                </span>
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <div className="mlm-main">
        <header className="mlm-topbar">
          <div className="mlm-breadcrumb">
            Home &gt; {pageTitle}
          </div>
          <div className="mlm-topbar-right">
            <button type="button" className="mlm-icon-btn" aria-label="Notifications">
              <FiBell />
              <span className="mlm-badge">0</span>
            </button>
            <div className="mlm-user-chip">
              <span>{user?.full_name?.split(' ')[0] || 'Member'}…</span>
              <div className="mlm-avatar">{user?.full_name?.[0] || '?'}</div>
            </div>
            <button type="button" className="mlm-icon-btn" onClick={onLogout} title="Logout">
              <FiLogOut />
            </button>
          </div>
        </header>

        <div className="mlm-content">
          <Outlet />
        </div>

        <footer className="mlm-footer">© KGF FARMING {new Date().getFullYear()}</footer>
      </div>
    </div>
  )
}
