import { Link } from 'react-router-dom'
import { useLiveDashboard } from '../../hooks/useLiveDashboard.js'

export default function DashboardActivate() {
  const { data: d, loading } = useLiveDashboard()

  if (loading || !d) return <div className="mlm-loading">Loading…</div>

  const active = d.package_amount > 0
  const minL = d.referral_plan?.min_investment || 250000

  return (
    <>
      <h2 className="mlm-page-title">Activate</h2>
      <div className={`mlm-activate-status ${active ? 'on' : 'off'}`}>
        <h3>{active ? 'Account Active' : 'Account Inactive'}</h3>
        <p>
          {active
            ? `Your ${d.rank} membership is active with package Rs ${d.package_amount.toLocaleString('en-IN')}. ${d.level_open} referral levels open.`
            : `Minimum investment Rs ${minL.toLocaleString('en-IN')} to activate and unlock 5 referral levels.`}
        </p>
        <span className="mlm-rank-badge">{d.rank}</span>
      </div>
      {!active && (
        <Link to="/dashboard/deposit" className="btn btn-primary" style={{ marginTop: 16 }}>
          View deposit options
        </Link>
      )}
      <Link to="/dashboard/rewards" className="btn btn-outline" style={{ marginTop: 12 }}>
        View reward ranks
      </Link>
    </>
  )
}
