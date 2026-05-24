import { NavLink, Outlet } from 'react-router-dom'

const SUB = [
  { to: '/dashboard/team', end: true, label: 'Team Overview' },
  { to: '/dashboard/team/referral-tree', label: 'Referral Tree' },
]

export default function TeamLayout() {
  return (
    <div className="mlm-profile-wrap">
      <nav className="mlm-profile-subnav">
        {SUB.map(({ to, end, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `mlm-profile-tab${isActive ? ' active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
