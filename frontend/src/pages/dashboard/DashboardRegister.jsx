import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCopy, FiUserPlus, FiExternalLink } from 'react-icons/fi'
import { api } from '../../api.js'

export default function DashboardRegister() {
  const [info, setInfo] = useState(null)
  const [copyMsg, setCopyMsg] = useState('')

  useEffect(() => {
    api.getReferralInfo().then(setInfo).catch(() => {})
  }, [])

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
        <small>Sponsor name</small>
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
          to={`/register?ref=${encodeURIComponent(info.member_id)}`}
          className="btn btn-primary"
          target="_blank"
          rel="noreferrer"
        >
          <FiUserPlus /> Open registration page
        </Link>
        <a
          href={info.referral_link}
          className="btn btn-outline"
          target="_blank"
          rel="noreferrer"
        >
          <FiExternalLink /> Share link
        </a>
      </div>
    </>
  )
}
