import { Navigate, Route, Routes } from 'react-router-dom'
import UserDashboardLayout from '../user/UserDashboardLayout.jsx'
import DashboardHome from './dashboard/DashboardHome.jsx'
import DashboardRewards from './dashboard/DashboardRewards.jsx'
import ProfileLayout from './dashboard/ProfileLayout.jsx'
import ProfileView from './dashboard/ProfileView.jsx'
import ProfileEdit from './dashboard/ProfileEdit.jsx'
import ProfileBank from './dashboard/ProfileBank.jsx'
import ProfilePassword from './dashboard/ProfilePassword.jsx'
import DepositLayout from './dashboard/DepositLayout.jsx'
import DepositRequest from './dashboard/DepositRequest.jsx'
import DepositHistory from './dashboard/DepositHistory.jsx'
import WalletLayout from './dashboard/WalletLayout.jsx'
import WalletIncome from './dashboard/WalletIncome.jsx'
import WalletRepurchase from './dashboard/WalletRepurchase.jsx'
import WalletTopup from './dashboard/WalletTopup.jsx'
import WalletStatement from './dashboard/WalletStatement.jsx'
import WalletTransfer from './dashboard/WalletTransfer.jsx'
import TeamLayout from './dashboard/TeamLayout.jsx'
import DashboardTeam from './dashboard/DashboardTeam.jsx'
import DashboardReferralTree from './dashboard/DashboardReferralTree.jsx'
import DashboardActivate from './dashboard/DashboardActivate.jsx'
import DashboardIncomes from './dashboard/DashboardIncomes.jsx'
import DashboardExchange from './dashboard/DashboardExchange.jsx'
import DashboardTransactions from './dashboard/DashboardTransactions.jsx'
import DashboardHelpDesk from './dashboard/DashboardHelpDesk.jsx'
import DashboardRegister from './dashboard/DashboardRegister.jsx'
import DashboardSecurity from './dashboard/DashboardSecurity.jsx'
import DashboardDailyLog from './dashboard/DashboardDailyLog.jsx'

export default function Dashboard() {
  return (
    <Routes>
      <Route element={<UserDashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="rewards" element={<DashboardRewards />} />
        <Route path="profile" element={<ProfileLayout />}>
          <Route index element={<ProfileView />} />
          <Route path="edit" element={<ProfileEdit />} />
          <Route path="bank" element={<ProfileBank />} />
          <Route path="password" element={<ProfilePassword />} />
        </Route>
        <Route path="deposit" element={<DepositLayout />}>
          <Route index element={<DepositRequest />} />
          <Route path="history" element={<DepositHistory />} />
        </Route>
        <Route path="team" element={<TeamLayout />}>
          <Route index element={<DashboardTeam />} />
          <Route path="referral-tree" element={<DashboardReferralTree />} />
        </Route>
        <Route path="wallet" element={<WalletLayout />}>
          <Route index element={<WalletIncome />} />
          <Route path="transfer" element={<WalletTransfer />} />
          <Route path="repurchase" element={<WalletRepurchase />} />
          <Route path="topup" element={<WalletTopup />} />
          <Route path="statement" element={<WalletStatement />} />
        </Route>
        <Route path="activate" element={<DashboardActivate />} />
        <Route path="daily-log" element={<DashboardDailyLog />} />
        <Route path="incomes" element={<DashboardIncomes />} />
        <Route path="exchange" element={<DashboardExchange />} />
        <Route path="transactions" element={<DashboardTransactions />} />
        <Route path="help-desk" element={<DashboardHelpDesk />} />
        <Route path="register-member" element={<DashboardRegister />} />
        <Route path="security" element={<DashboardSecurity />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
