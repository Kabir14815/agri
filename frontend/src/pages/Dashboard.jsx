import { Link, useNavigate } from 'react-router-dom'
import { FiMail, FiUser, FiDollarSign, FiLogOut, FiShield } from 'react-icons/fi'
import { useUserAuth } from '../user/UserAuth.jsx'

function formatAmount(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n ?? 0)
}

export default function Dashboard() {
  const { user, logout } = useUserAuth()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="user-dashboard-page">
      <div className="container">
        <div className="user-dashboard-header">
          <div>
            <span className="section-title-eyebrow">My Account</span>
            <h1 className="section-title" style={{ textAlign: 'left', marginBottom: 8 }}>
              Welcome, {user?.full_name}
            </h1>
            <p style={{ margin: 0 }}>
              Your member dashboard — account details and wallet balance at a glance.
            </p>
          </div>
          <button type="button" className="btn btn-outline" onClick={onLogout}>
            <FiLogOut /> Logout
          </button>
        </div>

        <div className="user-dashboard-grid">
          <article className="user-dash-card user-dash-card-highlight">
            <div className="user-dash-card-icon gold">
              <FiDollarSign />
            </div>
            <small>Available amount</small>
            <h2>{formatAmount(user?.amount)}</h2>
            <p>Current balance in your KGF Farming account</p>
          </article>

          <article className="user-dash-card">
            <div className="user-dash-card-icon">
              <FiUser />
            </div>
            <small>Full name</small>
            <h3>{user?.full_name}</h3>
          </article>

          <article className="user-dash-card">
            <div className="user-dash-card-icon">
              <FiMail />
            </div>
            <small>Email address</small>
            <h3 className="user-dash-email">{user?.email}</h3>
          </article>

          {user?.role && (
            <article className="user-dash-card">
              <div className="user-dash-card-icon">
                <FiShield />
              </div>
              <small>Account type</small>
              <h3 style={{ textTransform: 'capitalize' }}>{user.role}</h3>
            </article>
          )}
        </div>

        <div className="user-dashboard-actions">
          <Link to="/#products" className="btn btn-primary">
            Browse products
          </Link>
          <Link to="/contact" className="btn btn-outline">
            Contact support
          </Link>
        </div>
      </div>
    </div>
  )
}
