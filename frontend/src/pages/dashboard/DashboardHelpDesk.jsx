import { useEffect, useState } from 'react'
import { api } from '../../api.js'

export default function DashboardHelpDesk() {
  const [tickets, setTickets] = useState([])
  const [faqs, setFaqs] = useState([])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = () =>
    api.getHelpDesk().then((r) => {
      setTickets(r.tickets || [])
      setFaqs(r.faqs || [])
    })

  useEffect(() => {
    load().catch(() => {})
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      await api.createHelpTicket({ subject, message })
      setStatus({ type: 'success', text: 'Ticket submitted. Support will reply soon.' })
      setSubject('')
      setMessage('')
      load()
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="mlm-page-title">Help Desk</h2>
      {status && <div className={`form-message ${status.type}`}>{status.text}</div>}

      <form className="mlm-profile-form narrow" onSubmit={onSubmit} style={{ marginBottom: 32 }}>
        <div className="mlm-profile-field">
          <label>Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </div>
        <div className="mlm-profile-field">
          <label>Message</label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Sending…' : 'Submit ticket'}
        </button>
      </form>

      <h3 className="mlm-section-label">Your tickets</h3>
      {tickets.length === 0 ? (
        <p className="mlm-hint">No support tickets yet.</p>
      ) : (
        <div className="mlm-help-tickets">
          {tickets.map((t) => (
            <article key={t.id} className="mlm-card" style={{ marginBottom: 12 }}>
              <div className="mlm-help-ticket-head">
                <strong>#{t.id} — {t.subject}</strong>
                <span className={`mlm-status ${t.status === 'answered' ? 'achieved' : 'pending'}`}>
                  {t.status}
                </span>
              </div>
              <p>{t.message}</p>
              {t.admin_reply && (
                <div className="mlm-help-reply">
                  <small>Support reply</small>
                  <p>{t.admin_reply}</p>
                </div>
              )}
              <small className="mlm-hint">{t.created_at?.slice(0, 16).replace('T', ' ')}</small>
            </article>
          ))}
        </div>
      )}

      {faqs.length > 0 && (
        <>
          <h3 className="mlm-section-label" style={{ marginTop: 28 }}>FAQs</h3>
          <div className="mlm-faq-list">
            {faqs.map((f) => (
              <details key={f.id} className="mlm-faq-item">
                <summary>{f.question}</summary>
                <p>{f.answer}</p>
              </details>
            ))}
          </div>
        </>
      )}
    </>
  )
}
