import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api.js'
import { formatInr } from '../../utils/format.js'

export default function WalletRepurchase() {
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
      <h2 className="mlm-page-title">Repurchase Wallet</h2>
      <article className="mlm-card mlm-card-repurchase" style={{ maxWidth: 400, marginBottom: 20 }}>
        <small>Repurchase Wallet</small>
        <h2>{formatInr(w?.repurchase_wallet, 2)}</h2>
        <p className="mlm-hint" style={{ marginTop: 8 }}>
          Use for product repurchase and repeat orders. Fund it via Exchange from your Income wallet.
        </p>
      </article>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
        <Link to="/dashboard/wallet/statement?wallet=repurchase" className="btn btn-outline btn-sm">
          View statement
        </Link>
        <Link to="/dashboard/exchange" className="btn btn-outline btn-sm">
          Exchange funds
        </Link>
      </div>
    </>
  )
}
