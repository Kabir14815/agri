import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { formatInrPlain } from '../../utils/format.js'

export default function DashboardDeposit() {
  const [d, setD] = useState(null)

  useEffect(() => {
    api.userDashboard().then(setD).catch(() => {})
  }, [])

  if (!d) return <div className="mlm-loading">Loading…</div>

  return (
    <>
      <h2 className="mlm-page-title">Deposit</h2>
      <div className="mlm-card mlm-card-green mlm-card-package">
        <small>Current Package</small>
        <h2>{formatInrPlain(d.package_amount)}</h2>
        <p>Member ID: {d.member_id}</p>
      </div>
      <p className="mlm-hint">
        To upgrade your package, contact KGF Farming support or use the Topup Wallet after
        admin approval.
      </p>
      <div className="mlm-card">
        <small>Topup Wallet Balance</small>
        <h3>{formatInrPlain(d.topup_wallet)}</h3>
      </div>
    </>
  )
}
