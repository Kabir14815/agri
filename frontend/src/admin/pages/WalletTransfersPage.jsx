import { useEffect, useState } from 'react'
import { adminApi } from '../../api.js'

function formatInr(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n ?? 0)
}

export default function WalletTransfersPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    adminApi
      .walletTransfers()
      .then(setItems)
      .catch((e) => setStatus({ type: 'error', text: e.message }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Wallet transfers</h1>
          <p>Peer-to-peer transfers between member income wallets.</p>
        </div>
      </div>

      {status && <div className={`form-message ${status.type}`}>{status.text}</div>}

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <section className="admin-panel admin-empty-state">
          <h3>No wallet transfers yet</h3>
          <p>Transfers appear here when members send funds to each other.</p>
        </section>
      ) : (
        <section className="admin-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Amount</th>
                  <th>Wallet</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((tr) => (
                  <tr key={tr.id}>
                    <td>#{tr.id}</td>
                    <td>
                      {tr.from_member_id}
                      <br />
                      <small>{tr.from_name}</small>
                    </td>
                    <td>
                      {tr.to_member_id}
                      <br />
                      <small>{tr.to_name}</small>
                    </td>
                    <td>{formatInr(tr.amount)}</td>
                    <td>{tr.wallet}</td>
                    <td>
                      <span className="admin-badge success">{tr.status}</span>
                    </td>
                    <td>{tr.created_at?.slice(0, 19).replace('T', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  )
}
