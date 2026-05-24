import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { formatInr } from '../../utils/format.js'

const STATUS_CLASS = { pending: 'pending', approved: 'achieved', rejected: 'pending' }

export default function DashboardExchange() {
  const [data, setData] = useState(null)
  const [fromWallet, setFromWallet] = useState('income')
  const [toWallet, setToWallet] = useState('repurchase')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = () => api.getExchange().then(setData).catch(() => {})

  useEffect(() => {
    load()
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      await api.createExchange({
        from_wallet: fromWallet,
        to_wallet: toWallet,
        amount: Number(amount),
      })
      setStatus({ type: 'success', text: 'Exchange request submitted for admin approval.' })
      setAmount('')
      load()
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (!data) return <div className="mlm-loading">Loading exchange fund…</div>

  const w = data.wallets || {}

  return (
    <>
      <h2 className="mlm-page-title">Exchange Fund</h2>
      {status && <div className={`form-message ${status.type}`}>{status.text}</div>}

      <div className="mlm-grid" style={{ marginBottom: 24 }}>
        <article className="mlm-card mlm-card-wallet">
          <small>Income</small>
          <h2>{formatInr(w.income, 2)}</h2>
        </article>
        <article className="mlm-card mlm-card-repurchase">
          <small>Repurchase</small>
          <h2>{formatInr(w.repurchase, 2)}</h2>
        </article>
        <article className="mlm-card">
          <small>Topup</small>
          <h2>{formatInr(w.topup, 2)}</h2>
        </article>
      </div>

      <form className="mlm-profile-form narrow" onSubmit={onSubmit}>
        <div className="mlm-profile-field">
          <label>From wallet</label>
          <select value={fromWallet} onChange={(e) => setFromWallet(e.target.value)}>
            <option value="income">Income wallet</option>
            <option value="repurchase">Repurchase wallet</option>
            <option value="topup">Topup wallet</option>
          </select>
        </div>
        <div className="mlm-profile-field">
          <label>To wallet</label>
          <select value={toWallet} onChange={(e) => setToWallet(e.target.value)}>
            <option value="repurchase">Repurchase wallet</option>
            <option value="topup">Topup wallet</option>
            <option value="income">Income wallet</option>
          </select>
        </div>
        <div className="mlm-profile-field">
          <label>Amount (₹)</label>
          <input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Submitting…' : 'Request exchange'}
        </button>
      </form>

      <h3 className="mlm-section-label" style={{ marginTop: 32 }}>Exchange history</h3>
      {data.requests?.length === 0 ? (
        <p className="mlm-hint">No exchange requests yet.</p>
      ) : (
        <div className="mlm-table-wrap">
          <table className="mlm-rewards-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Transfer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.requests.map((ex) => (
                <tr key={ex.id}>
                  <td>#{ex.id}</td>
                  <td>
                    {ex.from_wallet} → {ex.to_wallet}
                  </td>
                  <td>{formatInr(ex.amount, 2)}</td>
                  <td>
                    <span className={`mlm-status ${STATUS_CLASS[ex.status] || ''}`}>
                      {ex.status}
                    </span>
                  </td>
                  <td>{ex.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
