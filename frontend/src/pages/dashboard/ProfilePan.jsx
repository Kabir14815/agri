import { useEffect, useRef, useState } from 'react'
import { FiCheckCircle, FiClock, FiUpload, FiX, FiAlertCircle } from 'react-icons/fi'
import { api } from '../../api.js'
import { useUserAuth } from '../../user/UserAuth.jsx'

const STATUS_META = {
  not_uploaded: { label: 'Not uploaded', icon: FiAlertCircle, color: '#6b7280' },
  pending: { label: 'Under review', icon: FiClock, color: '#f59e0b' },
  verified: { label: 'Verified', icon: FiCheckCircle, color: '#22c55e' },
}

export default function ProfilePan() {
  const { reloadUser } = useUserAuth()
  const fileRef = useRef(null)

  const [pan, setPan] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const [panNumber, setPanNumber] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState(null)

  const load = () => {
    setLoadError(null)
    api.getProfile()
      .then((p) => {
        const pc = p.pan_card || {}
        setPan(pc)
        setPanNumber(pc.pan_number || '')
      })
      .catch((e) => setLoadError(e.message))
  }

  useEffect(() => { load() }, [])

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) {
      setStatus({ type: 'error', text: 'File too large. Max size is 5MB.' })
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStatus(null)
  }

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const num = panNumber.trim().toUpperCase()
    if (!num) {
      setStatus({ type: 'error', text: 'Please enter your PAN number.' })
      return
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(num)) {
      setStatus({ type: 'error', text: 'Invalid PAN format. Expected: ABCDE1234F' })
      return
    }

    setSubmitting(true)
    setStatus(null)
    try {
      const fd = new FormData()
      fd.append('pan_number', num)
      if (file) fd.append('image', file)
      const res = await api.uploadPan(fd)
      setPan(res.profile?.pan_card || { pan_number: num, status: 'pending', has_image: !!file })
      clearFile()
      await reloadUser()
      setStatus({ type: 'success', text: 'PAN details submitted for verification.' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (loadError) {
    return (
      <div className="mlm-loading">
        <p className="form-message error">{loadError}</p>
        <button type="button" className="btn btn-primary" onClick={load}>Retry</button>
      </div>
    )
  }

  if (!pan) return <div className="mlm-loading">Loading…</div>

  const meta = STATUS_META[pan.status] || STATUS_META.not_uploaded
  const StatusIcon = meta.icon
  const isVerified = pan.status === 'verified'

  return (
    <>
      <h2 className="mlm-page-title">PAN Card</h2>

      {/* Current status badge */}
      <div className="pan-status-card">
        <StatusIcon size={22} style={{ color: meta.color, flexShrink: 0 }} />
        <div>
          <p className="pan-status-label">{meta.label}</p>
          {pan.pan_number && (
            <p className="pan-status-number">{pan.pan_number}</p>
          )}
          {pan.uploaded_at && (
            <p className="pan-status-date">
              Submitted {new Date(pan.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
          {pan.has_image && <p className="pan-status-img-note">Image attached ✓</p>}
        </div>
      </div>

      {isVerified ? (
        <div className="form-message success">
          Your PAN card has been verified. No further action needed.
        </div>
      ) : (
        <>
          <p className="mlm-hint">
            Upload your PAN card to complete KYC. The document is reviewed by our team within 1–2 working days.
          </p>

          {status && <div className={`form-message ${status.type}`}>{status.text}</div>}

          <form className="pan-upload-form" onSubmit={onSubmit}>
            <div className="mlm-profile-field">
              <label>PAN Number *</label>
              <input
                className="pan-number-input"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                maxLength={10}
                autoCapitalize="characters"
                required
              />
              <small style={{ color: '#6b7280', fontSize: 12 }}>
                10-character PAN (5 letters · 4 digits · 1 letter)
              </small>
            </div>

            <div className="pan-image-section">
              <label>PAN Card Image</label>
              <p className="pan-image-hint">
                Upload a clear photo or scan of your PAN card (JPG, PNG or PDF · max 5MB).
                {pan.has_image && !file && (
                  <span style={{ color: '#22c55e' }}> Previous image is saved.</span>
                )}
              </p>

              {preview ? (
                <div className="pan-preview-wrap">
                  <img src={preview} alt="PAN preview" className="pan-preview-img" />
                  <button type="button" className="pan-preview-clear" onClick={clearFile} aria-label="Remove image">
                    <FiX />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="pan-upload-btn"
                  onClick={() => fileRef.current?.click()}
                >
                  <FiUpload size={18} />
                  <span>{pan.has_image ? 'Replace image' : 'Choose image…'}</span>
                </button>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={onFile}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ marginTop: 8 }}
            >
              {submitting ? 'Submitting…' : pan.pan_number ? 'Update PAN details' : 'Submit PAN card'}
            </button>
          </form>
        </>
      )}
    </>
  )
}
