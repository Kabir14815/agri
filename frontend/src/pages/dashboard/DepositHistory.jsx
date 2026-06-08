import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api.js'
import { formatInrPlain } from '../../utils/format.js'

const STATUS_CLASS = {
  pending: 'pending',
  approved: 'achieved',
  rejected: 'pending',
}

export default function DepositHistory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.listDeposits().then((d) => { setItems(d); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="mlm-deposit-page">
      <div className="mlm-deposit-card" style={{ display: 'block' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
          <h1 className="mlm-deposit-title">Deposit History</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <Link to="/dashboard/deposit" className="btn btn-outline btn-sm">
              New request
            </Link>
          </div>
        </div>
        <p className="mlm-hint" style={{ marginBottom: 16 }}>
          Once admin approves your deposit your <strong>Topup Wallet</strong> and package amount update automatically — visit the dashboard or refresh this page to see the latest status.
        </p>

        {items.length === 0 ? (
          <p className="mlm-hint">No deposit requests yet.</p>
        ) : (
          <div className="mlm-table-wrap">
            <table className="mlm-rewards-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Mode</th>
                  <th>Amount</th>
                  <th>Txn #</th>
                  <th>Receipt</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id}>
                    <td>#{d.id}</td>
                    <td>{d.payment_mode || '—'}</td>
                    <td>{formatInrPlain(d.amount)}</td>
                    <td>{d.transaction_number || d.note || '—'}</td>
                    <td>{d.has_receipt ? 'Uploaded' : '—'}</td>
                    <td>
                      <span className={`mlm-status ${STATUS_CLASS[d.status] || ''}`}>
                        {d.status}
                      </span>
                    </td>
                    <td>{d.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
