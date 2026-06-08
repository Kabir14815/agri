import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCopy, FiUserPlus, FiExternalLink } from 'react-icons/fi'
import { api } from '../../api.js'

export default function DashboardRegister() {
  const [info, setInfo] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [copyMsg, setCopyMsg] = useState('')

  const load = () => {
    setLoadError(null)
    api.getReferralInfo().then(setInfo).catch((e) => setLoadError(e.message))
  }

  useEffect(() => { load() }, [])

  const copyLink = async () => {
    if (!info?.referral_link) return
    try {
      await navigator.clipboard.writeText(info.referral_link)
      setCopyMsg('Copied!')
      setTimeout(() => setCopyMsg(''), 2000)
    } catch {
      setCopyMsg('Copy failed')
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
  if (!info) return <div className="mlm-loading">Loading…</div>

  return (
    <>
      <h2 className="mlm-page-title">Register</h2>
      <p className="mlm-hint" style={{ marginBottom: 20 }}>
        Share your referral link to register new members under your team.
      </p>

      <div className="mlm-card mlm-card-green" style={{ maxWidth: 480, marginBottom: 20 }}>
        <small>Your member ID</small>
        <h2>{info.member_id}</h2>
        <small>Your name</small>
        <p>{info.full_name}</p>
      </div>

      <div className="mlm-referral">
        <label>Referral registration link</label>
        <div className="mlm-referral-actions">
          <input type="text" readOnly value={info.referral_link} />
          <button type="button" className="btn btn-primary" onClick={copyLink}>
            <FiCopy /> {copyMsg || 'Copy'}
          </button>
        </div>
      </div>

      <div className="mlm-register-actions">
        <Link
          to={`/ref/${encodeURIComponent(info.member_id)}`}
          className="btn btn-primary"
          target="_blank"
          rel="noreferrer"
        >
          <FiUserPlus /> Open referral page
        </Link>
        <a
          href={info.referral_link}
          className="btn btn-outline"
          target="_blank"
          rel="noreferrer"
        >
          <FiExternalLink /> Share link
        </a>
        <p className="mlm-hint" style={{ width: '100%', marginTop: 8 }}>
          Short URL: <strong>/ref/{info.member_id}</strong> — also works: /register?ref=
          {info.member_id}
        </p>
      </div>
    </>
  )
}
