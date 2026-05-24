import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api.js'

export default function DashboardActivate() {
  const [d, setD] = useState(null)

  useEffect(() => {
    api.userDashboard().then(setD).catch(() => {})
  }, [])

  if (!d) return <div className="mlm-loading">Loading…</div>

  const active = d.package_amount > 0

  return (
    <>
      <h2 className="mlm-page-title">Activate</h2>
      <div className={`mlm-activate-status ${active ? 'on' : 'off'}`}>
        <h3>{active ? 'Account Active' : 'Account Inactive'}</h3>
        <p>
          {active
            ? `Your ${d.rank} membership is active with package ${d.package_amount}.`
            : 'Purchase a package to activate your account and start earning.'}
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
