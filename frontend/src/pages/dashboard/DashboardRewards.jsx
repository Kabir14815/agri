import { useLiveDashboard } from '../../hooks/useLiveDashboard.js'
import { formatInrPlain } from '../../utils/format.js'

export default function DashboardRewards() {
  const { data: d, loading, error, refresh } = useLiveDashboard()

  if (loading && !d) return <div className="mlm-loading">Loading rewards…</div>
  if (error && !d) {
    return (
      <div className="mlm-loading">
        <p className="form-message error">{error}</p>
        <button type="button" className="btn btn-primary" onClick={refresh}>Retry</button>
      </div>
    )
  }
  if (!d) return <div className="mlm-loading">Loading rewards…</div>

  return (
    <>
      <h2 className="mlm-page-title">Reward</h2>

      <div className="mlm-leg-stats">
        <div className="mlm-leg-box">
          Main Leg Business: <strong>{formatInrPlain(d.main_leg_business)}</strong>
        </div>
        <div className="mlm-leg-box">
          Rest Leg Business: <strong>{formatInrPlain(d.rest_leg_business)}</strong>
        </div>
      </div>

      <div className="mlm-table-wrap">
        <table className="mlm-rewards-table">
          <thead>
            <tr>
              <th>Sr. No</th>
              <th>Rank</th>
              <th>Required Power Business</th>
              <th>Required Rest Business</th>
              <th>Reward</th>
              <th>Salary Amount</th>
              <th>Total Month</th>
              <th>Total Amount</th>
              <th>Capping</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {d.ranks?.map((row) => (
              <tr key={row.rank}>
                <td>{row.sr}</td>
                <td><strong>{row.rank}</strong></td>
                <td>
                  {row.is_next_increment ? 'NEXT ' : ''}
                  {formatInrPlain(row.required_power)}
                </td>
                <td>
                  {row.is_next_increment ? 'NEXT ' : ''}
                  {formatInrPlain(row.required_rest)}
                </td>
                <td>{row.reward}</td>
                <td>{formatInrPlain(row.salary_amount)}</td>
                <td>{row.total_months}</td>
                <td>{formatInrPlain(row.total_amount)}</td>
                <td>{formatInrPlain(row.capping)}</td>
                <td>
                  <span className={`mlm-status ${row.status}`}>
                    {row.status === 'achieved' ? 'Achieved' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
