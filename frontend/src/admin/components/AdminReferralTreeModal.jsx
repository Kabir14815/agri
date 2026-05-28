import { useEffect, useState } from 'react'
import { FiX } from 'react-icons/fi'
import { adminApi } from '../../api.js'
import ReferralTreeView from '../../components/ReferralTreeView.jsx'

export default function AdminReferralTreeModal({ userId, memberId, memberName, onClose }) {
  const [tree, setTree] = useState(null)
  const [currentMemberId, setCurrentMemberId] = useState(memberId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) return
    setCurrentMemberId(memberId)
  }, [userId, memberId])

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    adminApi
      .getUserReferralTree(userId, currentMemberId)
      .then(setTree)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [userId, currentMemberId])

  if (!userId) return null

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal admin-referral-tree-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-head">
          <h3>
            Referral tree — {memberName} ({currentMemberId})
          </h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>
        <div className="admin-referral-tree-body">
          {loading && <p>Loading tree…</p>}
          {error && <div className="form-message error">{error}</div>}
          {tree?.root && <ReferralTreeView tree={tree} onView={setCurrentMemberId} />}
        </div>
        <div className="admin-modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
