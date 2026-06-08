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
  FiZap,
  FiRefreshCw,
  FiPieChart,
  FiHelpCircle,
  FiUserPlus,
  FiLock,
  FiCamera,
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
  {
    key: 'team',
    to: '/dashboard/team',
    icon: FiUsers,
    label: 'Team',
    color: '#ec4899',
    submenu: [
      { to: '/dashboard/team', end: true, label: 'Team Overview' },
      { to: '/dashboard/team/referral-tree', label: 'Referral Tree' },
    ],
  },
  {
    key: 'wallet',
    to: '/dashboard/wallet',
    icon: FiCreditCard,
    label: 'Wallet',
    color: '#a855f7',
    submenu: [
      { to: '/dashboard/wallet', end: true, label: 'Income Wallet' },
      { to: '/dashboard/wallet/transfer', label: 'Wallet Transfer' },
      { to: '/dashboard/wallet/repurchase', label: 'Repurchase Wallet' },
      { to: '/dashboard/wallet/topup', label: 'Topup Wallet' },
      { to: '/dashboard/wallet/statement', label: 'Wallet Statement' },
    ],
  },
  { to: '/dashboard/activate', icon: FiPower, label: 'Activate', color: '#84cc16' },
  { to: '/dashboard/daily-log', icon: FiCamera, label: 'Daily Crop Log', color: '#16a34a' },
]

/** Extra menu — circular icon style (mobile-style shortcuts) */
const EXTRA_NAV = [
  { to: '/dashboard/incomes', icon: FiZap, label: 'Incomes', color: '#ec4899' },
  { to: '/dashboard/exchange', icon: FiRefreshCw, label: 'Exchange Fund', color: '#1e40af' },
  { to: '/dashboard/transactions', icon: FiPieChart, label: 'Transactions', color: '#4ade80' },
  { to: '/dashboard/help-desk', icon: FiHelpCircle, label: 'Help Desk', color: '#15803d' },
  { to: '/dashboard/register-member', icon: FiUserPlus, label: 'Register', color: '#1e3a8a' },
  { to: '/dashboard/security', icon: FiLock, label: 'Security', color: '#1e40af', isLogout: false },
]

const TITLES = {
  '/dashboard': 'Dashboard',
  '/dashboard/rewards': 'Rewards',
  '/dashboard/profile': 'Profile',
  '/dashboard/profile/edit': 'Edit Profile',
  '/dashboard/profile/bank': 'Bank Detail',
  '/dashboard/profile/password': 'Change Password',
  '/dashboard/deposit': 'Deposit',
  '/dashboard/deposit/history': 'Deposit History',
  '/dashboard/team': 'Team',
  '/dashboard/team/referral-tree': 'Referral Tree',
  '/dashboard/wallet': 'Wallet',
  '/dashboard/wallet/transfer': 'Wallet Transfer',
  '/dashboard/wallet/repurchase': 'Repurchase Wallet',
  '/dashboard/wallet/topup': 'Topup Wallet',
  '/dashboard/wallet/statement': 'Wallet Statement',
  '/dashboard/activate': 'Activate',
  '/dashboard/daily-log': 'Daily Crop Log',
  '/dashboard/incomes': 'Incomes',
  '/dashboard/exchange': 'Exchange Fund',
  '/dashboard/transactions': 'Transactions',
  '/dashboard/help-desk': 'Help Desk',
  '/dashboard/register-member': 'Register',
  '/dashboard/security': 'Security',
}

export default function UserDashboardLayout() {
  const { user, logout } = useUserAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [openMenus, setOpenMenus] = useState({
    profile: pathname.startsWith('/dashboard/profile'),
    team: pathname.startsWith('/dashboard/team'),
    wallet: pathname.startsWith('/dashboard/wallet'),
  })

  useEffect(() => {
    const keys = ['profile', 'team', 'wallet']
    keys.forEach((key) => {
      if (pathname.startsWith(`/dashboard/${key}`)) {
        setOpenMenus((o) => ({ ...o, [key]: true }))
      }
    })
  }, [pathname])

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
                    onClick={() => {
                      navigate(item.to)
                      setOpenMenus((o) => ({ ...o, [item.key]: true }))
                    }}
                  >
                    <span className="mlm-nav-icon" style={{ color: item.color }}>
                      <Icon />
                    </span>
                    <span>{item.label}</span>
                    {openMenus[item.key] ? (
                      <FiChevronDown className="mlm-nav-chevron" />
                    ) : (
                      <FiChevronRight className="mlm-nav-chevron" />
                    )}
                  </button>
                  {openMenus[item.key] && (
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

        <div className="mlm-nav-extra">
          <p className="mlm-nav-extra-label">More</p>
          {EXTRA_NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `mlm-nav-extra-item${isActive ? ' active' : ''}`
                }
              >
                <span className="mlm-nav-extra-icon" style={{ background: item.color }}>
                  <Icon />
                </span>
                <span className="mlm-nav-extra-text">{item.label}</span>
                <FiChevronRight className="mlm-nav-extra-chevron" />
              </NavLink>
            )
          })}
        </div>
      </aside>

      <div className="mlm-main">
        <header className="mlm-topbar">
          <div className="mlm-breadcrumb">
            Home &gt; {pageTitle}
          </div>
          <div className="mlm-topbar-right">
            <button type="button" className="mlm-icon-btn" aria-label="Help desk" title="Help Desk" onClick={() => navigate('/dashboard/help-desk')}>
              <FiBell />
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
