import { formatInrPlain } from '../utils/format.js'
import { BRAND } from '../constants/brand.js'

export function ReferralTreeNode({ node, onView, isRoot }) {
  return (
    <div className={`mlm-tree-node${isRoot ? ' root' : ''}`}>
      <img src={BRAND.logo} alt="" className="mlm-tree-node-logo" />
      <p className="mlm-tree-mid">{node.member_id}</p>
      <p className="mlm-tree-name">{node.full_name}</p>
      <p className="mlm-tree-stat">{node.referral_count}</p>
      <p className="mlm-tree-amount">{formatInrPlain(node.amount)}</p>
      {node.member_id && (
        <button type="button" className="mlm-tree-view-btn" onClick={() => onView(node.member_id)}>
          View
        </button>
      )}
    </div>
  )
}

function TreeBranch({ nodes, onView, depth = 1 }) {
  if (!nodes?.length) return null
  return (
    <>
      <div className="mlm-tree-connector" />
      <div className={`mlm-tree-level children-level mlm-tree-depth-${depth}`}>
        {nodes.map((child, idx) => (
          <div key={child.member_id || child.id || idx} className="mlm-tree-child-wrap">
            <ReferralTreeNode node={child} onView={onView} />
            <TreeBranch nodes={child.children} onView={onView} depth={depth + 1} />
          </div>
        ))}
      </div>
    </>
  )
}

export default function ReferralTreeView({ tree, onView }) {
  if (!tree) return null
  if (!tree.root) {
    return <p className="mlm-hint" style={{ marginTop: 16 }}>No referral tree data found for this member ID.</p>
  }
  return (
    <div className="mlm-tree-canvas mlm-tree-canvas-nested">
      {tree.levels_open != null && (
        <p className="mlm-tree-plan-hint">
          Your plan: <strong>{tree.levels_open}</strong> of {tree.tree_levels_max || 24} levels
          open
          {tree.max_depth ? ` (showing ${tree.max_depth} deep)` : ''}. Unlock: Rs 2.5L→5 · Rs
          5L→12 · Rs 7.5L→19 · Rs 10L→24. Bonus: {tree.bonus_rate_percent || 2}% for{' '}
          {tree.bonus_levels || 5} upline levels.
        </p>
      )}
      <div className="mlm-tree-level root-level">
        <ReferralTreeNode node={tree.root} onView={onView} isRoot />
      </div>
      <TreeBranch nodes={tree.children || tree.root.children} onView={onView} />
    </div>
  )
}
