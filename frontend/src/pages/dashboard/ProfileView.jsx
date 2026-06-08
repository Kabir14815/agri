import { useEffect, useState } from 'react'
import { api } from '../../api.js'

function Field({ label, value }) {
  return (
    <div className="mlm-profile-field">
      <label>{label}</label>
      <input type="text" readOnly value={value ?? ''} />
    </div>
  )
}

export default function ProfileView() {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)

  const load = () => {
    setError(null)
    api.getProfile().then(setProfile).catch((e) => setError(e.message))
  }

  useEffect(() => { load() }, [])

  if (error) {
    return (
      <div className="mlm-loading">
        <p className="form-message error">{error}</p>
        <button type="button" className="btn btn-primary" onClick={load}>Retry</button>
      </div>
    )
  }

  if (!profile) return <div className="mlm-loading">Loading profile…</div>

  return (
    <>
      <h2 className="mlm-page-title">Profile</h2>
      <div className="mlm-profile-form">
        <Field label="Name" value={profile.full_name} />
        <Field label="Email" value={profile.email} />
        <Field label="Mobile Number" value={profile.phone} />
        <Field label="State" value={profile.state} />
        <Field label="Country" value={profile.country} />
        <Field label="GST No." value={profile.gst_no} />
        <Field label="Nominee Name." value={profile.nominee_name} />
        <Field label="Nominee Relation." value={profile.nominee_relation} />
        <Field label="City" value={profile.city} />
        <Field label="Address" value={profile.address} />
        <Field label="Pincode" value={profile.pincode} />
        <Field label="Member ID" value={profile.member_id} />
      </div>
    </>
  )
}
