import { NavLink, Outlet } from 'react-router-dom'

export default function DashboardSectionLayout({ tabs }) {
  return (
    <div className="mlm-profile-wrap">
      <nav className="mlm-profile-subnav">
        {tabs.map(({ to, end, label }) => (
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
