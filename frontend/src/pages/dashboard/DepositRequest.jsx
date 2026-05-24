import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api.js'

const DEFAULT_MODES = ['UPI', 'Bank Transfer', 'NEFT', 'RTGS', 'IMPS', 'Cash', 'Other']

export default function DepositRequest() {
  const [modes, setModes] = useState(DEFAULT_MODES)
  const [paymentMode, setPaymentMode] = useState('')
  const [amount, setAmount] = useState('')
  const [transactionNumber, setTransactionNumber] = useState('')
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptLabel, setReceiptLabel] = useState('No file chosen')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    api.getDepositModes?.().then((r) => setModes(r.modes || DEFAULT_MODES)).catch(() => {})
  }, [])

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    setReceiptFile(file || null)
    setReceiptLabel(file ? file.name : 'No file chosen')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!paymentMode) {
      setStatus({ type: 'error', text: 'Please select mode of payment.' })
      return
    }
    setLoading(true)
    setStatus(null)
    try {
      const formData = new FormData()
      formData.append('payment_mode', paymentMode)
      formData.append('amount', String(Number(amount)))
      formData.append('transaction_number', transactionNumber.trim())
      if (receiptFile) formData.append('receipt', receiptFile)

      await api.createDeposit(formData)
      setStatus({ type: 'success', text: 'Deposit request sent successfully.' })
      setPaymentMode('')
      setAmount('')
      setTransactionNumber('')
      setReceiptFile(null)
      setReceiptLabel('No file chosen')
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mlm-deposit-page">
      <div className="mlm-deposit-card">
        <h1 className="mlm-deposit-title">Deposit</h1>

        <div className="mlm-deposit-form-wrap">
          {status && (
            <div className={`form-message ${status.type}`} style={{ marginBottom: 16 }}>
              {status.text}
            </div>
          )}

          <form className="mlm-deposit-form" onSubmit={onSubmit}>
            <div className="mlm-deposit-field">
              <label>
                Mode of Payment<span className="req">*</span>
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                required
              >
                <option value="">Select Deposit Mode</option>
                {modes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="mlm-deposit-field">
              <label>
                Enter Buy Amount<span className="req">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount in ₹"
                required
              />
            </div>

            <div className="mlm-deposit-field">
              <label>
                Enter Transaction Number<span className="req">*</span>
              </label>
              <input
                type="text"
                value={transactionNumber}
                onChange={(e) => setTransactionNumber(e.target.value)}
                placeholder="UPI / bank reference number"
                required
              />
            </div>

            <div className="mlm-deposit-field">
              <label>Upload Receipts</label>
              <div className="mlm-file-input">
                <button
                  type="button"
                  className="mlm-file-btn"
                  onClick={() => fileRef.current?.click()}
                >
                  Choose File
                </button>
                <span className="mlm-file-name">{receiptLabel}</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={onFileChange}
                  hidden
                />
              </div>
            </div>

            <button type="submit" className="mlm-deposit-submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send Request'}
            </button>
          </form>

          <p className="mlm-deposit-history-link">
            <Link to="/dashboard/deposit/history">View deposit history</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
