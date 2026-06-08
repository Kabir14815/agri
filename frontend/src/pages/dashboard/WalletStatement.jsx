import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api.js'
import { formatInr } from '../../utils/format.js'

export default function WalletStatement() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const wallet = searchParams.get('wallet') || ''

  const load = (w) => {
    setLoading(true)
    setLoadError(null)
    api.getWalletStatement(w || undefined)
      .then((r) => { setEntries(r.entries || []) })
      .catch((e) => { setLoadError(e.message) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(wallet) }, [wallet])

  return (
    <>
      <h2 className="mlm-page-title">Wallet Statement</h2>
      <div className="mlm-tree-search" style={{ marginBottom: 12 }}>
        <select
          value={wallet}
          onChange={(e) => setSearchParams(e.target.value ? { wallet: e.target.value } : {})}
          style={{
            flex: 1,
            background: '#1a1d23',
            border: '1px solid #2d323c',
            color: '#e8eaed',
            padding: '10px 14px',
            borderRadius: 6,
          }}
        >
          <option value="">All wallets</option>
          <option value="income">Income</option>
          <option value="repurchase">Repurchase</option>
          <option value="topup">Topup</option>
        </select>
        <button type="button" onClick={() => load(wallet)} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      <p className="mlm-hint" style={{ marginBottom: 16 }}>
        Approved deposits appear under <strong>Topup</strong>. Daily interest and referral bonuses appear under <strong>Income</strong>.
        Interest accrues each time you visit any dashboard page.
      </p>
      {loadError && (
        <div className="form-message error" style={{ marginBottom: 12 }}>
          {loadError}
          <button type="button" className="btn btn-sm btn-outline" style={{ marginLeft: 12 }} onClick={() => load(wallet)}>Retry</button>
        </div>
      )}
      {loading ? (
        <div className="mlm-loading">Loading…</div>
      ) : entries.length === 0 && !loadError ? (
        <p className="mlm-hint">No transactions yet. Approved deposits and interest credits appear here.</p>
      ) : !loadError ? (
        <div className="mlm-table-wrap">
          <table className="mlm-rewards-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Wallet</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{e.created_at?.slice(0, 16).replace('T', ' ')}</td>
                  <td><span className="mlm-status">{e.wallet}</span></td>
                  <td>{e.description}</td>
                  <td style={{ color: e.direction === 'credit' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                    {e.direction === 'credit' ? '+' : '−'}{formatInr(e.amount, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
