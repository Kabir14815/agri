import DashboardSectionLayout from '../../components/DashboardSectionLayout.jsx'

const TABS = [
  { to: '/dashboard/wallet', end: true, label: 'Income Wallet' },
  { to: '/dashboard/wallet/transfer', label: 'Wallet Transfer' },
  { to: '/dashboard/wallet/repurchase', label: 'Repurchase Wallet' },
  { to: '/dashboard/wallet/topup', label: 'Topup Wallet' },
  { to: '/dashboard/wallet/statement', label: 'Wallet Statement' },
]

export default function WalletLayout() {
  return <DashboardSectionLayout tabs={TABS} />
}
