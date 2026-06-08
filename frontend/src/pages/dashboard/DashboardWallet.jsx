import { useLiveDashboard } from '../../hooks/useLiveDashboard.js'
import { formatInr } from '../../utils/format.js'

export default function DashboardWallet() {
  const { data: d, loading, error, refresh } = useLiveDashboard()

  if (loading && !d) return <div className="mlm-loading">Loading wallet…</div>
  if (error && !d) {
    return (
      <div className="mlm-loading">
        <p className="form-message error">{error}</p>
        <button type="button" className="btn btn-primary" onClick={refresh}>Retry</button>
      </div>
    )
  }
  if (!d) return <div className="mlm-loading">Loading wallet…</div>

  const wallets = [
    { title: 'Income Wallet', amount: d.income_wallet, progress: d.income_wallet_progress },
    { title: 'Repurchase Wallet', amount: d.repurchase_wallet },
    { title: 'Topup Wallet', amount: d.topup_wallet },
    { title: 'Available Balance', amount: d.amount },
  ]

  return (
    <>
      <h2 className="mlm-page-title">Wallet</h2>
      <div className="mlm-grid">
        {wallets.map((w) => (
          <article key={w.title} className="mlm-card mlm-card-wallet">
            <small>{w.title}</small>
            <h2>{formatInr(w.amount, 2)}</h2>
            {w.progress != null && (
              <div className="mlm-radial small" style={{ '--p': w.progress }}>
                <span>{w.progress}%</span>
              </div>
            )}
          </article>
        ))}
      </div>
      <div className="mlm-card mlm-card-today" style={{ marginTop: 16 }}>
        <h3>Today&apos;s Incomes</h3>
        <ul>
          {d.today_incomes?.map((t) => (
            <li key={t.label}>
              <span>{t.label}</span>
              <strong>{formatInr(t.value, 4)}</strong>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
