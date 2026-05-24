import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { formatInrPlain } from '../../utils/format.js'

const STATUS_CLASS = {
  pending: 'pending',
  approved: 'achieved',
  rejected: 'pending',
}

export default function DepositHistory() {
  const [items, setItems] = useState([])

  useEffect(() => {
    api.listDeposits().then(setItems).catch(() => {})
  }, [])

  return (
    <>
      <h2 className="mlm-page-title">Deposit History</h2>
      {items.length === 0 ? (
        <p className="mlm-hint">No deposit requests yet.</p>
      ) : (
        <div className="mlm-table-wrap">
          <table className="mlm-rewards-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id}>
                  <td>#{d.id}</td>
                  <td>{formatInrPlain(d.amount)}</td>
                  <td>
                    <span className={`mlm-status ${STATUS_CLASS[d.status] || ''}`}>
                      {d.status}
                    </span>
                  </td>
                  <td>{d.created_at?.slice(0, 10)}</td>
                  <td>{d.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
