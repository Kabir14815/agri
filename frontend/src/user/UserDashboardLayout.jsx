import { NavLink, Outlet, useNavigate } from 'react-router-dom'
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
  FiAward,
} from 'react-icons/fi'
import { useUserAuth } from './UserAuth.jsx'

const NAV = [
  { to: '/dashboard', end: true, icon: FiHome, label: 'Dashboards', color: '#f97316' },
  { to: '/dashboard/rewards', icon: FiAward, label: 'Rewards', color: '#eab308' },
  { to: '/dashboard/profile', icon: FiUser, label: 'Profile', color: '#22d3ee', submenu: true },
  { to: '/dashboard/deposit', icon: FiPlusCircle, label: 'Deposit', color: '#22c55e' },
  { to: '/dashboard/team', icon: FiUsers, label: 'Team', color: '#ec4899', submenu: true },
  { to: '/dashboard/wallet', icon: FiCreditCard, label: 'Wallet', color: '#a855f7', submenu: true },
  { to: '/dashboard/activate', icon: FiPower, label: 'Activate', color: '#84cc16', submenu: true },
]

export default function UserDashboardLayout() {
  const { user, logout } = useUserAuth()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="mlm-dash">
      <aside className="mlm-sidebar">
        <div className="mlm-logo">
          <span className="mlm-logo-badge">KGF</span>
          <span>GROUP</span>
        </div>
        <nav className="mlm-nav">
          {NAV.map(({ to, end, icon: Icon, label, color, submenu }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `mlm-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="mlm-nav-icon" style={{ color }}>
                <Icon />
              </span>
              <span>{label}</span>
              {submenu && <FiChevronRight className="mlm-nav-chevron" />}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="mlm-main">
        <header className="mlm-topbar">
          <div className="mlm-breadcrumb">Home &gt; Dashboard</div>
          <div className="mlm-topbar-right">
            <button type="button" className="mlm-icon-btn" aria-label="Notifications">
              <FiBell />
              <span className="mlm-badge">0</span>
            </button>
            <div className="mlm-user-chip">
              <span>{user?.full_name?.split(' ')[0]}…</span>
              <div className="mlm-avatar">{user?.full_name?.[0]}</div>
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
