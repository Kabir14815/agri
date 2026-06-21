import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCamera, FiCheck, FiDroplet, FiLogOut, FiRefreshCw, FiX } from 'react-icons/fi'
import { farmerApi } from '../api.js'
import { useFarmerAuth } from '../farmer/FarmerAuth.jsx'
import { compressImageFile } from '../utils/compressImage.js'
import { BRAND } from '../constants/brand.js'
import BrandLogo from '../components/BrandLogo.jsx'

export default function FarmerDashboard() {
  const { profile, dashboard, refresh, logout } = useFarmerAuth()
  const [watered, setWatered] = useState(true)
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  const today = dashboard?.today
  const history = dashboard?.history || []
  const logDate = dashboard?.log_date || new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (today) {
      setWatered(!!today.watered)
      setNote(today.note || '')
    }
  }, [today?.id])

  const onPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus(null)
    try {
      const compressed = await compressImageFile(file)
      setPhoto(compressed)
      setPreview(URL.createObjectURL(compressed))
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    }
  }

  const clearPhoto = () => {
    setPhoto(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!photo && !today?.has_image) {
      setStatus({ type: 'error', text: 'Please add a photo of the field or crop.' })
      return
    }
    setLoading(true)
    setStatus(null)
    try {
      const fd = new FormData()
      fd.append('watered', watered ? 'true' : 'false')
      fd.append('note', note)
      if (photo) fd.append('photo', photo)
      await farmerApi.submitDailyLog(fd)
      setStatus({ type: 'success', text: 'Daily log saved. Thank you!' })
      clearPhoto()
      await refresh()
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const onLogout = () => {
    logout()
    window.location.href = '/farmer-login'
  }

  return (
    <div className="farmer-shell">
      <header className="farmer-header">
        <div className="farmer-header-brand">
          <BrandLogo variant="dashboard" showText={false} asLink={false} />
          <div>
            <p className="farmer-header-kicker">{BRAND.name} · Field report</p>
            <h1>Hello, {profile?.full_name || 'Farmer'}</h1>
            <p className="farmer-header-meta">
              ID {profile?.member_id} · {logDate} (UTC)
            </p>
          </div>
        </div>
        <div className="farmer-header-actions">
          <button type="button" className="btn btn-outline-light" onClick={() => refresh()}>
            <FiRefreshCw /> Refresh
          </button>
          <button type="button" className="btn btn-outline-light" onClick={onLogout}>
            <FiLogOut /> Logout
          </button>
        </div>
      </header>

      <div className="farmer-grid">
        <section className="farmer-card farmer-card-main">
          <h2>
            <FiDroplet /> Today&apos;s log
          </h2>
          {today ? (
            <p className="farmer-today-status">
              Already submitted — you can update watering status or replace the photo.
            </p>
          ) : (
            <p className="farmer-today-status">Not submitted yet for today.</p>
          )}

          {status && (
            <div className={`form-status ${status.type === 'error' ? 'error' : 'success'}`}>
              {status.text}
            </div>
          )}

          <form className="farmer-form" onSubmit={onSubmit}>
            <fieldset className="farmer-water-choice">
              <legend>Did you water the crops today?</legend>
              <label className={`farmer-radio ${watered ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="watered"
                  checked={watered}
                  onChange={() => setWatered(true)}
                />
                <FiCheck /> Yes, watered
              </label>
              <label className={`farmer-radio ${!watered ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="watered"
                  checked={!watered}
                  onChange={() => setWatered(false)}
                />
                <FiX /> No, not watered
              </label>
            </fieldset>

            <div className="form-group">
              <label htmlFor="note">Note (optional)</label>
              <textarea
                id="note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Rain, pest spray, etc."
                maxLength={300}
              />
            </div>

            <div className="form-group">
              <label>
                <FiCamera /> Field photo
              </label>
              {today?.image_data_url && !preview && (
                <div className="farmer-preview-wrap">
                  <img src={today.image_data_url} alt="Today’s upload" className="farmer-preview" />
                  <span className="farmer-preview-tag">Current upload</span>
                </div>
              )}
              {preview && (
                <div className="farmer-preview-wrap">
                  <img src={preview} alt="New preview" className="farmer-preview" />
                  <button type="button" className="farmer-clear-photo" onClick={clearPhoto}>
                    Remove new photo
                  </button>
                </div>
              )}
              <input type="file" accept="image/*" capture="environment" onChange={onPhoto} />
              <small>Photos are compressed before upload. Kept ~14 days, then metadata only.</small>
            </div>

            <button type="submit" className="btn btn-accent btn-block" disabled={loading}>
              {loading ? 'Saving…' : today ? 'Update today’s log' : 'Submit today’s log'}
            </button>
          </form>
        </section>

        <section className="farmer-card">
          <h2>Recent history</h2>
          {history.length === 0 ? (
            <p className="muted">No logs yet.</p>
          ) : (
            <ul className="farmer-history">
              {history.map((row) => (
                <li key={row.id}>
                  <div>
                    <strong>{row.log_date}</strong>
                    <span className={row.watered ? 'tag tag-ok' : 'tag tag-warn'}>
                      {row.watered ? 'Watered' : 'Not watered'}
                    </span>
                  </div>
                  <div className="farmer-history-meta">
                    {row.has_image ? (
                      row.image_purged ? (
                        <span>Photo archived</span>
                      ) : (
                        <span>{row.image_size_kb} KB stored</span>
                      )
                    ) : (
                      <span>No photo</span>
                    )}
                    {row.note ? <span> · {row.note}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="alt-link" style={{ marginTop: 16 }}>
            <Link to="/">Main website</Link>
          </p>
        </section>
      </div>
    </div>
  )
}
