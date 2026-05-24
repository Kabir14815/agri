import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api.js'
import { formatInrPlain } from '../../utils/format.js'

function TreeNode({ node, onView, isRoot }) {
  return (
    <div className={`mlm-tree-node${isRoot ? ' root' : ''}`}>
      <div className="mlm-tree-node-logo">KGF</div>
      <p className="mlm-tree-mid">{node.member_id}</p>
      <p className="mlm-tree-name">{node.full_name}</p>
      <p className="mlm-tree-meta">Referral — {node.referral_count}</p>
      <p className="mlm-tree-meta">Amount — {formatInrPlain(node.amount)}</p>
      <button type="button" className="mlm-tree-view-btn" onClick={() => onView(node.member_id)}>
        View
      </button>
      {node.has_downline && !isRoot && <span className="mlm-tree-arrow">▼</span>}
    </div>
  )
}

export default function DashboardReferralTree() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tree, setTree] = useState(null)
  const [searchId, setSearchId] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const memberId = searchParams.get('member_id') || ''

  const load = (mid) => {
    setLoading(true)
    setError(null)
    api
      .getReferralTree(mid || undefined)
      .then((data) => {
        setTree(data)
        if (mid) setSearchId(mid)
        else if (data?.root?.member_id) setSearchId(data.root.member_id)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(memberId || undefined)
  }, [memberId])

  const onSearch = (e) => {
    e.preventDefault()
    const id = searchId.trim().toUpperCase()
    if (!id) {
      setSearchParams({})
      return
    }
    setSearchParams({ member_id: id })
  }

  const onView = (mid) => setSearchParams({ member_id: mid })

  if (loading && !tree) {
    return <div className="mlm-loading">Loading referral tree…</div>
  }

  if (error) {
    return (
      <>
        <h2 className="mlm-page-title">Referral Tree</h2>
        <div className="form-message error">{error}</div>
      </>
    )
  }

  if (!tree?.root) return null

  return (
    <>
      <h2 className="mlm-page-title mlm-tree-title">Referral Tree</h2>

      <form className="mlm-tree-search" onSubmit={onSearch}>
        <input
          type="text"
          placeholder="Enter User Id"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value.toUpperCase())}
        />
        <button type="submit">go</button>
      </form>

      <div className="mlm-tree-canvas">
        <div className="mlm-tree-level root-level">
          <TreeNode node={tree.root} onView={onView} isRoot />
        </div>

        {tree.children?.length > 0 && (
          <>
            <div className="mlm-tree-connector" />
            <div className="mlm-tree-level children-level">
              {tree.children.map((child) => (
                <div key={child.member_id} className="mlm-tree-child-wrap">
                  <TreeNode node={child} onView={onView} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
