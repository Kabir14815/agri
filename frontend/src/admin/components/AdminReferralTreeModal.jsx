import { useEffect, useState } from 'react'
import { FiX } from 'react-icons/fi'
import { adminApi } from '../../api.js'
import { formatInrPlain } from '../../utils/format.js'

function TreeNode({ node, onView }) {
  return (
    <div className="mlm-tree-node">
      <div className="mlm-tree-node-logo">KGF</div>
      <p className="mlm-tree-mid">{node.member_id}</p>
      <p className="mlm-tree-name">{node.full_name}</p>
      <p className="mlm-tree-stat">{node.referral_count}</p>
      <p className="mlm-tree-amount">{formatInrPlain(node.amount)}</p>
      <button type="button" className="mlm-tree-view-btn" onClick={() => onView(node.member_id)}>
        View
      </button>
    </div>
  )
}

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
          {tree?.root && (
            <div className="mlm-tree-canvas">
              <div className="mlm-tree-level root-level">
                <TreeNode node={tree.root} onView={setCurrentMemberId} />
              </div>
              {tree.children?.length > 0 && (
                <>
                  <div className="mlm-tree-connector" />
                  <div className="mlm-tree-level children-level">
                    {tree.children.map((child) => (
                      <div key={child.member_id} className="mlm-tree-child-wrap">
                        <TreeNode node={child} onView={setCurrentMemberId} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
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
