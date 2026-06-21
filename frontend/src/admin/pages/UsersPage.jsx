import { useEffect, useMemo, useState } from 'react'
import {
  FiTrash2,
  FiMail,
  FiPhone,
  FiMapPin,
  FiUser,
  FiCalendar,
  FiX,
  FiDollarSign,
  FiUsers,
  FiGitBranch,
  FiCheck,
  FiTrendingUp,
  FiBarChart2 as FiBarChart,
  FiImage,
  FiAlertTriangle,
} from 'react-icons/fi'
import { adminApi } from '../../api.js'
import { useAdminAuth } from '../AdminAuth.jsx'
import { useAdminDialog, confirmDelete } from '../AdminDialog.jsx'
import AdminReferralTreeModal from '../components/AdminReferralTreeModal.jsx'

const ROLE_COLORS = {
  admin: '#c2410c',
  franchisee: '#7b3eb1',
  customer: '#1f7a3a',
}

function initials(name) {
  return (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatDate(iso) {
  if (!iso) return '—'
  return iso.slice(0, 16).replace('T', ' ')
}

function formatInr(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n ?? 0)
}

function WalletRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--color-border,#e5e7eb)' }}>
      <span style={{ fontSize: 13, color: 'var(--color-muted,#6b7280)' }}>{label}</span>
      <strong style={{ fontSize: 13 }}>{formatInr(value ?? 0)}</strong>
    </div>
  )
}

function ProfileModal({ user, onClose, onDelete, canDelete, onAmountSaved, onViewTree }) {
  const dialog = useAdminDialog()
  const [amount, setAmount] = useState('')
  const [sponsorId, setSponsorId] = useState('')
  const [referrals, setReferrals] = useState(null)
  const [deposits, setDeposits] = useState([])
  const [dashData, setDashData] = useState(null)
  const [saving, setSaving] = useState(false)
  const [depositBusy, setDepositBusy] = useState(null)

  const loadDeposits = (userId) =>
    adminApi
      .deposits()
      .then((rows) => setDeposits((rows || []).filter((d) => d.user_id === userId)))
      .catch(() => setDeposits([]))

  const loadDashData = (userId) =>
    adminApi
      .getUserDashboard(userId)
      .then(setDashData)
      .catch(() => setDashData(null))

  useEffect(() => {
    if (user) {
      setAmount(String(user.amount ?? 0))
      setSponsorId(user.sponsor_member_id || user.mlm?.sponsor_member_id || '')
      setReferrals(null)
      setDeposits([])
      setDashData(null)
      adminApi
        .getUserReferrals(user.id)
        .then((r) => setReferrals(r))
        .catch(() => setReferrals({ direct_count: 0, referrals: [] }))
      loadDeposits(user.id)
      if (user.role !== 'admin') loadDashData(user.id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  if (!user) return null

  const pendingDeposits = deposits.filter((d) => d.status === 'pending')
  const isActive = Number(amount) > 0

  const approveActivate = async () => {
    const value = Number(amount)
    if (!value || value <= 0) {
      await dialog.error('Enter the approved investment amount (₹) first.', 'Amount required')
      return
    }
    if (value < 250000) {
      await dialog.error('Minimum investment package is ₹2,50,000.', 'Amount too low')
      return
    }
    const ok = await dialog.confirm({
      title: 'Approve & activate member?',
      message: `Activate ${user.full_name} with this investment package.`,
      detail: formatInr(value),
      confirmLabel: 'Approve & Activate',
      variant: 'primary',
    })
    if (!ok) return

    setSaving(true)
    try {
      await adminApi.updateUserMlm(user.id, {
        amount: value,
        sponsor_member_id: sponsorId.trim().toUpperCase() || null,
      })
      await adminApi.recordMemberDeposit(user.id, {
        amount: value,
        note: `Admin activation — ${user.member_id || user.id}`,
      })
      // Reload deposits (pending ones are now auto-cancelled by the backend)
      await loadDeposits(user.id)
      await loadDashData(user.id)
      const refreshed = await adminApi.getUserReferrals(user.id)
      setReferrals(refreshed)
      onAmountSaved?.(value)
      await dialog.success(
        'Member approved and activated. Any pending deposit requests from this member have been cancelled. Daily rental income (1% p.m., 2% TDS) will accrue to their income wallet.',
        'Member activated',
      )
    } catch (e) {
      await dialog.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const reviewDeposit = async (depositId, newStatus) => {
    const isApprove = newStatus === 'approved'
    const ok = await dialog.confirm({
      title: isApprove ? 'Approve deposit?' : 'Reject deposit?',
      message: `Deposit #${depositId} for ${user.full_name}`,
      detail: isApprove
        ? 'This credits their package amount and starts investment returns.'
        : 'The member will need to submit a new deposit request.',
      confirmLabel: isApprove ? 'Approve deposit' : 'Reject deposit',
      variant: isApprove ? 'primary' : 'danger',
    })
    if (!ok) return

    setDepositBusy(depositId)
    try {
      const res = await adminApi.updateDeposit(depositId, newStatus)
      await loadDeposits(user.id)
      await loadDashData(user.id)
      if (isApprove && res?.deposit?.amount) {
        setAmount(String(res.deposit.amount))
        onAmountSaved?.(res.deposit.amount)
      }
      await dialog.success(
        `Deposit #${depositId} has been ${newStatus}.`,
        isApprove ? 'Deposit approved' : 'Deposit rejected',
      )
    } catch (e) {
      await dialog.error(e.message)
    } finally {
      setDepositBusy(null)
    }
  }

  const todayLog = dashData?.today_log
  const recentLogs = dashData?.recent_logs || []

  return (
    <div className="admin-modal-backdrop admin-modal-backdrop--profile" onClick={onClose}>
      <div
        className="admin-modal admin-profile-modal admin-profile-modal-v2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-head">
          <h3>Member profile</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>
        <div className="admin-profile-modal-body">
          {user.role !== 'admin' && (
            <div className="admin-activate-box">
              <span className={`admin-activate-status ${isActive ? 'active' : 'inactive'}`}>
                {isActive ? `✓ Active — ${formatInr(Number(amount))} package` : 'Not activated — pending approval'}
              </span>

              {/* Only show pending deposits section if there are actual pending deposits */}
              {pendingDeposits.length > 0 && (
                <>
                  <h4 style={{ marginTop: 10 }}>Pending deposit requests</h4>
                  <p style={{ marginTop: 0, marginBottom: 8, fontSize: 13 }}>
                    Approve or reject the member&apos;s deposit request below.
                  </p>
                  <div className="admin-pending-deposits" style={{ marginTop: 0 }}>
                    {pendingDeposits.map((d) => (
                      <div key={d.id} className="admin-pending-deposit-row">
                        <span>
                          #{d.id} — {formatInr(d.amount)} — {formatDate(d.created_at)}
                          {d.transaction_number && <> — <em>{d.transaction_number}</em></>}
                        </span>
                        <div className="admin-pending-deposit-actions">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={depositBusy === d.id}
                            onClick={() => reviewDeposit(d.id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            disabled={depositBusy === d.id}
                            onClick={() => reviewDeposit(d.id, 'rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Manual activation / amount update — show as collapsible for active members */}
              {(!isActive || pendingDeposits.length > 0) ? (
                <>
                  {!isActive && (
                    <>
                      <h4 style={{ marginTop: pendingDeposits.length > 0 ? 12 : 10 }}>
                        Manual activation
                      </h4>
                      <p>
                        Set the investment amount below and click <strong>Approve &amp; Activate</strong>.
                        Any pending deposit requests will be automatically cancelled.
                      </p>
                    </>
                  )}
                  <div className="admin-amount-edit" style={{ marginTop: !isActive ? 0 : 10 }}>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      step="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Investment amount"
                      style={{ flex: '1 1 140px' }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={saving}
                      onClick={approveActivate}
                    >
                      <FiCheck /> {saving ? 'Saving…' : isActive ? 'Update amount' : 'Approve & Activate'}
                    </button>
                  </div>
                </>
              ) : (
                /* Active + no pending deposits: show compact update row */
                <details style={{ marginTop: 10 }}>
                  <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--color-muted,#6b7280)', userSelect: 'none' }}>
                    Update investment amount…
                  </summary>
                  <div className="admin-amount-edit" style={{ marginTop: 10 }}>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      step="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Investment amount"
                      style={{ flex: '1 1 140px' }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={saving}
                      onClick={approveActivate}
                    >
                      <FiCheck /> {saving ? 'Saving…' : 'Update amount'}
                    </button>
                  </div>
                </details>
              )}
            </div>
          )}

          <div className="admin-profile-hero">
            <div
              className="user-avatar xl"
              style={{ background: ROLE_COLORS[user.role] || '#475569' }}
            >
              {initials(user.full_name)}
            </div>
            <div>
              <h2>{user.full_name}</h2>
              <span
                className="role-pill"
                style={{ background: ROLE_COLORS[user.role] || '#475569' }}
              >
                {user.role}
              </span>
              <p className="user-id">{user.member_id || `KGF${870000 + user.id}`}</p>
            </div>
          </div>

          <div className="admin-profile-details">
            <div className="profile-detail-row">
              <FiMail />
              <div>
                <small>Email</small>
                <a href={`mailto:${user.email}`}>{user.email}</a>
              </div>
            </div>
            <div className="profile-detail-row">
              <FiPhone />
              <div>
                <small>Phone</small>
                <a href={`tel:${user.phone}`}>{user.phone}</a>
              </div>
            </div>
            <div className="profile-detail-row">
              <FiMapPin />
              <div>
                <small>Address</small>
                <p>
                  {[user.address, user.city, user.state, user.pincode]
                    .filter(Boolean)
                    .join(', ') || 'Not provided'}
                </p>
              </div>
            </div>
            <div className="profile-detail-row">
              <FiDollarSign />
              <div>
                <small>Investment / package amount (₹)</small>
                <p>{formatInr(Number(amount) || 0)}</p>
              </div>
            </div>
            {referrals?.sponsor_member_id && (
              <div className="profile-detail-row">
                <FiUser />
                <div>
                  <small>Sponsor</small>
                  <p>
                    {referrals.sponsor_member_id}
                    {referrals.sponsor_name ? ` — ${referrals.sponsor_name}` : ''}
                  </p>
                </div>
              </div>
            )}
            {user.role !== 'admin' && (
              <div className="profile-detail-row">
                <FiUser />
                <div>
                  <small>Sponsor member ID (edit)</small>
                  <input
                    type="text"
                    className="form-control"
                    value={sponsorId}
                    onChange={(e) => setSponsorId(e.target.value.toUpperCase())}
                    placeholder="Member ID"
                  />
                </div>
              </div>
            )}
            {referrals && (
              <div className="profile-detail-row" style={{ gridColumn: '1 / -1' }}>
                <FiUsers />
                <div style={{ flex: 1 }}>
                  <small>Direct referrals ({referrals.direct_count})</small>
                  {referrals.referrals?.length ? (
                    <ul className="admin-referral-list">
                      {referrals.referrals.map((r) => (
                        <li key={r.member_id || r.id}>
                          <strong>{r.full_name}</strong> — {r.member_id} — {formatInr(r.amount)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: '8px 0 0' }}>No direct referrals yet.</p>
                  )}
                </div>
              </div>
            )}
            <div className="profile-detail-row">
              <FiCalendar />
              <div>
                <small>Registered</small>
                <p>{formatDate(user.registered_at)}</p>
              </div>
            </div>
            {/* Bank details */}
            {user.bank?.account_number && (
              <div className="profile-detail-row" style={{ gridColumn: '1 / -1' }}>
                <FiDollarSign />
                <div>
                  <small>Bank account</small>
                  <p>
                    <strong>{user.bank.bank_name || '—'}</strong>
                    {' · '}A/C: {user.bank.account_number}
                    {' · '}IFSC: {user.bank.ifsc || '—'}
                    {user.bank.account_holder ? ` · Holder: ${user.bank.account_holder}` : ''}
                  </p>
                </div>
              </div>
            )}
            {/* Nominee */}
            {user.nominee_name && (
              <div className="profile-detail-row">
                <FiUser />
                <div>
                  <small>Nominee</small>
                  <p>{user.nominee_name}{user.nominee_relation ? ` (${user.nominee_relation})` : ''}</p>
                </div>
              </div>
            )}
            {/* GST */}
            {user.gst_no && (
              <div className="profile-detail-row">
                <FiUser />
                <div>
                  <small>GST No.</small>
                  <p>{user.gst_no}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Financial summary ─────────────────────────────────────── */}
          {dashData && user.role !== 'admin' && (() => {
            const inv = dashData.investment || {}
            const lim = dashData.earning_limits || {}
            const incomes = dashData.incomes || []
            const availableToEarn = Math.max(0, (lim.total || 0) - (lim.pending || 0) - (lim.cross || 0))
            const capPct = lim.total > 0 ? Math.min(100, Math.round(((lim.pending || 0) / lim.total) * 100)) : 0

            return (
              <>
                {/* Wallets */}
                <div className="admin-profile-section">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <FiTrendingUp /> Wallets
                  </h4>
                  <div style={{ display: 'grid', gap: 4 }}>
                    <WalletRow label="Income wallet (balance)" value={dashData.income_wallet} />
                    <WalletRow label="Repurchase wallet" value={dashData.repurchase_wallet} />
                    <WalletRow label="Top-up / Topup wallet" value={dashData.topup_wallet} />
                    <WalletRow label="Total lifetime earnings" value={dashData.total_earning} />
                  </div>
                </div>

                {/* Income breakdown */}
                <div className="admin-profile-section">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <FiDollarSign /> Income breakdown
                  </h4>
                  <div style={{ display: 'grid', gap: 4 }}>
                    {incomes.map((inc) => (
                      <WalletRow key={inc.key} label={inc.label} value={inc.value} />
                    ))}
                  </div>
                </div>

                {/* Investment / interest details */}
                <div className="admin-profile-section">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <FiTrendingUp /> Investment &amp; Interest
                  </h4>
                  <div style={{ display: 'grid', gap: 4 }}>
                    <WalletRow label="Principal invested" value={inv.principal} />
                    <WalletRow label="Monthly gross rate" value={inv.monthly_gross} />
                    <WalletRow label="Monthly TDS (2%)" value={inv.monthly_tds} />
                    <WalletRow label="Monthly net interest" value={inv.monthly_net} />
                    <WalletRow label="Daily net interest" value={inv.daily_net} />
                    <WalletRow label="Total interest earned (net)" value={inv.total_interest_net} />
                    <WalletRow label="Total TDS deducted" value={inv.total_tds} />
                    <WalletRow label="Interest penalty (missed photos)" value={inv.penalty_total} />
                    <WalletRow label="Remaining interest cap" value={inv.interest_remaining_net} />
                  </div>
                  {(dashData.daily_log?.missed_days_total ?? 0) > 0 && (
                    <p style={{ marginTop: 8, fontSize: 12, color: '#b45309', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiAlertTriangle size={13} />
                      {dashData.daily_log.missed_days_total} day(s) of photos missed — interest cut applied
                    </p>
                  )}
                  {inv.interest_cap_reached && (
                    <p style={{ marginTop: 8, fontSize: 12, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiAlertTriangle size={13} />
                      Earning cap reached — no further interest will accrue
                    </p>
                  )}
                </div>

                {/* Earning limits / cap */}
                <div className="admin-profile-section">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <FiBarChart /> Earning cap ({capPct}% used)
                  </h4>
                  <div style={{ background: '#f3f4f6', borderRadius: 6, height: 8, marginBottom: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${capPct}%`, height: '100%', background: capPct >= 90 ? '#dc2626' : '#16a34a', transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ display: 'grid', gap: 4 }}>
                    <WalletRow label="Lifetime earning cap (10× principal)" value={lim.total} />
                    <WalletRow label="Already earned (in wallet)" value={lim.pending} />
                    <WalletRow label="Available to earn" value={availableToEarn} />
                    {(lim.cross || 0) > 0 && <WalletRow label="⚠ Exceeded cap (capped out)" value={lim.cross} />}
                  </div>
                </div>
              </>
            )
          })()}

          {/* ── Daily log / crop photos ───────────────────────────────── */}
          {user.role !== 'admin' && (
            <div className="admin-profile-section">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <FiImage /> Daily crop logs
              </h4>
              {!dashData ? (
                <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>Loading…</p>
              ) : recentLogs.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>No logs submitted yet.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {recentLogs.map((log) => (
                    <div key={log.id} style={{ textAlign: 'center' }}>
                      {log.has_image && todayLog?.id === log.id && todayLog.image_data ? (
                        <img
                          src={todayLog.image_data}
                          alt={`log ${log.date}`}
                          style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 6, border: '2px solid #16a34a' }}
                        />
                      ) : log.has_image ? (
                        <div
                          style={{
                            width: 70, height: 70, borderRadius: 6,
                            background: '#d1fae5', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, color: '#065f46',
                          }}
                        >
                          <FiImage size={20} />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: 70, height: 70, borderRadius: 6,
                            background: '#fee2e2', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, color: '#991b1b',
                          }}
                        >
                          <FiAlertTriangle size={20} />
                        </div>
                      )}
                      <div style={{ fontSize: 10, marginTop: 3, color: 'var(--color-muted)' }}>
                        {log.date?.slice(5)}
                      </div>
                      <div style={{ fontSize: 10, color: log.watered ? '#16a34a' : '#dc2626' }}>
                        {log.watered ? '✓ watered' : '✗ dry'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="admin-modal-foot">
          {user.role !== 'admin' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onViewTree?.(user)}
            >
              <FiGitBranch /> Referral tree
            </button>
          )}
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          {canDelete && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => onDelete(user)}
            >
              <FiTrash2 /> Delete account
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const PAGE_SIZE = 20

export default function UsersPage() {
  const { user: me } = useAdminAuth()
  const dialog = useAdminDialog()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [treeUser, setTreeUser] = useState(null)

  const load = () => {
    setLoading(true)
    adminApi
      .users()
      .then(setItems)
      .catch((e) => setStatus({ type: 'error', text: e.message }))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const remove = async (u) => {
    const ok = await dialog.confirm(confirmDelete(u.full_name, 'member'))
    if (!ok) return
    try {
      await adminApi.deleteUser(u.id)
      setSelected(null)
      setStatus({ type: 'success', text: 'User removed.' })
      load()
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    }
  }

  const counts = useMemo(() => ({
    all: items.length,
    customer: items.filter((u) => u.role === 'customer').length,
    franchisee: items.filter((u) => u.role === 'franchisee').length,
    admin: items.filter((u) => u.role === 'admin').length,
  }), [items])

  const afterSearch = useMemo(() => {
    const q = search.trim().toLowerCase()
    const afterRole = filter === 'all' ? items : items.filter((u) => u.role === filter)
    if (!q) return afterRole
    return afterRole.filter(
      (u) =>
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q) ||
        (u.member_id || '').toLowerCase().includes(q) ||
        (u.city || '').toLowerCase().includes(q),
    )
  }, [items, filter, search])

  const totalPages = Math.max(1, Math.ceil(afterSearch.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const filtered = useMemo(
    () => afterSearch.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [afterSearch, safePage],
  )
  const q = search.trim()

  const handleFilter = (role) => { setFilter(role); setPage(1) }
  const handleSearch = (e) => { setSearch(e.target.value); setPage(1) }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Registered members</h1>
          <p>Full profiles of everyone who signed up on the website.</p>
        </div>
      </div>

      {status && <div className={`form-message ${status.type}`}>{status.text}</div>}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
        <div className="admin-filter-tabs" style={{ margin: 0 }}>
          {['all', 'customer', 'franchisee', 'admin'].map((role) => (
            <button
              key={role}
              type="button"
              className={`admin-filter-tab ${filter === role ? 'active' : ''}`}
              onClick={() => handleFilter(role)}
            >
              {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
              <span className="tab-count">{counts[role]}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          className="form-control"
          placeholder="Search name, email, phone, member ID…"
          value={search}
          onChange={handleSearch}
          style={{ maxWidth: 280, fontSize: 14 }}
        />
      </div>

      {loading ? (
        <p>Loading profiles…</p>
      ) : afterSearch.length === 0 ? (
        <section className="admin-panel admin-empty-state">
          <FiUser size={48} />
          <h3>{q ? 'No members match your search' : 'No members yet'}</h3>
          <p>{q ? 'Try a different search term.' : 'New registrations will appear here with full profile details.'}</p>
        </section>
      ) : (
        <>
        <div className="admin-user-grid">
          {filtered.map((u) => (
            <article key={u.id} className="admin-user-card">
              <div className="admin-user-card-top">
                <div
                  className="user-avatar"
                  style={{ background: ROLE_COLORS[u.role] || '#475569' }}
                >
                  {initials(u.full_name)}
                </div>
                <div className="admin-user-card-meta">
                  <h3>{u.full_name}</h3>
                  <span
                    className="role-pill sm"
                    style={{ background: ROLE_COLORS[u.role] || '#475569' }}
                  >
                    {u.role}
                  </span>
                </div>
              </div>
              <ul className="admin-user-card-info">
                <li>
                  <FiMail /> {u.email}
                </li>
                <li>
                  <FiPhone /> {u.phone}
                </li>
                <li>
                  <FiMapPin />
                  {u.city || u.state
                    ? [u.city, u.state].filter(Boolean).join(', ')
                    : 'Location not set'}
                </li>
                <li>
                  <FiUser /> {u.member_id || `KGF${870000 + u.id}`}
                </li>
                <li>
                  Sponsor: {u.sponsor_member_id ? `${u.sponsor_member_id}${u.sponsor_name ? ` (${u.sponsor_name})` : ''}` : 'None'}
                </li>
                <li>
                  <FiUsers /> {u.direct_referral_count ?? 0} direct referral(s)
                </li>
                <li>
                  <FiDollarSign /> {formatInr(u.amount)}
                </li>
                <li>
                  <FiCalendar /> Joined {formatDate(u.registered_at)}
                </li>
              </ul>
              <div className="admin-user-card-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setSelected(u)}
                >
                  View profile
                </button>
                {u.id !== me?.id && (
                  <button
                    type="button"
                    className="icon-btn danger"
                    onClick={() => remove(u)}
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={safePage === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '…' ? (
                  <span key={`ellipsis-${i}`} style={{ padding: '6px 4px', color: 'var(--color-muted)' }}>…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    className={`btn btn-sm ${safePage === p ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
        </>
      )}

      <ProfileModal
        user={selected}
        onClose={() => setSelected(null)}
        onDelete={remove}
        canDelete={selected && selected.id !== me?.id}
        onViewTree={(u) => {
          setSelected(null)
          setTreeUser(u)
        }}
        onAmountSaved={(newAmount) => {
          load()
          setSelected((prev) =>
            prev ? { ...prev, amount: newAmount } : null,
          )
        }}
      />

      <AdminReferralTreeModal
        userId={treeUser?.id}
        memberId={treeUser?.member_id}
        memberName={treeUser?.full_name}
        onClose={() => setTreeUser(null)}
      />
    </>
  )
}
