import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api.js'
import ReferralTreeView from '../../components/ReferralTreeView.jsx'

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

  return (
    <>
      <h2 className="mlm-page-title mlm-tree-title">
        Referral Tree
        {tree?.levels_open != null
          ? ` (${tree.levels_open} of ${tree.tree_levels_max || 24} levels open)`
          : ''}
      </h2>

      <form className="mlm-tree-search" onSubmit={onSearch}>
        <input
          type="text"
          placeholder="Enter User Id"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value.toUpperCase())}
        />
        <button type="submit">go</button>
      </form>

      <ReferralTreeView tree={tree} onView={onView} />
    </>
  )
}
