import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { formatInr } from '../../utils/format.js'

export default function WalletIncome() {
  const [w, setW] = useState(null)

  useEffect(() => {
    api.getWallet().then(setW).catch(() => {})
  }, [])

  if (!w) return <div className="mlm-loading">Loading…</div>

  return (
    <>
      <h2 className="mlm-page-title">Income Wallet</h2>
      <article className="mlm-card mlm-card-wallet" style={{ maxWidth: 360 }}>
        <small>Income Wallet Balance</small>
        <h2>{formatInr(w.income_wallet, 2)}</h2>
        <div className="mlm-radial" style={{ '--p': w.income_wallet_progress }}>
          <span>{w.income_wallet_progress}%</span>
        </div>
      </article>
      <div className="mlm-card mlm-card-today" style={{ marginTop: 16 }}>
        <h3>Income breakdown</h3>
        <ul>
          {w.incomes?.map((inc) => (
            <li key={inc.key}>
              <span>{inc.label}</span>
              <strong>{formatInr(inc.value, 2)}</strong>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
