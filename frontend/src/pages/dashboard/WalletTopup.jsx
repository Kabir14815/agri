import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { formatInr } from '../../utils/format.js'

export default function WalletTopup() {
  const [w, setW] = useState(null)

  useEffect(() => {
    api.getWallet().then(setW).catch(() => {})
  }, [])

  if (!w) return <div className="mlm-loading">Loading…</div>

  return (
    <>
      <h2 className="mlm-page-title">Topup Wallet</h2>
      <article className="mlm-card" style={{ maxWidth: 360 }}>
        <small>Topup Wallet</small>
        <h2>{formatInr(w.topup_wallet, 2)}</h2>
        <p className="mlm-hint">Credited when admin approves your deposit requests.</p>
      </article>
    </>
  )
}
