import { useEffect, useState } from 'react'
import { FiCheck, FiX } from 'react-icons/fi'
import { adminApi } from '../../api.js'

function formatInr(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n ?? 0)
}

export default function ExchangePage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)
  const [filter, setFilter] = useState('pending')

  const load = () => {
    setLoading(true)
    adminApi
      .exchanges()
      .then(setItems)
      .catch((e) => setStatus({ type: 'error', text: e.message }))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const review = async (id, newStatus) => {
    if (!confirm(`${newStatus === 'approved' ? 'Approve' : 'Reject'} exchange #${id}?`)) return
    try {
      await adminApi.updateExchange(id, newStatus)
      setStatus({ type: 'success', text: `Exchange #${id} ${newStatus}.` })
      load()
    } catch (e) {
      setStatus({ type: 'error', text: e.message })
    }
  }

  const filtered =
    filter === 'all' ? items : items.filter((ex) => ex.status === filter)

  const counts = {
    all: items.length,
    pending: items.filter((ex) => ex.status === 'pending').length,
    approved: items.filter((ex) => ex.status === 'approved').length,
    rejected: items.filter((ex) => ex.status === 'rejected').length,
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Exchange fund</h1>
          <p>Approve wallet transfers between income, repurchase, and topup.</p>
        </div>
      </div>

      {status && <div className={`form-message ${status.type}`}>{status.text}</div>}

      <div className="admin-filter-tabs">
        {['pending', 'approved', 'rejected', 'all'].map((f) => (
          <button
            key={f}
            type="button"
            className={`admin-filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="tab-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : filtered.length === 0 ? (
        <section className="admin-panel admin-empty-state">
          <h3>No exchange requests</h3>
        </section>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Member</th>
                <th>Transfer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ex) => (
                <tr key={ex.id}>
                  <td>#{ex.id}</td>
                  <td>
                    <strong>{ex.user_name}</strong>
                    <br />
                    <small>{ex.user_email}</small>
                  </td>
                  <td>
                    {ex.from_wallet} → {ex.to_wallet}
                  </td>
                  <td>{formatInr(ex.amount)}</td>
                  <td>
                    <span className={`role-pill sm status-${ex.status}`}>{ex.status}</span>
                  </td>
                  <td>{ex.created_at?.slice(0, 16).replace('T', ' ')}</td>
                  <td>
                    {ex.status === 'pending' ? (
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => review(ex.id, 'approved')}
                        >
                          <FiCheck />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => review(ex.id, 'rejected')}
                        >
                          <FiX />
                        </button>
                      </div>
                    ) : (
                      '—'
                    )}
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
