import { useEffect, useState } from 'react'
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi'
import { adminApi } from '../api.js'
import { useAdminDialog } from './AdminDialog.jsx'

function emptyFromFields(fields) {
  const obj = {}
  fields.forEach((f) => {
    obj[f.name] = f.default ?? (f.type === 'number' ? 0 : '')
  })
  return obj
}

export default function ResourceManager({
  resource,
  title,
  description,
  fields,
  columns,
  imageField,
}) {
  const dialog = useAdminDialog()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null = closed, {} = creating, {...} = editing existing
  const [form, setForm] = useState({})
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = () => {
    setLoading(true)
    adminApi
      .list(resource)
      .then(setItems)
      .catch((e) => setStatus({ type: 'error', text: e.message }))
      .finally(() => setLoading(false))
  }
  useEffect(load, [resource])

  const openCreate = () => {
    setForm(emptyFromFields(fields))
    setEditing({})
  }

  const openEdit = (item) => {
    setForm({ ...item })
    setEditing(item)
  }

  const close = () => {
    setEditing(null)
    setForm({})
  }

  const onChange = (e) => {
    const { name, value, type } = e.target
    setForm({ ...form, [name]: type === 'number' ? Number(value) : value })
  }

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    setStatus(null)
    try {
      const payload = { ...form }
      fields.forEach((f) => {
        if (f.type === 'number') payload[f.name] = Number(payload[f.name] || 0)
      })
      if (editing && editing.id) {
        await adminApi.update(resource, editing.id, payload)
        setStatus({ type: 'success', text: 'Saved successfully.' })
      } else {
        await adminApi.create(resource, payload)
        setStatus({ type: 'success', text: 'Created successfully.' })
      }
      close()
      load()
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const remove = async (item) => {
    const label = item[columns[0].key] || item.id
    const ok = await dialog.confirm({
      title: 'Delete item?',
      message: `Remove "${label}" permanently?`,
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await adminApi.remove(resource, item.id)
      setStatus({ type: 'success', text: 'Deleted.' })
      load()
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    }
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> Add new
        </button>
      </div>

      {status && (
        <div className={`form-message ${status.type}`}>{status.text}</div>
      )}

      <section className="admin-panel">
        {loading ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p style={{ color: 'var(--color-muted)' }}>No items yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  {imageField && <th style={{ width: 80 }}>Image</th>}
                  {columns.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                  <th style={{ width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    {imageField && (
                      <td>
                        {it[imageField] && (
                          <img
                            src={it[imageField]}
                            alt=""
                            className="admin-thumb"
                          />
                        )}
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c.key} className={c.truncate ? 'truncate' : ''}>
                        {c.render ? c.render(it[c.key], it) : it[c.key]}
                      </td>
                    ))}
                    <td>
                      <button
                        className="icon-btn"
                        title="Edit"
                        onClick={() => openEdit(it)}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className="icon-btn danger"
                        title="Delete"
                        onClick={() => remove(it)}
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

      {editing !== null && (
        <div className="admin-modal-backdrop" onClick={close}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h3>{editing.id ? `Edit ${title.replace(/s$/, '')}` : `Add new ${title.replace(/s$/, '')}`}</h3>
              <button className="icon-btn" onClick={close}><FiX /></button>
            </div>
            <form onSubmit={save}>
              <div className="admin-modal-body">
                {fields.map((f) => (
                  <div className="form-group" key={f.name}>
                    <label>{f.label}{f.required && ' *'}</label>
                    {f.type === 'textarea' ? (
                      <textarea
                        className="form-control"
                        name={f.name}
                        value={form[f.name] ?? ''}
                        onChange={onChange}
                        required={f.required}
                      />
                    ) : (
                      <input
                        className="form-control"
                        type={f.type || 'text'}
                        name={f.name}
                        value={form[f.name] ?? ''}
                        onChange={onChange}
                        required={f.required}
                        step={f.type === 'number' ? 'any' : undefined}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="admin-modal-foot">
                <button type="button" className="btn btn-outline" onClick={close}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : editing.id ? 'Save changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
