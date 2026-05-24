import DashboardSectionLayout from '../../components/DashboardSectionLayout.jsx'

const TABS = [
  { to: '/dashboard/deposit', end: true, label: 'Request Deposit' },
  { to: '/dashboard/deposit/history', label: 'Deposit History' },
]

export default function DepositLayout() {
  return <DashboardSectionLayout tabs={TABS} />
}
