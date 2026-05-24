import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { formatInr } from '../../utils/format.js'

export default function DashboardTransactions() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.getTransactions().then((r) => setItems(r.transactions || [])).catch(() => {})
  }, [])

  const filtered =
    filter === 'all' ? items : items.filter((t) => t.category === filter)

  return (
    <>
      <h2 className="mlm-page-title">Transactions</h2>
      <div className="mlm-tree-search" style={{ marginBottom: 20, maxWidth: '100%' }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            flex: 1,
            background: '#1a1d23',
            border: '1px solid #2d323c',
            color: '#e8eaed',
            padding: '10px 14px',
            borderRadius: 6,
          }}
        >
          <option value="all">All transactions</option>
          <option value="deposit">Deposits</option>
          <option value="wallet">Wallet</option>
          <option value="exchange">Exchange</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="mlm-hint">No transactions yet.</p>
      ) : (
        <div className="mlm-table-wrap">
          <table className="mlm-rewards-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>{t.created_at?.slice(0, 16).replace('T', ' ')}</td>
                  <td>{t.category}</td>
                  <td>{t.description}</td>
                  <td>
                    {t.direction === 'debit' ? '-' : t.direction === 'transfer' ? '' : '+'}
                    {formatInr(t.amount, 2)}
                  </td>
                  <td>
                    <span className={`mlm-status ${t.status === 'completed' || t.status === 'approved' ? 'achieved' : 'pending'}`}>
                      {t.status}
                    </span>
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
