import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api.js'
import { formatInr } from '../../utils/format.js'

export default function WalletTopup() {
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

  if (loading && !w) return <div className="mlm-loading">Loading…</div>
  if (error) {
    return (
      <div className="mlm-loading">
        <p className="form-message error">{error}</p>
        <button type="button" className="btn btn-primary" onClick={load}>Retry</button>
      </div>
    )
  }

  return (
    <>
      <h2 className="mlm-page-title">Topup Wallet</h2>
      <article className="mlm-card" style={{ maxWidth: 400, marginBottom: 20 }}>
        <small>Topup Wallet</small>
        <h2>{formatInr(w?.topup_wallet, 2)}</h2>
        <p className="mlm-hint" style={{ marginTop: 8 }}>
          Credited when admin approves your deposit requests. Use the deposit form to add funds.
        </p>
      </article>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
        <Link to="/dashboard/wallet/statement?wallet=topup" className="btn btn-outline btn-sm">
          View statement
        </Link>
        <Link to="/dashboard/deposit" className="btn btn-outline btn-sm">
          Deposit funds
        </Link>
      </div>
    </>
  )
}
