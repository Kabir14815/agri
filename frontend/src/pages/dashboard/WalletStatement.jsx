import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { formatInr } from '../../utils/format.js'

export default function WalletStatement() {
  const [entries, setEntries] = useState([])
  const [wallet, setWallet] = useState('')

  const load = () => {
    api.getWalletStatement(wallet || undefined).then((r) => setEntries(r.entries || []))
  }

  useEffect(load, [wallet])

  return (
    <>
      <h2 className="mlm-page-title">Wallet Statement</h2>
      <div className="mlm-tree-search" style={{ marginBottom: 20 }}>
        <select
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
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
        <button type="button" onClick={load}>
          refresh
        </button>
      </div>
      <p className="mlm-hint" style={{ marginBottom: 12 }}>
        Approved deposits appear under <strong>Topup</strong>. Daily interest credits appear under <strong>Income</strong>. Interest accrues each time you visit any dashboard page.
      </p>
      {entries.length === 0 ? (
        <p className="mlm-hint">No transactions yet. Approved deposits appear here.</p>
      ) : (
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
                  <td>{e.wallet}</td>
                  <td>{e.description}</td>
                  <td>
                    {e.direction === 'credit' ? '+' : '-'}
                    {formatInr(e.amount, 2)}
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
