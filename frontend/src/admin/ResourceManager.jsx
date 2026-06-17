import { useRef, useState, useEffect } from 'react'
import { FiEdit2, FiTrash2, FiPlus, FiX, FiUpload, FiLink } from 'react-icons/fi'
import { adminApi } from '../api.js'
import { useAdminDialog } from './AdminDialog.jsx'
import { compressImageToDataUrl } from '../utils/compressImage.js'

function emptyFromFields(fields) {
  const obj = {}
  fields.forEach((f) => {
    obj[f.name] = f.default ?? (f.type === 'number' ? 0 : '')
  })
  return obj
}

/** Image upload + preview field for admin forms. */
function ImageUploadField({ name, label, value, onChange }) {
  const inputRef = useRef(null)
  const [mode, setMode] = useState('upload') // 'upload' | 'url'
  const [compressing, setCompressing] = useState(false)
  const [error, setError] = useState(null)

  const isDataUrl = value && value.startsWith('data:')
  const hasImage = Boolean(value)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setCompressing(true)
    try {
      const dataUrl = await compressImageToDataUrl(file)
      onChange(name, dataUrl)
    } catch (err) {
      setError(err.message)
    } finally {
      setCompressing(false)
      // Reset file input so the same file can be re-selected
      e.target.value = ''
    }
  }

  const handleUrlInput = (e) => {
    onChange(name, e.target.value)
  }

  const clear = () => {
    onChange(name, '')
    setError(null)
  }

  return (
    <div className="admin-image-field">
      {/* Current image preview */}
      {hasImage && (
        <div className="admin-image-preview-wrap">
          <img
            src={value}
            alt="Preview"
            className="admin-image-preview"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <button type="button" className="admin-image-clear" onClick={clear} title="Remove image">
            <FiX />
          </button>
        </div>
      )}

      {/* Mode toggle */}
      <div className="admin-image-mode-tabs">
        <button
          type="button"
          className={`admin-image-mode-tab ${mode === 'upload' ? 'active' : ''}`}
          onClick={() => setMode('upload')}
        >
          <FiUpload size={13} /> Upload file
        </button>
        <button
          type="button"
          className={`admin-image-mode-tab ${mode === 'url' ? 'active' : ''}`}
          onClick={() => setMode('url')}
        >
          <FiLink size={13} /> Paste URL
        </button>
      </div>

      {mode === 'upload' ? (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
          <button
            type="button"
            className="btn btn-outline"
            style={{ width: '100%', justifyContent: 'center', gap: 8 }}
            onClick={() => inputRef.current?.click()}
            disabled={compressing}
          >
            <FiUpload />
            {compressing ? 'Compressing…' : hasImage ? 'Replace image' : 'Choose image…'}
          </button>
          {isDataUrl && (
            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
              Image stored as compressed file (~{Math.round(value.length / 1024)}KB)
            </p>
          )}
        </div>
      ) : (
        <input
          type="url"
          className="form-control"
          placeholder="https://example.com/image.jpg"
          value={isDataUrl ? '' : (value || '')}
          onChange={handleUrlInput}
        />
      )}

      {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

function fieldClass(f) {
  if (f.fullWidth) return 'admin-form-span-2'
  return ''
}

export default function ResourceManager({
  resource,
  title,
  description,
  fields,
  columns,
  imageField,
  modalClass = '',
  formGrid = false,
  computeFields,
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

  const applyComputed = (next) => (computeFields ? { ...next, ...computeFields(next) } : next)

  const openCreate = () => {
    setForm(applyComputed(emptyFromFields(fields)))
    setEditing({})
  }

  const openEdit = (item) => {
    setForm(applyComputed({ ...item }))
    setEditing(item)
  }

  const close = () => {
    setEditing(null)
    setForm({})
  }

  const onChange = (e) => {
    const { name, value, type } = e.target
    setForm((prev) => applyComputed({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }))
  }

  // Called from ImageUploadField
  const onImageChange = (name, value) => {
    setForm((prev) => applyComputed({ ...prev, [name]: value }))
  }

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    setStatus(null)
    try {
      const computed = computeFields ? computeFields(form) : {}
      const payload = { ...form, ...computed }
      delete payload.id
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
                        {it[imageField] ? (
                          <img
                            src={it[imageField]}
                            alt=""
                            className="admin-thumb"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            style={{
                              width: 56, height: 56, borderRadius: 6,
                              background: '#f3f4f6', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, color: '#9ca3af',
                            }}
                          >
                            No img
                          </div>
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
          <div className={`admin-modal ${modalClass}`.trim()} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h3>{editing.id ? `Edit ${title.replace(/s$/, '')}` : `Add new ${title.replace(/s$/, '')}`}</h3>
              <button type="button" className="icon-btn" onClick={close}><FiX /></button>
            </div>
            <form onSubmit={save}>
              <div className={`admin-modal-body${formGrid ? ' admin-form-grid' : ''}`}>
                {fields.map((f) => (
                  <div className={`form-group ${fieldClass(f)}`.trim()} key={f.name}>
                    <label>{f.label}{f.required && ' *'}</label>
                    {f.hint && <p className="field-hint">{f.hint}</p>}
                    {f.type === 'image' ? (
                      <ImageUploadField
                        name={f.name}
                        label={f.label}
                        value={form[f.name] ?? ''}
                        onChange={onImageChange}
                      />
                    ) : f.type === 'textarea' ? (
                      <textarea
                        className="form-control"
                        name={f.name}
                        value={form[f.name] ?? ''}
                        onChange={onChange}
                        required={f.required}
                        rows={f.rows || 4}
                        placeholder={f.placeholder}
                      />
                    ) : f.type === 'select' ? (
                      <select
                        className="form-control"
                        name={f.name}
                        value={form[f.name] ?? ''}
                        onChange={onChange}
                        required={f.required}
                      >
                        {!f.required && <option value="">— Select —</option>}
                        {(f.options || []).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : f.type === 'readonly' ? (
                      <div className="form-control-readonly">
                        {f.render ? f.render(form) : (form[f.name] ?? '—')}
                      </div>
                    ) : (
                      <input
                        className="form-control"
                        type={f.type || 'text'}
                        name={f.name}
                        value={form[f.name] ?? ''}
                        onChange={onChange}
                        required={f.required}
                        step={f.type === 'number' ? 'any' : undefined}
                        min={f.min}
                        placeholder={f.placeholder}
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
