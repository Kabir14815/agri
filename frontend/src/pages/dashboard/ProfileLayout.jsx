import { NavLink, Outlet } from 'react-router-dom'

const SUB = [
  { to: '/dashboard/profile', end: true, label: 'Profile' },
  { to: '/dashboard/profile/edit', label: 'Edit Profile' },
  { to: '/dashboard/profile/bank', label: 'Bank Detail' },
  { to: '/dashboard/profile/password', label: 'Change Password' },
]

export default function ProfileLayout() {
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
