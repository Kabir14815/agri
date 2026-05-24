import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { formatInr } from '../../utils/format.js'

function ProgressBar({ percent }) {
  return (
    <div className="mlm-progress">
      <div className="mlm-progress-fill" style={{ width: `${Math.min(100, percent)}%` }} />
    </div>
  )
}

export default function DashboardIncomes() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.getIncomes().then(setData).catch(() => {})
  }, [])

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
