import { Link, useNavigate } from 'react-router-dom'
import { FiLock, FiKey, FiLogOut, FiShield } from 'react-icons/fi'
import { useUserAuth } from '../../user/UserAuth.jsx'

export default function DashboardSecurity() {
  const { logout, user } = useUserAuth()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      <h2 className="mlm-page-title">Security</h2>
      <p className="mlm-hint" style={{ marginBottom: 24 }}>
        Manage account security for {user?.email}.
      </p>

      <div className="mlm-security-grid">
        <Link to="/dashboard/profile/password" className="mlm-security-card">
          <span className="mlm-security-icon" style={{ background: '#1e3a5f' }}>
            <FiKey />
          </span>
          <div>
            <strong>Change password</strong>
            <p>Update your login password</p>
          </div>
        </Link>

        <Link to="/dashboard/profile/bank" className="mlm-security-card">
          <span className="mlm-security-icon" style={{ background: '#14532d' }}>
            <FiShield />
          </span>
          <div>
            <strong>Bank details</strong>
            <p>Secure payout account information</p>
          </div>
        </Link>

        <button type="button" className="mlm-security-card" onClick={onLogout}>
          <span className="mlm-security-icon" style={{ background: '#1e3a5f' }}>
            <FiLogOut />
          </span>
          <div>
            <strong>Logout</strong>
            <p>Sign out of your account</p>
          </div>
        </button>

        <div className="mlm-security-card muted">
          <span className="mlm-security-icon" style={{ background: '#334155' }}>
            <FiLock />
          </span>
          <div>
            <strong>Session active</strong>
            <p>Your dashboard session is protected</p>
          </div>
        </div>
      </div>
    </>
  )
}
