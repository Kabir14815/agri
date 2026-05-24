import { useEffect, useState } from 'react'
import { adminApi } from '../../api.js'

export default function HelpDeskPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)
  const [filter, setFilter] = useState('open')
  const [replyText, setReplyText] = useState({})

  const load = () => {
    setLoading(true)
    adminApi
      .helpDesk()
      .then(setItems)
      .catch((e) => setStatus({ type: 'error', text: e.message }))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const sendReply = async (id) => {
    const text = replyText[id]?.trim()
    if (!text) return
    try {
      await adminApi.replyHelpTicket(id, { admin_reply: text, status: 'answered' })
      setStatus({ type: 'success', text: `Replied to ticket #${id}` })
      setReplyText((r) => ({ ...r, [id]: '' }))
      load()
    } catch (e) {
      setStatus({ type: 'error', text: e.message })
    }
  }

  const filtered =
    filter === 'all' ? items : items.filter((t) => t.status === filter)

  const counts = {
    all: items.length,
    open: items.filter((t) => t.status === 'open').length,
    answered: items.filter((t) => t.status === 'answered').length,
    closed: items.filter((t) => t.status === 'closed').length,
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Help desk</h1>
          <p>Member support tickets from the dashboard.</p>
        </div>
      </div>

      {status && <div className={`form-message ${status.type}`}>{status.text}</div>}

      <div className="admin-filter-tabs">
        {['open', 'answered', 'closed', 'all'].map((f) => (
          <button
            key={f}
            type="button"
            className={`admin-filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="tab-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading tickets…</p>
      ) : filtered.length === 0 ? (
        <section className="admin-panel admin-empty-state">
          <h3>No tickets</h3>
        </section>
      ) : (
        <div className="admin-help-list">
          {filtered.map((t) => (
            <article key={t.id} className="admin-panel" style={{ marginBottom: 16 }}>
              <div className="admin-panel-head">
                <div>
                  <h3>
                    #{t.id} — {t.subject}
                  </h3>
                  <small>
                    {t.user_name} ({t.user_email}) · {t.created_at?.slice(0, 16)}
                  </small>
                </div>
                <span className={`role-pill sm status-${t.status}`}>{t.status}</span>
              </div>
              <p style={{ margin: '12px 0' }}>{t.message}</p>
              {t.admin_reply && (
                <div className="admin-help-reply-box">
                  <strong>Your reply</strong>
                  <p>{t.admin_reply}</p>
                </div>
              )}
              {t.status === 'open' && (
                <div className="admin-reply-form">
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Type reply…"
                    value={replyText[t.id] || ''}
                    onChange={(e) =>
                      setReplyText((r) => ({ ...r, [t.id]: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => sendReply(t.id)}
                  >
                    Send reply
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  )
}
