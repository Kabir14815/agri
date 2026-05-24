import { useState } from 'react'
import { api } from '../../api.js'

export default function ProfilePassword() {
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm: '',
  })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    if (form.new_password !== form.confirm) {
      setStatus({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    setLoading(true)
    setStatus(null)
    try {
      const res = await api.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      })
      setStatus({ type: 'success', text: res.message })
      setForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="mlm-page-title">Change Password</h2>
      {status && <div className={`form-message ${status.type}`}>{status.text}</div>}
      <form className="mlm-profile-form narrow" onSubmit={onSubmit}>
        <div className="mlm-profile-field">
          <label>Current Password</label>
          <input
            type="password"
            name="current_password"
            value={form.current_password}
            onChange={onChange}
            required
          />
        </div>
        <div className="mlm-profile-field">
          <label>New Password</label>
          <input
            type="password"
            name="new_password"
            value={form.new_password}
            onChange={onChange}
            required
            minLength={6}
          />
        </div>
        <div className="mlm-profile-field">
          <label>Confirm New Password</label>
          <input
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={onChange}
            required
            minLength={6}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </>
  )
}
