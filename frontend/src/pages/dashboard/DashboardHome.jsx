import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiCopy,
  FiUserPlus,
  FiShare2,
  FiBarChart2,
  FiPhone,
  FiMapPin,
  FiCamera,
  FiAlertTriangle,
  FiRefreshCw,
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
  const hasData = data.some((v) => v > 0)
  return (
    <div className="mlm-bar-chart">
      {data.map((v, i) => (
        <div key={labels[i]} className="mlm-bar-col">
          <div
            className="mlm-bar"
            style={{ height: hasData ? `${Math.max(4, (v / max) * 100)}%` : '4%' }}
            title={formatInr(v)}
          />
          <small style={{ fontSize: 9 }}>{labels[i]}</small>
          {v > 0 && (
            <small style={{ fontSize: 8, opacity: 0.7 }}>
              {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)}
            </small>
          )}
        </div>
      ))}
    </div>
  )
}

function DonutChart({ total, pending, cross }) {
  const used = Math.max(0, total - pending - cross)
  const sum = total || 1
  const usedPct = Math.min(100, (used / sum) * 100)
  const pendingPct = Math.min(100 - usedPct, (pending / sum) * 100)
  const crossPct = Math.min(100 - usedPct - pendingPct, (cross / sum) * 100)
  const grad = `conic-gradient(#3b82f6 0% ${usedPct}%, #f97316 ${usedPct}% ${usedPct + pendingPct}%, #ef4444 ${usedPct + pendingPct}% ${usedPct + pendingPct + crossPct}%, #e5e7eb ${usedPct + pendingPct + crossPct}% 100%)`
  return (
    <div className="mlm-donut-wrap">
      <div className="mlm-donut" style={{ background: grad }} />
      <ul className="mlm-donut-legend">
        <li><span className="dot blue" /> Used {formatInr(used, 0)}</li>
        <li><span className="dot orange" /> Pending {formatInr(pending, 0)}</li>
        <li><span className="dot red" /> Capped {formatInr(cross, 0)}</li>
        <li style={{ opacity: 0.6 }}><span className="dot" style={{ background: '#e5e7eb' }} /> Available {formatInr(Math.max(0, total - used - pending - cross), 0)}</li>
      </ul>
    </div>
  )
}

export default function DashboardHome() {
  const { data: d, loading, error, refresh } = useLiveDashboard()
  const navigate = useNavigate()
  const [copyMsg, setCopyMsg] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    refresh().finally(() => setRefreshing(false))
  }

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

  const shareReferral = async () => {
    if (!d?.referral_link) return
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join KGF Group', url: d.referral_link })
      } catch {
        // user cancelled or share unsupported — silently ignore
      }
    } else {
      await copyReferral()
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
  const dailyLog = d.daily_log || {}

  return (
    <>
      <div className="mlm-welcome" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1>
            Welcome, {d.full_name} <span className="mlm-member-id">({d.member_id})</span>
          </h1>
          <span className="mlm-rank-badge">{d.rank}</span>
        </div>
        <button
          type="button"
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '6px 14px' }}
          onClick={handleRefresh}
          disabled={refreshing || loading}
          title="Refresh dashboard data"
        >
          <FiRefreshCw style={{ animation: (refreshing || loading) ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
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
          <button type="button" onClick={copyReferral} title="Copy link">
            <FiCopy />
          </button>
          <button type="button" title="Invite a member" onClick={() => navigate('/dashboard/register-member')}>
            <FiUserPlus />
          </button>
          <button type="button" title="Share referral link" onClick={shareReferral}>
            <FiShare2 />
          </button>
        </div>
        {copyMsg && <small className="mlm-copy-msg">{copyMsg}</small>}
      </div>

      {dailyLog.requires_photo && (
        <div
          className={`mlm-alert ${dailyLog.submitted_today ? 'mlm-alert-ok' : 'mlm-alert-warn'}`}
          style={{ marginBottom: 20 }}
        >
          {dailyLog.submitted_today ? (
            <>
              <FiCamera />
              <span>
                Today&apos;s crop photo submitted · interest protected for {dailyLog.log_date}.
              </span>
            </>
          ) : (
            <>
              <FiAlertTriangle />
              <div>
                <strong>Daily crop photo required</strong>
                <p>
                  Upload before midnight UTC or lose today&apos;s interest (
                  {formatInr(dailyLog.penalty_today || d.investment?.daily_net || 0, 2)}).
                  {dailyLog.penalty_total > 0 &&
                    ` Total lost so far: ${formatInr(dailyLog.penalty_total, 2)}.`}
                </p>
                <Link to="/dashboard/daily-log" className="mlm-alert-link">
                  Upload now →
                </Link>
              </div>
            </>
          )}
        </div>
      )}

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
            <button
              type="button"
              className="mlm-dl-btn"
              aria-label="View statement"
              title="View wallet statement"
              onClick={() => navigate('/dashboard/wallet/statement')}
            >
              <FiBarChart2 />
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
            of {d.referral_plan?.tree_levels || 24} max
            {d.referral_plan?.next_unlock_amount
              ? ` · next unlock at Rs ${(d.referral_plan.next_unlock_amount / 100000).toFixed(1)}L`
              : d.level_open >= 24
                ? ' · all levels unlocked'
                : ''}
          </p>
          <p>{d.subscribers_count} subscribers</p>
        </article>

        <article className="mlm-card mlm-card-wallet">
          <div>
            <small>Income Wallet</small>
            <h2>{formatInr(d.income_wallet, 2)}</h2>
            <Link to="/dashboard/wallet/statement?wallet=income" className="mlm-btn-sm light" style={{ display: 'inline-block', marginTop: 8 }}>
              View Statement
            </Link>
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
            <Link to="/dashboard/wallet/repurchase" className="mlm-dl-btn" aria-label="View repurchase wallet" title="View repurchase wallet">
              <FiBarChart2 />
            </Link>
          </div>
          <div className="mlm-line-chart">
            {(d.quarterly_earnings || [0, 0, 0, 0]).map((v, i) => {
              const max = Math.max(...(d.quarterly_earnings || [1]), 1)
              return <div key={i} className="mlm-line-bar" style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
            })}
          </div>
        </article>

        <article className="mlm-card mlm-card-wallets-side">
          <div className="mlm-wallet-block">
            <small>Topup Wallet</small>
            <h3>{formatInr(d.topup_wallet, 2)}</h3>
            <Link to="/dashboard/wallet/topup" className="mlm-btn-sm light" style={{ display: 'inline-block', marginTop: 8 }}>
              View Statement
            </Link>
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
          <ProgressBar
            percent={Math.min(100, d.earning_limits?.total > 0 ? Math.round((d.team_business / d.earning_limits.total) * 100) : 0)}
            color="#eab308"
          />
          <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>vs earning limit</small>
        </article>

        <article className="mlm-card mlm-card-business blue">
          <small>Direct Business</small>
          <h2>{formatInrPlain(d.direct_business)}</h2>
          <div className="mlm-line-chart mini">
            {(d.quarterly_earnings || [0, 0, 0, 0]).map((v, i) => {
              const max = Math.max(...(d.quarterly_earnings || [1]), 1)
              return <div key={i} className="mlm-line-bar" style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
            })}
          </div>
          <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Q1–Q4 earnings</small>
        </article>

        <article className="mlm-card mlm-card-business blue">
          <small>Direct Active Users</small>
          <h2>{d.direct_active_users}</h2>
          <ProgressBar
            percent={d.subscribers_count > 0 ? Math.round((d.direct_active_users / d.subscribers_count) * 100) : 0}
            color="#3b82f6"
          />
          <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{d.subscribers_count} total subscribers</small>
        </article>

        <article className="mlm-card mlm-card-upgrade">
          <span className="upgrade-icon">🏆</span>
          <p>Upgrade your plan and get more Income</p>
          <Link to="/dashboard/rewards" className="mlm-btn-upgrade">
            View Rewards
          </Link>
        </article>
      </div>
      {d.computed_at && (
        <p className="mlm-hint" style={{ marginTop: 24 }}>
          Data last computed: {new Date(d.computed_at).toLocaleTimeString()} — refreshes on each
          page visit and every 5 minutes. Investment interest accrues daily when you open the
          dashboard.
        </p>
      )}
    </>
  )
}
