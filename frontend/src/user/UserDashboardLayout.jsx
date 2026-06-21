import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { DashboardProvider } from '../context/DashboardContext.jsx'
import DashboardGreetings from './DashboardGreetings.jsx'
import {
  FiHome,
  FiUser,
  FiPlusCircle,
  FiUsers,
  FiCreditCard,
  FiPower,
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
  FiMenu,
  FiX,
} from 'react-icons/fi'
import { useUserAuth } from './UserAuth.jsx'
import { BRAND } from '../constants/brand.js'
import BrandLogo from '../components/BrandLogo.jsx'

const NAV = [
  { to: '/dashboard', end: true, icon: FiHome, label: 'Dashboard', color: '#f97316' },
  { to: '/dashboard/rewards', icon: FiAward, label: 'Rewards', color: '#eab308' },
  {
    key: 'profile',
    to: '/dashboard/profile',
    icon: FiUser,
    label: 'My Profile',
    color: '#22d3ee',
    submenu: [
      { to: '/dashboard/profile', end: true, label: 'View Profile' },
      { to: '/dashboard/profile/edit', label: 'Edit Profile' },
      { to: '/dashboard/profile/bank', label: 'Bank Details' },
      { to: '/dashboard/profile/password', label: 'Change Password' },
    ],
  },
  { to: '/dashboard/deposit', icon: FiPlusCircle, label: 'Make a Deposit', color: '#22c55e' },
  {
    key: 'team',
    to: '/dashboard/team',
    icon: FiUsers,
    label: 'My Team',
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
      { to: '/dashboard/wallet/transfer', label: 'Transfer Funds' },
      { to: '/dashboard/wallet/repurchase', label: 'Repurchase Wallet' },
      { to: '/dashboard/wallet/topup', label: 'Topup Wallet' },
      { to: '/dashboard/wallet/statement', label: 'Full Statement' },
    ],
  },
  { to: '/dashboard/activate', icon: FiPower, label: 'Activate Account', color: '#84cc16' },
  { to: '/dashboard/daily-log', icon: FiCamera, label: 'Daily Crop Log', color: '#16a34a' },
]

const EXTRA_NAV = [
  { to: '/dashboard/incomes', icon: FiZap, label: 'Income Details', color: '#ec4899' },
  { to: '/dashboard/exchange', icon: FiRefreshCw, label: 'Exchange Fund', color: '#1e40af' },
  { to: '/dashboard/transactions', icon: FiPieChart, label: 'Transactions', color: '#4ade80' },
  { to: '/dashboard/help-desk', icon: FiHelpCircle, label: 'Help Desk', color: '#15803d' },
  { to: '/dashboard/register-member', icon: FiUserPlus, label: 'Register Member', color: '#1e3a8a' },
  { to: '/dashboard/security', icon: FiLock, label: 'Security Settings', color: '#1e40af' },
]

const TITLES = {
  '/dashboard': 'Dashboard',
  '/dashboard/rewards': 'Rewards',
  '/dashboard/profile': 'My Profile',
  '/dashboard/profile/edit': 'Edit Profile',
  '/dashboard/profile/bank': 'Bank Details',
  '/dashboard/profile/password': 'Change Password',
  '/dashboard/deposit': 'Make a Deposit',
  '/dashboard/deposit/history': 'Deposit History',
  '/dashboard/team': 'My Team',
  '/dashboard/team/referral-tree': 'Referral Tree',
  '/dashboard/wallet': 'Income Wallet',
  '/dashboard/wallet/transfer': 'Transfer Funds',
  '/dashboard/wallet/repurchase': 'Repurchase Wallet',
  '/dashboard/wallet/topup': 'Topup Wallet',
  '/dashboard/wallet/statement': 'Wallet Statement',
  '/dashboard/activate': 'Activate Account',
  '/dashboard/daily-log': 'Daily Crop Log',
  '/dashboard/incomes': 'Income Details',
  '/dashboard/exchange': 'Exchange Fund',
  '/dashboard/transactions': 'Transactions',
  '/dashboard/help-desk': 'Help Desk',
  '/dashboard/register-member': 'Register a Member',
  '/dashboard/security': 'Security Settings',
}

export default function UserDashboardLayout() {
  const { user, logout } = useUserAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
    // Close sidebar on navigation (mobile)
    setSidebarOpen(false)
  }, [pathname])

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  const closeSidebar = () => setSidebarOpen(false)

  const pageTitle = TITLES[pathname] || 'Dashboard'

  return (
    <DashboardProvider>
    <div className="mlm-dash">

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="mlm-sidebar-overlay" onClick={closeSidebar} aria-hidden="true" />
      )}

      <aside className={`mlm-sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        {/* Sidebar header */}
        <div className="mlm-sidebar-head">
          <div className="mlm-logo">
            <BrandLogo variant="dashboard" light showText asLink={false} />
          </div>
          {/* Close button — visible only on mobile */}
          <button
            type="button"
            className="mlm-sidebar-close-btn"
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <FiX />
          </button>
        </div>

        {/* User info strip in sidebar */}
        <div className="mlm-sidebar-user">
          <div className="mlm-sidebar-avatar">{user?.full_name?.[0] || '?'}</div>
          <div className="mlm-sidebar-user-info">
            <strong>{user?.full_name || 'Member'}</strong>
            <span>{(user?.mlm?.member_id || 'KGF—')}</span>
          </div>
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
                          onClick={closeSidebar}
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
                onClick={closeSidebar}
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
                onClick={closeSidebar}
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

        {/* Logout button inside sidebar (always visible) */}
        <div className="mlm-sidebar-logout">
          <button type="button" className="mlm-sidebar-logout-btn" onClick={onLogout}>
            <FiLogOut />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <div className="mlm-main">
        <header className="mlm-topbar">
          {/* Hamburger — mobile only */}
          <button
            type="button"
            className="mlm-hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu />
          </button>

          <div className="mlm-breadcrumb">
            <span className="mlm-breadcrumb-home">Home</span>
            <span className="mlm-breadcrumb-sep"> › </span>
            <span>{pageTitle}</span>
          </div>

          <div className="mlm-topbar-right">
            <button
              type="button"
              className="mlm-topbar-btn"
              onClick={() => navigate('/dashboard/help-desk')}
              title="Help Desk"
            >
              <FiHelpCircle />
              <span className="mlm-topbar-btn-text">Help Desk</span>
            </button>

            <div className="mlm-user-chip">
              <div className="mlm-avatar">{user?.full_name?.[0] || '?'}</div>
              <span className="mlm-user-chip-name">{user?.full_name?.split(' ')[0] || 'Member'}</span>
            </div>

            <button
              type="button"
              className="mlm-topbar-btn mlm-topbar-btn--logout"
              onClick={onLogout}
              title="Log Out"
            >
              <FiLogOut />
              <span className="mlm-topbar-btn-text">Log Out</span>
            </button>
          </div>
        </header>

        <div className="mlm-content">
          <DashboardGreetings />
          <Outlet />
        </div>

        <footer className="mlm-footer">© {BRAND.fullName} {new Date().getFullYear()}</footer>
      </div>
    </div>
    </DashboardProvider>
  )
}
