import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiCopy,
  FiUserPlus,
  FiShare2,
  FiDownload,
  FiPhone,
  FiMapPin,
} from 'react-icons/fi'
import { useLiveDashboard } from '../../hooks/useLiveDashboard.js'
import { formatInr, formatInrPlain } from '../../utils/format.js'

function ProgressBar({ percent, color = '#22c55e' }) {
  return (
    <div className="mlm-progress">
      <div className="mlm-progress-fill" style={{ width: `${Math.min(100, percent)}%`, background: color }} />
    </div>
  )
}

function QuarterlyChart({ data }) {
  const max = Math.max(...data, 1)
  const labels = ['Q1', 'Q2', 'Q3', 'Q4']
  return (
    <div className="mlm-bar-chart">
      {data.map((v, i) => (
        <div key={labels[i]} className="mlm-bar-col">
          <div
            className="mlm-bar"
            style={{ height: `${(v / max) * 100}%` }}
            title={formatInr(v)}
          />
          <small>{labels[i]}</small>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ total, pending, cross }) {
  const sum = total + pending + cross || 1
  const t = (total / sum) * 100
  const p = (pending / sum) * 100
  const c = 100 - t - p
  const grad = `conic-gradient(#3b82f6 0% ${t}%, #f97316 ${t}% ${t + p}%, #ef4444 ${t + p}% 100%)`
  return (
    <div className="mlm-donut-wrap">
      <div className="mlm-donut" style={{ background: grad }} />
      <ul className="mlm-donut-legend">
        <li><span className="dot blue" /> Total Limit</li>
        <li><span className="dot orange" /> Pending Limit</li>
        <li><span className="dot red" /> Cross Limit</li>
      </ul>
    </div>
  )
}

export default function DashboardHome() {
  const { data: d, loading, error, refresh } = useLiveDashboard()
  const [copyMsg, setCopyMsg] = useState('')

  const copyReferral = async () => {
    if (!d?.referral_link) return
    try {
      await navigator.clipboard.writeText(d.referral_link)
      setCopyMsg('Copied!')
      setTimeout(() => setCopyMsg(''), 2000)
    } catch {
      setCopyMsg('Copy failed')
    }
  }

  if (loading && !d) {
    return <div className="mlm-loading">Loading dashboard…</div>
  }

  if (error && !d) {
    return (
      <div className="mlm-loading">
        <p className="form-message error">{error}</p>
        <button type="button" className="btn btn-primary" onClick={() => refresh()}>
          Retry
        </button>
      </div>
    )
  }

  if (!d) {
    return <div className="mlm-loading">Loading dashboard…</div>
  }

  const limit = d.earning_limits || {}

  return (
    <>
      <div className="mlm-welcome">
        <h1>
          Welcome, {d.full_name} <span className="mlm-member-id">({d.member_id})</span>
        </h1>
        <span className="mlm-rank-badge">{d.rank}</span>
      </div>

      <div className="mlm-summary-row">
        <div className="mlm-summary-pill">
          <span className="pill-icon">₹</span>
          <span>{formatInrPlain(d.package_amount)}</span>
        </div>
        <div className="mlm-summary-pill">
          <FiPhone />
          <span>Contact — {d.phone || '—'}</span>
        </div>
        <div className="mlm-summary-pill">
          <FiMapPin />
          <span>Location — {d.location}</span>
        </div>
      </div>

      <div className="mlm-referral">
        <label>Copy Referral Link</label>
        <div className="mlm-referral-actions">
          <input readOnly value={d.referral_link} />
          <button type="button" onClick={copyReferral} title="Copy">
            <FiCopy />
          </button>
          <button type="button" title="Invite">
            <FiUserPlus />
          </button>
          <button type="button" title="Share">
            <FiShare2 />
          </button>
        </div>
        {copyMsg && <small className="mlm-copy-msg">{copyMsg}</small>}
      </div>

      <div className="mlm-grid">
        <article className="mlm-card mlm-card-green mlm-card-package">
          <div>
            <small>My Package</small>
            <h2>{formatInrPlain(d.package_amount)}</h2>
          </div>
          <span className="mlm-card-deco">📦</span>
        </article>

        <article className="mlm-card mlm-card-dark">
          <div className="mlm-card-head">
            <div>
              <small>Total Earning</small>
              <h2>{formatInr(d.total_earning, 3)}</h2>
            </div>
            <button type="button" className="mlm-dl-btn" aria-label="Download">
              <FiDownload />
            </button>
          </div>
          <QuarterlyChart data={d.quarterly_earnings || [0, 0, 0, 0]} />
        </article>

        <article className="mlm-card mlm-card-gold mlm-card-incomes">
          <h3>Incomes</h3>
          <ul>
            {d.incomes?.map((inc) => (
              <li key={inc.key}>
                <span>{inc.label}</span>
                <strong>{formatInr(inc.value, 2)}</strong>
                <ProgressBar percent={inc.percent} color="#fbbf24" />
              </li>
            ))}
          </ul>
        </article>

        <article className="mlm-card mlm-card-level">
          <small>Levels open</small>
          <h2 className="mlm-big-num">{d.level_open}</h2>
          <p>
            of {d.referral_plan?.tree_levels || 24} max · 2.5L→5 · 5L→12 · 7.5L→19 · 10L→24
          </p>
          <p>{d.subscribers_count} subscribers</p>
        </article>

        <article className="mlm-card mlm-card-wallet">
          <div>
            <small>Income Wallet</small>
            <h2>{formatInr(d.income_wallet, 2)}</h2>
            <button type="button" className="mlm-btn-sm light">View Statement</button>
          </div>
          <div className="mlm-radial" style={{ '--p': d.income_wallet_progress }}>
            <span>{d.income_wallet_progress}%</span>
          </div>
        </article>

        <article className="mlm-card mlm-card-repurchase">
          <div className="mlm-card-head">
            <div>
              <small>Repurchase Wallet</small>
              <h2>{formatInr(d.repurchase_wallet, 2)}</h2>
            </div>
            <button type="button" className="mlm-dl-btn" aria-label="Download">
              <FiDownload />
            </button>
          </div>
          <div className="mlm-line-chart">
            {[40, 55, 45, 70, 60, 80, 75].map((h, i) => (
              <div key={i} className="mlm-line-bar" style={{ height: `${h}%` }} />
            ))}
          </div>
        </article>

        <article className="mlm-card mlm-card-wallets-side">
          <div className="mlm-wallet-block">
            <small>Topup Wallet</small>
            <h3>{formatInr(d.topup_wallet, 2)}</h3>
            <button type="button" className="mlm-btn-sm light">View Statement</button>
          </div>
        </article>

        <article className="mlm-card mlm-card-limits">
          <h3>Earning Limits</h3>
          <DonutChart
            total={limit.total}
            pending={limit.pending}
            cross={limit.cross}
          />
        </article>

        <article className="mlm-card mlm-card-today">
          <h3>Today&apos;s Incomes</h3>
          <ul>
            {d.today_incomes?.map((t) => (
              <li key={t.label}>
                <span>{t.label}</span>
                <strong>{formatInr(t.value, 4)}</strong>
                <ProgressBar percent={t.percent} color="#14b8a6" />
              </li>
            ))}
          </ul>
        </article>

        <article className="mlm-card mlm-card-business yellow">
          <small>Team Business</small>
          <h2>{formatInrPlain(d.team_business)}</h2>
          <ProgressBar percent={72} color="#eab308" />
        </article>

        <article className="mlm-card mlm-card-business blue">
          <small>Direct Business</small>
          <h2>{formatInrPlain(d.direct_business)}</h2>
          <div className="mlm-line-chart mini">
            {[30, 50, 40, 65, 55].map((h, i) => (
              <div key={i} className="mlm-line-bar" style={{ height: `${h}%` }} />
            ))}
          </div>
        </article>

        <article className="mlm-card mlm-card-business blue">
          <small>Direct Active Users</small>
          <h2>{d.direct_active_users}</h2>
          <div className="mlm-line-chart mini">
            {[20, 35, 45, 50, 48].map((h, i) => (
              <div key={i} className="mlm-line-bar" style={{ height: `${h}%` }} />
            ))}
          </div>
        </article>

        <article className="mlm-card mlm-card-upgrade">
          <span className="upgrade-icon">🏆</span>
          <p>Upgrade your plan and get more Income</p>
          <Link to="/dashboard/rewards" className="mlm-btn-upgrade">
            View Rewards
          </Link>
        </article>
      </div>
    </>
  )
}
