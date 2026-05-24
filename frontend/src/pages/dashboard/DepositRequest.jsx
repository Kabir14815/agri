import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { formatInrPlain } from '../../utils/format.js'

export default function DepositRequest() {
  const [dash, setDash] = useState(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.userDashboard().then(setDash).catch(() => {})
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      await api.createDeposit({ amount: Number(amount), note })
      setStatus({ type: 'success', text: 'Deposit request submitted. Admin will review shortly.' })
      setAmount('')
      setNote('')
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (!dash) return <div className="mlm-loading">Loading…</div>

  return (
    <>
      <h2 className="mlm-page-title">Request Deposit</h2>
      {status && <div className={`form-message ${status.type}`}>{status.text}</div>}
      <div className="mlm-card mlm-card-green mlm-card-package" style={{ marginBottom: 20 }}>
        <small>Current Package</small>
        <h2>{formatInrPlain(dash.package_amount)}</h2>
        <p>Member ID: {dash.member_id}</p>
      </div>
      <form className="mlm-profile-form narrow" onSubmit={onSubmit}>
        <div className="mlm-profile-field">
          <label>Deposit amount (₹)</label>
          <input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="mlm-profile-field">
          <label>Note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="UPI ref, bank transfer…" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit deposit request'}
        </button>
      </form>
    </>
  )
}
