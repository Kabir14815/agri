import { formatInrPlain } from '../utils/format.js'

export function ReferralTreeNode({ node, onView, isRoot }) {
  return (
    <div className={`mlm-tree-node${isRoot ? ' root' : ''}`}>
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

function TreeBranch({ nodes, onView, depth = 1 }) {
  if (!nodes?.length) return null
  return (
    <>
      <div className="mlm-tree-connector" />
      <div className={`mlm-tree-level children-level mlm-tree-depth-${depth}`}>
        {nodes.map((child) => (
          <div key={child.member_id} className="mlm-tree-child-wrap">
            <ReferralTreeNode node={child} onView={onView} />
            <TreeBranch nodes={child.children} onView={onView} depth={depth + 1} />
          </div>
        ))}
      </div>
    </>
  )
}

export default function ReferralTreeView({ tree, onView }) {
  if (!tree?.root) return null
  return (
    <div className="mlm-tree-canvas mlm-tree-canvas-nested">
      {tree.max_depth && (
        <p className="mlm-tree-plan-hint">
          Plan: {tree.max_depth} levels · {tree.bonus_rate_percent || 2}% direct bonus up to{' '}
          {tree.bonus_levels || 5} upline levels (min ₹2.5L investment)
        </p>
      )}
      <div className="mlm-tree-level root-level">
        <ReferralTreeNode node={tree.root} onView={onView} isRoot />
      </div>
      <TreeBranch nodes={tree.children || tree.root.children} onView={onView} />
    </div>
  )
}
