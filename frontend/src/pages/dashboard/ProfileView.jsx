import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api.js'

function Field({ label, value }) {
  return (
    <div className="mlm-profile-field">
      <label>{label}</label>
      <input type="text" readOnly value={value ?? ''} />
    </div>
  )
}

const PAN_STATUS = {
  not_uploaded: { label: 'Not uploaded', color: '#6b7280' },
  pending: { label: 'Under review', color: '#f59e0b' },
  verified: { label: 'Verified ✓', color: '#22c55e' },
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

  const pan = profile.pan_card || {}
  const panMeta = PAN_STATUS[pan.status] || PAN_STATUS.not_uploaded

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
        <div className="mlm-profile-field">
          <label>PAN Card</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#0f1114', border: '1px solid #2d323c', borderRadius: 8 }}>
            <span style={{ color: panMeta.color, fontWeight: 500, fontSize: 14 }}>
              {panMeta.label}
            </span>
            {pan.pan_number && (
              <span style={{ color: '#9ca3af', fontSize: 13 }}>{pan.pan_number}</span>
            )}
            {pan.status !== 'verified' && (
              <Link to="/dashboard/profile/pan" style={{ marginLeft: 'auto', fontSize: 13, color: '#3b82f6', textDecoration: 'none' }}>
                {pan.status === 'not_uploaded' ? 'Upload →' : 'Update →'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
