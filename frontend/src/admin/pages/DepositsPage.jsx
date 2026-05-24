import { useEffect, useState } from 'react'
import { FiCheck, FiX } from 'react-icons/fi'
import { adminApi } from '../../api.js'
import { useAdminDialog } from '../AdminDialog.jsx'

function formatInr(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n ?? 0)
}

export default function DepositsPage() {
  const dialog = useAdminDialog()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)
  const [filter, setFilter] = useState('pending')

  const load = () => {
    setLoading(true)
    adminApi
      .deposits()
      .then(setItems)
      .catch((e) => setStatus({ type: 'error', text: e.message }))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const viewReceipt = async (id) => {
    try {
      const r = await adminApi.getDepositReceipt(id)
      window.open(r.data_url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      await dialog.error(e.message)
    }
  }

  const review = async (id, newStatus) => {
    const isApprove = newStatus === 'approved'
    const ok = await dialog.confirm({
      title: isApprove ? 'Approve deposit?' : 'Reject deposit?',
      message: `Deposit request #${id}`,
      detail: isApprove
        ? 'Credits the member package and starts daily investment returns.'
        : 'The member can submit a new request later.',
      confirmLabel: isApprove ? 'Approve' : 'Reject',
      variant: isApprove ? 'primary' : 'danger',
    })
    if (!ok) return
    try {
      await adminApi.updateDeposit(id, newStatus)
      setStatus({ type: 'success', text: `Deposit #${id} ${newStatus}.` })
      load()
    } catch (e) {
      setStatus({ type: 'error', text: e.message })
    }
  }

  const filtered =
    filter === 'all' ? items : items.filter((d) => d.status === filter)

  const counts = {
    all: items.length,
    pending: items.filter((d) => d.status === 'pending').length,
    approved: items.filter((d) => d.status === 'approved').length,
    rejected: items.filter((d) => d.status === 'rejected').length,
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Deposit requests</h1>
          <p>Review member deposits. Approving credits their package and topup wallet.</p>
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
        <p>Loading deposits…</p>
      ) : filtered.length === 0 ? (
        <section className="admin-panel admin-empty-state">
          <h3>No deposits</h3>
          <p>Member deposit requests will appear here.</p>
        </section>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Member</th>
                <th>Mode</th>
                <th>Amount</th>
                <th>Txn #</th>
                <th>Receipt</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>#{d.id}</td>
                  <td>
                    <strong>{d.user_name}</strong>
                    <br />
                    <small>{d.user_email}</small>
                  </td>
                  <td>{d.payment_mode || '—'}</td>
                  <td>{formatInr(d.amount)}</td>
                  <td>
                    <small>{d.transaction_number || d.note || '—'}</small>
                  </td>
                  <td>
                    {d.has_receipt ? (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => viewReceipt(d.id)}
                      >
                        View
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <span className={`role-pill sm status-${d.status}`}>{d.status}</span>
                  </td>
                  <td>{d.created_at?.slice(0, 16).replace('T', ' ')}</td>
                  <td>
                    {d.status === 'pending' ? (
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => review(d.id, 'approved')}
                          title="Approve"
                        >
                          <FiCheck />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => review(d.id, 'rejected')}
                          title="Reject"
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
