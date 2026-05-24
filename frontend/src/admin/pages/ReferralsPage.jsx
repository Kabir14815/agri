import { useEffect, useState } from 'react'
import { FiUsers, FiGitBranch, FiEye } from 'react-icons/fi'
import { adminApi } from '../../api.js'
import AdminReferralTreeModal from '../components/AdminReferralTreeModal.jsx'
import { buildReferralShareUrl } from '../../utils/referral.js'

function formatInr(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n ?? 0)
}

export default function ReferralsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [treeUser, setTreeUser] = useState(null)
  const [visits, setVisits] = useState([])
  const [tab, setTab] = useState('members')

  useEffect(() => {
    Promise.all([adminApi.referrals(), adminApi.referralVisits()])
      .then(([members, v]) => {
        setRows(members)
        setVisits(v)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Referral network</h1>
          <p>Every member&apos;s sponsor link and direct referrals from registration.</p>
        </div>
      </div>

      {error && <div className="form-message error">{error}</div>}

      <div className="admin-filter-tabs">
        <button
          type="button"
          className={`admin-filter-tab ${tab === 'members' ? 'active' : ''}`}
          onClick={() => setTab('members')}
        >
          Members <span className="tab-count">{rows.length}</span>
        </button>
        <button
          type="button"
          className={`admin-filter-tab ${tab === 'visits' ? 'active' : ''}`}
          onClick={() => setTab('visits')}
        >
          Link visits <span className="tab-count">{visits.length}</span>
        </button>
      </div>

      {loading ? (
        <p>Loading referral data…</p>
      ) : tab === 'visits' ? (
        visits.length === 0 ? (
          <section className="admin-panel admin-empty-state">
            <FiEye size={48} />
            <h3>No link visits yet</h3>
            <p>Visits are recorded when someone opens /ref/CODE or ?ref=CODE</p>
          </section>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Sponsor</th>
                  <th>Path</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <strong>{v.code}</strong>
                    </td>
                    <td>{v.sponsor_name}</td>
                    <td>
                      <small>{v.path || '—'}</small>
                    </td>
                    <td>{v.visited_at?.slice(0, 16).replace('T', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : rows.length === 0 ? (
        <section className="admin-panel admin-empty-state">
          <FiUsers size={48} />
          <h3>No members yet</h3>
        </section>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Sponsor</th>
                <th>Direct refs</th>
                <th>Link visits</th>
                <th>Referral URL</th>
                <th>Package</th>
                <th>Joined</th>
                <th>Tree</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user_id}>
                  <td>
                    <strong>{r.member_id}</strong>
                  </td>
                  <td>{r.full_name}</td>
                  <td>{r.email}</td>
                  <td>
                    {r.sponsor_member_id ? (
                      <>
                        <strong>{r.sponsor_member_id}</strong>
                        {r.sponsor_name && (
                          <>
                            <br />
                            <small>{r.sponsor_name}</small>
                          </>
                        )}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{r.direct_referral_count}</td>
                  <td>{r.link_visits ?? 0}</td>
                  <td>
                    <a
                      href={buildReferralShareUrl(window.location.origin, r.member_id)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      /ref/{r.member_id}
                    </a>
                  </td>
                  <td>{formatInr(r.amount)}</td>
                  <td>{r.registered_at?.slice(0, 10)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setTreeUser(r)}
                    >
                      <FiGitBranch /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminReferralTreeModal
        userId={treeUser?.user_id}
        memberId={treeUser?.member_id}
        memberName={treeUser?.full_name}
        onClose={() => setTreeUser(null)}
      />
    </>
  )
}
