import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { useUserAuth } from '../../user/UserAuth.jsx'
import { formatInr } from '../../utils/format.js'

export default function WalletTransfer() {
  const { user } = useUserAuth()
  const [data, setData] = useState(null)
  const [toMemberId, setToMemberId] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [lookupStatus, setLookupStatus] = useState(null)
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const [loadError, setLoadError] = useState(null)

  const load = () => {
    setLoadError(null)
    return api.getWalletTransfer().then(setData).catch((e) => setLoadError(e.message))
  }

  useEffect(() => {
    load()
  }, [])

  const normalizedId = toMemberId.trim().toUpperCase()

  useEffect(() => {
    if (!normalizedId || normalizedId.length < 6) {
      setRecipientName('')
      setLookupStatus(null)
      return
    }
    const timer = setTimeout(() => {
      api
        .lookupWalletTransferMember(normalizedId)
        .then((r) => {
          setRecipientName(r.full_name || '')
          setLookupStatus({ type: 'success', text: r.full_name })
        })
        .catch((err) => {
          setRecipientName('')
          setLookupStatus({ type: 'error', text: err.message })
        })
    }, 400)
    return () => clearTimeout(timer)
  }, [normalizedId])

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      const res = await api.createWalletTransfer({
        to_member_id: normalizedId,
        amount: Number(amount),
      })
      setStatus({
        type: 'success',
        text: `₹${Number(amount).toFixed(2)} transferred successfully.`,
      })
      setToMemberId('')
      setRecipientName('')
      setAmount('')
      setLookupStatus(null)
      setData((prev) =>
        prev
          ? {
              ...prev,
              available_fund: res.available_fund,
              transfers: [res.transfer, ...(prev.transfers || [])],
            }
          : prev
      )
      load()
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (loadError && !data) {
    return (
      <div className="mlm-loading">
        <p className="form-message error">{loadError}</p>
        <button type="button" className="btn btn-primary" onClick={load}>Retry</button>
      </div>
    )
  }
  if (!data) return <div className="mlm-loading">Loading wallet transfer…</div>

  const minAmount = data.min_amount ?? 100
  const canTransfer =
    normalizedId &&
    recipientName &&
    lookupStatus?.type === 'success' &&
    Number(amount) >= minAmount

  return (
    <>
      <h2 className="mlm-page-title">Wallet Transfer</h2>
      {status && <div className={`form-message ${status.type}`}>{status.text}</div>}

      <form className="mlm-profile-form narrow mlm-wallet-transfer-form" onSubmit={onSubmit}>
        <div className="mlm-profile-field">
          <label>Total available fund</label>
          <input
            className="form-control"
            type="text"
            readOnly
            value={formatInr(data.available_fund, 2)}
          />
        </div>

        <div className="mlm-profile-field">
          <label>Transfer to ID</label>
          <input
            className="form-control"
            value={toMemberId}
            onChange={(e) => setToMemberId(e.target.value.toUpperCase())}
            placeholder="Recipient member ID"
            autoComplete="off"
            required
          />
          {lookupStatus && (
            <small className={`referral-code-hint ${lookupStatus.type}`}>
              {lookupStatus.type === 'success'
                ? `Member found: ${lookupStatus.text}`
                : lookupStatus.text}
            </small>
          )}
        </div>

        <div className="mlm-profile-field">
          <label>Enter name</label>
          <input
            className="form-control"
            type="text"
            readOnly
            value={recipientName}
            placeholder="Name appears after valid member ID"
          />
        </div>

        <div className="mlm-profile-field">
          <label>Enter amount (minimum {minAmount})</label>
          <input
            className="form-control"
            type="number"
            min={minAmount}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Min ₹${minAmount}`}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading || !canTransfer}>
          {loading ? 'Transferring…' : 'Transfer'}
        </button>
      </form>

      <h3 className="mlm-section-label" style={{ marginTop: 32 }}>
        Transfer history
      </h3>
      {!data.transfers || data.transfers.length === 0 ? (
        <p className="mlm-hint">No wallet transfers yet.</p>
      ) : (
        <div className="mlm-table-wrap">
          <table className="mlm-rewards-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Member</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.transfers.map((tr) => {
                const sent = tr.from_user_id === user?.id
                const peerId = sent ? tr.to_member_id : tr.from_member_id
                const peerName = sent ? tr.to_name : tr.from_name
                return (
                  <tr key={tr.id}>
                    <td>#{tr.id}</td>
                    <td>{sent ? 'Sent' : 'Received'}</td>
                    <td>
                      {peerId}
                      {peerName ? ` (${peerName})` : ''}
                    </td>
                    <td>{formatInr(tr.amount, 2)}</td>
                    <td>{tr.created_at?.slice(0, 10)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
