import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { formatInr } from '../../utils/format.js'

export default function WalletRepurchase() {
  const [w, setW] = useState(null)

  useEffect(() => {
    api.getWallet().then(setW).catch(() => {})
  }, [])

  if (!w) return <div className="mlm-loading">Loading…</div>

  return (
    <>
      <h2 className="mlm-page-title">Repurchase Wallet</h2>
      <article className="mlm-card mlm-card-repurchase" style={{ maxWidth: 360 }}>
        <small>Repurchase Wallet</small>
        <h2>{formatInr(w.repurchase_wallet, 2)}</h2>
        <p className="mlm-hint">Use for product repurchase and repeat orders.</p>
      </article>
    </>
  )
}
