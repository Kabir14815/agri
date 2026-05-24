import { useEffect, useState } from 'react'
import { FiTrash2 } from 'react-icons/fi'
import { adminApi } from '../../api.js'
import { useAdminDialog } from '../AdminDialog.jsx'

export default function ContactsPage() {
  const dialog = useAdminDialog()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)

  const load = () => {
    setLoading(true)
    adminApi
      .contacts()
      .then(setItems)
      .catch((e) => setStatus({ type: 'error', text: e.message }))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const remove = async (id) => {
    const ok = await dialog.confirm({
      title: 'Delete message?',
      message: 'This contact message will be removed permanently.',
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await adminApi.deleteContact(id)
      load()
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    }
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Contact Inbox</h1>
          <p>Messages submitted through the public contact form.</p>
        </div>
      </div>
      {status && (
        <div className={`form-message ${status.type}`}>{status.text}</div>
      )}
      <section className="admin-panel">
        {loading ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p style={{ color: 'var(--color-muted)' }}>No messages yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th style={{ width: 70 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <small style={{ color: 'var(--color-muted)' }}>
                        {(m.submitted_at || '').slice(0, 16).replace('T', ' ')}
                      </small>
                    </td>
                    <td>{m.name}</td>
                    <td>{m.email}</td>
                    <td>{m.phone || '—'}</td>
                    <td>{m.subject || '—'}</td>
                    <td style={{ maxWidth: 340 }}>{m.message}</td>
                    <td>
                      <button
                        className="icon-btn danger"
                        onClick={() => remove(m.id)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
