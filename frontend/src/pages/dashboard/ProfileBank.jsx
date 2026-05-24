import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { useUserAuth } from '../../user/UserAuth.jsx'

export default function ProfileBank() {
  const { reloadUser } = useUserAuth()
  const [form, setForm] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.getProfile().then((p) =>
      setForm({
        account_holder: p.bank?.account_holder || p.full_name || '',
        bank_name: p.bank?.bank_name || '',
        account_number: p.bank?.account_number || '',
        ifsc: p.bank?.ifsc || '',
      }),
    )
  }, [])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      await api.updateBank(form)
      await reloadUser()
      setStatus({ type: 'success', text: 'Bank details saved.' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (!form) return <div className="mlm-loading">Loading…</div>

  return (
    <>
      <h2 className="mlm-page-title">Bank Detail</h2>
      {status && <div className={`form-message ${status.type}`}>{status.text}</div>}
      <form className="mlm-profile-form" onSubmit={onSubmit}>
        {[
          ['account_holder', 'Account Holder Name'],
          ['bank_name', 'Bank Name'],
          ['account_number', 'Account Number'],
          ['ifsc', 'IFSC Code'],
        ].map(([name, label]) => (
          <div className="mlm-profile-field" key={name}>
            <label>{label}</label>
            <input name={name} value={form[name]} onChange={onChange} required />
          </div>
        ))}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : 'Save bank details'}
        </button>
      </form>
    </>
  )
}
