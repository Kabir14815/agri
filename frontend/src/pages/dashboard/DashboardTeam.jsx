import { Link } from 'react-router-dom'
import { useLiveDashboard } from '../../hooks/useLiveDashboard.js'
import { formatInrPlain } from '../../utils/format.js'

export default function DashboardTeam() {
  const { data: d, loading } = useLiveDashboard()

  if (loading || !d) return <div className="mlm-loading">Loading team…</div>

  return (
    <>
      <h2 className="mlm-page-title">Team</h2>
      <Link to="/dashboard/team/referral-tree" className="btn btn-primary" style={{ marginBottom: 20 }}>
        Open referral tree
      </Link>
      <div className="mlm-leg-stats">
        <div className="mlm-leg-box">
          Main Leg Business: <strong>{formatInrPlain(d.main_leg_business)}</strong>
        </div>
        <div className="mlm-leg-box">
          Rest Leg Business: <strong>{formatInrPlain(d.rest_leg_business)}</strong>
        </div>
      </div>
      <div className="mlm-grid">
        <article className="mlm-card mlm-card-business yellow">
          <small>Team Business</small>
          <h2>{formatInrPlain(d.team_business)}</h2>
        </article>
        <article className="mlm-card mlm-card-business blue">
          <small>Direct Business</small>
          <h2>{formatInrPlain(d.direct_business)}</h2>
        </article>
        <article className="mlm-card mlm-card-level">
          <small>Direct Active Users</small>
          <h2 className="mlm-big-num">{d.direct_active_users}</h2>
        </article>
        <article className="mlm-card mlm-card-level">
          <small>Referral tree depth</small>
          <h2 className="mlm-big-num">{d.level_open || d.referral_plan?.tree_levels || 24}</h2>
          <p>
            {d.referral_plan?.bonus_levels || 5} bonus levels @ {d.referral_plan?.bonus_rate_percent || 2}%
          </p>
          <p>{d.subscribers_count} total subscribers</p>
        </article>
      </div>
    </>
  )
}
