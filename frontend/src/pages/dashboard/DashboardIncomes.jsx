import { Link } from 'react-router-dom'
import { useLiveDashboard } from '../../hooks/useLiveDashboard.js'
import { formatInr } from '../../utils/format.js'

function ProgressBar({ percent }) {
  return (
    <div className="mlm-progress">
      <div className="mlm-progress-fill" style={{ width: `${Math.min(100, percent)}%` }} />
    </div>
  )
}

export default function DashboardIncomes() {
  const { data, loading, error, refresh } = useLiveDashboard()

  if (loading && !data) return <div className="mlm-loading">Loading incomes…</div>
  if (error && !data) {
    return (
      <div className="mlm-loading">
        <p className="form-message error">{error}</p>
        <button type="button" className="btn btn-primary" onClick={refresh}>Retry</button>
      </div>
    )
  }
  if (!data) return <div className="mlm-loading">Loading incomes…</div>

  return (
    <>
      <h2 className="mlm-page-title">Incomes</h2>
      <div className="mlm-card mlm-card-today" style={{ marginBottom: 20 }}>
        <small>Total earning</small>
        <h2>{formatInr(data.total_earning, 2)}</h2>
      </div>

      <h3 className="mlm-section-label">Income summary</h3>
      <div className="mlm-income-list">
        {data.incomes?.map((inc) => (
          <div key={inc.key} className="mlm-income-row">
            <div>
              <strong>{inc.label}</strong>
              <ProgressBar percent={inc.percent} />
            </div>
            <span>{formatInr(inc.value, 2)}</span>
          </div>
        ))}
      </div>

      {data.investment?.principal > 0 && (
        <>
          <h3 className="mlm-section-label" style={{ marginTop: 28 }}>
            Rental income (10% monthly, 2% TDS on rental income)
          </h3>
          <div className="mlm-grid" style={{ marginBottom: 20 }}>
            <article className="mlm-card">
              <small>Invested amount</small>
              <h2>{formatInr(data.investment.principal, 2)}</h2>
            </article>
            <article className="mlm-card">
              <small>Daily net credit</small>
              <h2>{formatInr(data.investment.daily_net, 2)}</h2>
            </article>
            <article className="mlm-card">
              <small>Monthly net (approx.)</small>
              <h2>{formatInr(data.investment.monthly_net, 2)}</h2>
            </article>
            <article className="mlm-card">
              <small>Total rental income earned</small>
              <h2>{formatInr(data.investment.total_interest_net, 2)}</h2>
              {data.investment.interest_cap_net > 0 && (
                <p className="mlm-hint" style={{ marginTop: 8, marginBottom: 0 }}>
                  Cap: {formatInr(data.investment.interest_cap_net, 2)} (10× investment)
                  {data.investment.interest_cap_reached
                    ? ' — limit reached'
                    : ` · ${formatInr(data.investment.interest_remaining_net, 2)} remaining`}
                </p>
              )}
            </article>
            <article className="mlm-card">
              <small>Total TDS deducted (2%)</small>
              <h2>{formatInr(data.investment.total_tds, 2)}</h2>
            </article>
            <article className="mlm-card mlm-card-warn">
              <small>Rental income cut today (no photo)</small>
              <h2>{formatInr(data.investment.penalty_today || 0, 2)}</h2>
            </article>
            <article className="mlm-card mlm-card-warn">
              <small>Total rental income lost (missed photos)</small>
              <h2>{formatInr(data.investment.penalty_total || 0, 2)}</h2>
            </article>
            <article className="mlm-card">
              <small>Missed upload days</small>
              <h2>{data.investment.missed_days_total || 0}</h2>
            </article>
          </div>
          <p className="mlm-hint">
            Rental income is calculated daily (10% ÷ 30 days per month), up to 10× your invested
            amount. 2% TDS is deducted from each day&apos;s gross rental income before crediting your
            income wallet. Upload a daily crop
            photo on <Link to="/dashboard/daily-log">Daily Crop Log</Link> — missing a day cuts
            that day&apos;s rental income only.
          </p>
        </>
      )}

      <h3 className="mlm-section-label" style={{ marginTop: 28 }}>Today&apos;s income</h3>
      <ul className="mlm-today-list">
        {data.today_incomes?.map((t) => (
          <li key={t.label}>
            <span>{t.label}</span>
            <strong>{formatInr(t.value, 2)}</strong>
          </li>
        ))}
      </ul>

      {data.earning_limits && (
        <>
          <h3 className="mlm-section-label" style={{ marginTop: 28 }}>Earning limits</h3>
          <div className="mlm-grid">
            <article className="mlm-card">
              <small>Total limit</small>
              <h2>{formatInr(data.earning_limits.total, 0)}</h2>
            </article>
            <article className="mlm-card">
              <small>Pending</small>
              <h2>{formatInr(data.earning_limits.pending, 0)}</h2>
            </article>
            <article className="mlm-card">
              <small>Used</small>
              <h2>{formatInr(data.earning_limits.used, 0)}</h2>
            </article>
          </div>
        </>
      )}
    </>
  )
}
