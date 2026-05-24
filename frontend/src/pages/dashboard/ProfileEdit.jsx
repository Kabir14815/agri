import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { useUserAuth } from '../../user/UserAuth.jsx'

export default function ProfileEdit() {
  const { reloadUser } = useUserAuth()
  const [form, setForm] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.getProfile().then((p) =>
      setForm({
        full_name: p.full_name || '',
        phone: p.phone || '',
        address: p.address || '',
        city: p.city || '',
        state: p.state || '',
        pincode: p.pincode || '',
        country: p.country || 'India',
        gst_no: p.gst_no || '',
        nominee_name: p.nominee_name || '',
        nominee_relation: p.nominee_relation || '',
      }),
    )
  }, [])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      await api.updateProfile(form)
      await reloadUser()
      setStatus({ type: 'success', text: 'Profile updated successfully.' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (!form) return <div className="mlm-loading">Loading…</div>

  return (
    <>
      <h2 className="mlm-page-title">Edit Profile</h2>
      {status && <div className={`form-message ${status.type}`}>{status.text}</div>}
      <form className="mlm-profile-form" onSubmit={onSubmit}>
        {[
          ['full_name', 'Name'],
          ['phone', 'Mobile Number'],
          ['address', 'Address'],
          ['city', 'City'],
          ['state', 'State'],
          ['pincode', 'Pincode'],
          ['country', 'Country'],
          ['gst_no', 'GST No.'],
          ['nominee_name', 'Nominee Name'],
          ['nominee_relation', 'Nominee Relation'],
        ].map(([name, label]) => (
          <div className="mlm-profile-field" key={name}>
            <label>{label}</label>
            <input name={name} value={form[name]} onChange={onChange} />
          </div>
        ))}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </>
  )
}
