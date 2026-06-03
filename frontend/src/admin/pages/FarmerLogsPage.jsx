import { useEffect, useState } from 'react'
import { FiAlertTriangle, FiDroplet, FiImage, FiTrash2 } from 'react-icons/fi'
import { adminApi } from '../../api.js'
import { useAdminDialog } from '../AdminDialog.jsx'
import { formatInr } from '../../utils/format.js'

export default function FarmerLogsPage() {
  const dialog = useAdminDialog()
  const [logs, setLogs] = useState([])
  const [penalties, setPenalties] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)
  const [filter, setFilter] = useState('all')
  const [tab, setTab] = useState('logs')

  const load = () => {
    setLoading(true)
    Promise.all([adminApi.farmerLogs(), adminApi.interestPenalties()])
      .then(([logRes, penRes]) => {
        setLogs(logRes.logs || [])
        setPenalties(penRes.penalties || [])
      })
      .catch((e) => setStatus({ type: 'error', text: e.message }))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const runPurge = async () => {
    const ok = await dialog.confirm({
      title: 'Purge old photos?',
      message: 'Removes image data older than the retention window.',
      detail: 'Upload records (member, date, watered) stay in the database.',
      confirmLabel: 'Run cleanup',
      variant: 'danger',
    })
    if (!ok) return
    try {
      const res = await adminApi.purgeFarmerImages()
      setStatus({ type: 'success', text: `Purged images from ${res.purged} log(s).` })
      load()
    } catch (e) {
      await dialog.error(e.message)
    }
  }

  const filtered = logs.filter((row) => {
    if (filter === 'watered') return row.watered
    if (filter === 'dry') return !row.watered
    if (filter === 'has_image') return row.has_image
    return true
  })

  const penaltyTotal = penalties.reduce((s, p) => s + (p.net || 0), 0)

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>
            <FiDroplet style={{ verticalAlign: 'middle' }} /> Member daily crop logs
          </h1>
          <p>
            Daily photo uploads from members. Missing photos cut that day&apos;s investment
            interest — {formatInr(penaltyTotal, 2)} total cut recorded.
          </p>
        </div>
        <button type="button" className="btn btn-outline" onClick={runPurge}>
          <FiTrash2 /> Purge old images
        </button>
      </div>

      {status && <div className={`admin-banner ${status.type}`}>{status.text}</div>}

      <div className="admin-tabs">
        <button
          type="button"
          className={tab === 'logs' ? 'active' : ''}
          onClick={() => setTab('logs')}
        >
          Upload logs
        </button>
        <button
          type="button"
          className={tab === 'penalties' ? 'active' : ''}
          onClick={() => setTab('penalties')}
        >
          Interest cuts ({penalties.length})
        </button>
      </div>

      {tab === 'logs' && (
        <>
          <div className="admin-toolbar">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All logs</option>
              <option value="watered">Watered</option>
              <option value="dry">Not watered</option>
              <option value="has_image">Has photo</option>
            </select>
            <button type="button" className="btn btn-sm" onClick={load}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p>Loading…</p>
          ) : filtered.length === 0 ? (
            <p>No daily logs yet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Member</th>
                    <th>Member ID</th>
                    <th>Watered</th>
                    <th>Photo</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id}>
                      <td>{row.log_date}</td>
                      <td>{row.farmer_name}</td>
                      <td>{row.member_id}</td>
                      <td>
                        <span className={row.watered ? 'badge ok' : 'badge warn'}>
                          {row.watered ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td>
                        {row.image_data_url ? (
                          <a
                            href={row.image_data_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-thumb-link"
                          >
                            <img src={row.image_data_url} alt="" className="admin-log-thumb" />
                            <FiImage />
                          </a>
                        ) : row.image_purged ? (
                          <span className="muted">Purged ({row.image_size_kb} KB was stored)</span>
                        ) : row.has_image ? (
                          <span>Stored</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{row.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'penalties' && (
        <>
          {loading ? (
            <p>Loading…</p>
          ) : penalties.length === 0 ? (
            <p>No interest cuts recorded yet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Member</th>
                    <th>Member ID</th>
                    <th>Interest cut (net)</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {penalties.map((row) => (
                    <tr key={row.id}>
                      <td>{row.log_date}</td>
                      <td>{row.full_name}</td>
                      <td>{row.member_id}</td>
                      <td>
                        <span className="badge warn">
                          <FiAlertTriangle style={{ verticalAlign: 'middle' }} />{' '}
                          {formatInr(row.net, 2)}
                        </span>
                      </td>
                      <td>No daily photo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
