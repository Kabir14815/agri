import { useEffect, useRef, useState } from 'react'
import { FiCheckCircle, FiClock, FiUpload, FiX, FiAlertCircle } from 'react-icons/fi'
import { api } from '../../api.js'
import { useUserAuth } from '../../user/UserAuth.jsx'

const PAN_STATUS = {
  not_uploaded: { label: 'Not yet submitted', icon: FiAlertCircle, color: '#6b7280' },
  pending: { label: 'Under review', icon: FiClock, color: '#f59e0b' },
  verified: { label: 'Verified', icon: FiCheckCircle, color: '#22c55e' },
}

export default function ProfileBank() {
  const { reloadUser } = useUserAuth()
  const fileRef = useRef(null)

  const [form, setForm] = useState(null)
  const [pan, setPan] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const [panNumber, setPanNumber] = useState('')
  const [panFile, setPanFile] = useState(null)
  const [panPreview, setPanPreview] = useState(null)

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  const loadProfile = () => {
    setLoadError(null)
    api.getProfile()
      .then((p) => {
        setForm({
          account_holder: p.bank?.account_holder || p.full_name || '',
          bank_name: p.bank?.bank_name || '',
          account_number: p.bank?.account_number || '',
          ifsc: p.bank?.ifsc || '',
        })
        const pc = p.pan_card || {}
        setPan(pc)
        setPanNumber(pc.pan_number || '')
      })
      .catch((e) => setLoadError(e.message))
  }

  useEffect(() => { loadProfile() }, [])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onPanFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) {
      setStatus({ type: 'error', text: 'PAN image too large. Max size is 5MB.' })
      return
    }
    setPanFile(f)
    setPanPreview(URL.createObjectURL(f))
    setStatus(null)
  }

  const clearPanFile = () => {
    if (panPreview) URL.revokeObjectURL(panPreview)
    setPanFile(null)
    setPanPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    const panNum = panNumber.trim().toUpperCase()

    // Validate PAN if entered
    if (panNum && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNum)) {
      setStatus({ type: 'error', text: 'Invalid PAN format. Expected: ABCDE1234F' })
      setLoading(false)
      return
    }

    try {
      // 1. Save bank details
      await api.updateBank(form)

      // 2. Save PAN if number provided
      if (panNum) {
        const fd = new FormData()
        fd.append('pan_number', panNum)
        if (panFile) fd.append('image', panFile)
        const res = await api.uploadPan(fd)
        const updatedPan = res.profile?.pan_card || { pan_number: panNum, status: 'pending', has_image: !!panFile }
        setPan(updatedPan)
        clearPanFile()
      }

      await reloadUser()
      setStatus({ type: 'success', text: panNum ? 'Bank details and PAN card saved successfully.' : 'Bank details saved.' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (loadError) {
    return (
      <div className="mlm-loading">
        <p className="form-message error">{loadError}</p>
        <button type="button" className="btn btn-primary" onClick={loadProfile}>Retry</button>
      </div>
    )
  }
  if (!form || !pan) return <div className="mlm-loading">Loading…</div>

  const panMeta = PAN_STATUS[pan.status] || PAN_STATUS.not_uploaded
  const PanIcon = panMeta.icon
  const isVerified = pan.status === 'verified'

  return (
    <>
      <h2 className="mlm-page-title">Bank &amp; KYC Details</h2>
      {status && <div className={`form-message ${status.type}`}>{status.text}</div>}

      <form onSubmit={onSubmit}>
        {/* ── Bank Details ─────────────────────── */}
        <h3 className="bank-section-heading">Bank Account</h3>
        <div className="mlm-profile-form" style={{ marginBottom: 28 }}>
          {[
            ['account_holder', 'Account Holder Name'],
            ['bank_name', 'Bank Name'],
            ['account_number', 'Account Number'],
            ['ifsc', 'IFSC Code'],
          ].map(([name, label]) => (
            <div className="mlm-profile-field" key={name}>
              <label>{label} *</label>
              <input name={name} value={form[name]} onChange={onChange} required />
            </div>
          ))}
        </div>

        {/* ── PAN Card ─────────────────────────── */}
        <h3 className="bank-section-heading">
          PAN Card (KYC)
          {pan.status !== 'not_uploaded' && (
            <span className="pan-inline-status" style={{ color: panMeta.color }}>
              <PanIcon size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {panMeta.label}
            </span>
          )}
        </h3>

        {isVerified ? (
          <div className="pan-verified-note">
            <FiCheckCircle size={16} style={{ color: '#22c55e' }} />
            <span>PAN <strong>{pan.pan_number}</strong> has been verified. No action needed.</span>
          </div>
        ) : (
          <div className="pan-bank-section">
            <div className="mlm-profile-form" style={{ marginBottom: 16 }}>
              <div className="mlm-profile-field">
                <label>PAN Number</label>
                <input
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  autoCapitalize="characters"
                  style={{ letterSpacing: '0.08em' }}
                />
                <small style={{ color: '#6b7280', fontSize: 12 }}>
                  10-character PAN (5 letters · 4 digits · 1 letter)
                </small>
              </div>

              <div className="mlm-profile-field">
                <label>PAN Card Image</label>
                <p className="pan-image-hint" style={{ margin: '0 0 8px' }}>
                  Upload a clear photo or scan (JPG / PNG · max 5MB).
                  {pan.has_image && !panFile && (
                    <span style={{ color: '#22c55e' }}> Previous image saved ✓</span>
                  )}
                </p>

                {panPreview ? (
                  <div className="pan-preview-wrap">
                    <img src={panPreview} alt="PAN preview" className="pan-preview-img" />
                    <button type="button" className="pan-preview-clear" onClick={clearPanFile} aria-label="Remove">
                      <FiX />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="pan-upload-btn"
                    onClick={() => fileRef.current?.click()}
                  >
                    <FiUpload size={16} />
                    <span>{pan.has_image ? 'Replace image' : 'Choose image…'}</span>
                  </button>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={onPanFile}
                />
              </div>
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? 'Saving…' : 'Save bank & KYC details'}
        </button>
      </form>
    </>
  )
}
