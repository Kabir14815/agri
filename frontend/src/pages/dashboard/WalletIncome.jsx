import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api.js'
import { formatInr } from '../../utils/format.js'

export default function WalletIncome() {
  const [w, setW] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    api.getWallet()
      .then((d) => { setW(d); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  if (loading && !w) return <div className="mlm-loading">Loading wallets…</div>
  if (error && !w) {
    return (
      <div className="mlm-loading">
        <p className="form-message error">{error}</p>
        <button type="button" className="btn btn-primary" onClick={load}>Retry</button>
      </div>
    )
  }

  return (
    <>
      <h2 className="mlm-page-title">My Wallets</h2>

      <div className="mlm-grid" style={{ marginBottom: 24 }}>
        {/* Income Wallet */}
        <article className="mlm-card mlm-card-wallet">
          <div>
            <small>Income Wallet</small>
            <h2>{formatInr(w?.income_wallet, 2)}</h2>
            <p className="mlm-hint" style={{ margin: '6px 0 10px' }}>
              Receives daily interest, referral bonuses, and level income.
            </p>
            <Link to="/dashboard/wallet/transfer" className="mlm-btn-sm light" style={{ display: 'inline-block', marginRight: 8 }}>
              Transfer
            </Link>
            <Link to="/dashboard/wallet/statement?wallet=income" className="mlm-btn-sm light" style={{ display: 'inline-block' }}>
              Statement
            </Link>
          </div>
          <div className="mlm-radial" style={{ '--p': w?.income_wallet_progress ?? 0 }}>
            <span>{w?.income_wallet_progress ?? 0}%</span>
          </div>
        </article>

        {/* Repurchase Wallet */}
        <article className="mlm-card mlm-card-repurchase">
          <small>Repurchase Wallet</small>
          <h2>{formatInr(w?.repurchase_wallet, 2)}</h2>
          <p className="mlm-hint" style={{ margin: '6px 0 10px' }}>
            Use for product repurchase and repeat orders.
          </p>
          <Link to="/dashboard/wallet/statement?wallet=repurchase" className="mlm-btn-sm light" style={{ display: 'inline-block' }}>
            Statement
          </Link>
        </article>

        {/* Topup Wallet */}
        <article className="mlm-card">
          <small>Topup Wallet</small>
          <h2>{formatInr(w?.topup_wallet, 2)}</h2>
          <p className="mlm-hint" style={{ margin: '6px 0 10px' }}>
            Credited when admin approves your deposit requests.
          </p>
          <Link to="/dashboard/wallet/statement?wallet=topup" className="mlm-btn-sm light" style={{ display: 'inline-block' }}>
            Statement
          </Link>
        </article>
      </div>

      {/* Income breakdown */}
      {w?.incomes?.length > 0 && (
        <div className="mlm-card mlm-card-today" style={{ marginBottom: 16 }}>
          <h3>Income breakdown</h3>
          <ul>
            {w.incomes.map((inc) => (
              <li key={inc.key}>
                <span>{inc.label}</span>
                <strong>{formatInr(inc.value, 2)}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Today's income */}
      {w?.today_incomes?.length > 0 && (
        <div className="mlm-card mlm-card-today">
          <h3>Today&apos;s income</h3>
          <ul>
            {w.today_incomes.map((t) => (
              <li key={t.label}>
                <span>{t.label}</span>
                <strong>{formatInr(t.value, 2)}</strong>
              </li>
            ))}
          </ul>
          <p className="mlm-hint" style={{ marginTop: 10 }}>
            Interest accrues daily — visit any dashboard page to credit pending interest to your income wallet.
          </p>
        </div>
      )}

      <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh balances'}
        </button>
        <Link to="/dashboard/wallet/statement" className="btn btn-outline btn-sm">
          Full statement
        </Link>
      </div>
    </>
  )
}
