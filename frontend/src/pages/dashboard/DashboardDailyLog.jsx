import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiAlertTriangle, FiCamera, FiCheck, FiDroplet, FiRefreshCw, FiX } from 'react-icons/fi'
import { api } from '../../api.js'
import { useLiveDashboard } from '../../hooks/useLiveDashboard.js'
import { formatInr } from '../../utils/format.js'
import { compressImageFile } from '../../utils/compressImage.js'
import '../../styles/farmer.css'

export default function DashboardDailyLog() {
  const { data: dash, refresh: refreshDash } = useLiveDashboard()
  const [payload, setPayload] = useState(null)
  const [watered, setWatered] = useState(true)
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [payloadLoading, setPayloadLoading] = useState(true)
  const [status, setStatus] = useState(null)

  const today = payload?.today
  const history = payload?.history || []
  const compliance = payload?.compliance || dash?.daily_log
  const logDate = payload?.log_date || compliance?.log_date || new Date().toISOString().slice(0, 10)

  const load = useCallback(() => {
    setPayloadLoading(true)
    return api.getDailyLog()
      .then(setPayload)
      .catch(() => {})
      .finally(() => setPayloadLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

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
      setStatus({ type: 'error', text: 'Please add a photo of your crop or field.' })
      return
    }
    setLoading(true)
    setStatus(null)
    try {
      const fd = new FormData()
      fd.append('watered', watered ? 'true' : 'false')
      fd.append('note', note)
      if (photo) fd.append('photo', photo)
      await api.submitDailyLog(fd)
      setStatus({ type: 'success', text: 'Daily log saved. Your interest is protected for today.' })
      clearPhoto()
      await load()
      await refreshDash()
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const requiresPhoto = compliance?.requires_photo
  const submitted = compliance?.submitted_today
  const penaltyToday = compliance?.penalty_today || 0
  const penaltyTotal = compliance?.penalty_total || 0

  if (payloadLoading && !payload) {
    return <div className="mlm-loading">Loading daily log…</div>
  }

  return (
    <>
      <h2 className="mlm-page-title">
        <FiDroplet style={{ verticalAlign: 'middle' }} /> Daily crop log
      </h2>

      {requiresPhoto && !submitted && (
        <div className="mlm-alert mlm-alert-warn">
          <FiAlertTriangle />
          <div>
            <strong>Upload today&apos;s photo before midnight UTC</strong>
            <p>
              Missing upload cuts today&apos;s investment interest (
              {formatInr(penaltyToday || dash?.investment?.daily_net || 0, 2)} at risk).
            </p>
          </div>
        </div>
      )}

      {requiresPhoto && submitted && (
        <div className="mlm-alert mlm-alert-ok">
          <FiCheck />
          <span>Today&apos;s photo submitted — interest protected for {logDate}.</span>
        </div>
      )}

      <div className="mlm-grid" style={{ marginBottom: 20 }}>
        <article className="mlm-card">
          <small>Interest cut today (if missed)</small>
          <h2>{formatInr(penaltyToday, 2)}</h2>
        </article>
        <article className="mlm-card">
          <small>Total interest lost (no photo)</small>
          <h2>{formatInr(penaltyTotal, 2)}</h2>
        </article>
        <article className="mlm-card">
          <small>Missed days</small>
          <h2>{compliance?.missed_days_total || 0}</h2>
        </article>
      </div>

      <div className="farmer-grid" style={{ marginTop: 0 }}>
        <section className="farmer-card farmer-card-main">
          <div className="farmer-card-head">
            <h2>Today&apos;s log · {logDate}</h2>
            <button type="button" className="btn btn-sm btn-outline" onClick={() => load()}>
              <FiRefreshCw /> Refresh
            </button>
          </div>

          {today ? (
            <p className="farmer-today-status">Submitted — you can update watering or replace the photo.</p>
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
                <input type="radio" name="watered" checked={watered} onChange={() => setWatered(true)} />
                <FiCheck /> Yes, watered
              </label>
              <label className={`farmer-radio ${!watered ? 'active' : ''}`}>
                <input type="radio" name="watered" checked={!watered} onChange={() => setWatered(false)} />
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
                <FiCamera /> Field photo (required daily)
              </label>
              {today?.image_data_url && !preview && (
                <div className="farmer-preview-wrap">
                  <img src={today.image_data_url} alt="Today upload" className="farmer-preview" />
                  <span className="farmer-preview-tag">Current upload</span>
                </div>
              )}
              {preview && (
                <div className="farmer-preview-wrap">
                  <img src={preview} alt="Preview" className="farmer-preview" />
                  <button type="button" className="farmer-clear-photo" onClick={clearPhoto}>
                    Remove new photo
                  </button>
                </div>
              )}
              <input type="file" accept="image/*" capture="environment" onChange={onPhoto} />
              <small>Compressed before upload. Photos kept ~14 days, then metadata only.</small>
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
                        <span>{row.image_size_kb} KB</span>
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

          {(payload?.penalties?.length > 0 || compliance?.recent_penalties?.length > 0) && (
            <>
              <h3 style={{ marginTop: 20 }}>Interest cuts (missed photos)</h3>
              <ul className="farmer-history">
                {(payload?.penalties || compliance?.recent_penalties || []).map((p) => (
                  <li key={p.id || p.log_date}>
                    <div>
                      <strong>{p.log_date}</strong>
                      <span className="tag tag-warn">-{formatInr(p.net, 2)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <p className="mlm-hint">
        Upload one photo each day while your investment is active. If you skip a day, that day&apos;s
        investment interest is not credited. See{' '}
        <Link to="/dashboard/incomes">Incomes</Link> for details.
      </p>
    </>
  )
}
