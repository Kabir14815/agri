import { Navigate, Route, Routes } from 'react-router-dom'
import UserDashboardLayout from '../user/UserDashboardLayout.jsx'
import DashboardHome from './dashboard/DashboardHome.jsx'
import DashboardRewards from './dashboard/DashboardRewards.jsx'
import ProfileLayout from './dashboard/ProfileLayout.jsx'
import ProfileView from './dashboard/ProfileView.jsx'
import ProfileEdit from './dashboard/ProfileEdit.jsx'
import ProfileBank from './dashboard/ProfileBank.jsx'
import ProfilePassword from './dashboard/ProfilePassword.jsx'
import DashboardWallet from './dashboard/DashboardWallet.jsx'
import DashboardTeam from './dashboard/DashboardTeam.jsx'
import DashboardDeposit from './dashboard/DashboardDeposit.jsx'
import DashboardActivate from './dashboard/DashboardActivate.jsx'

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
        <Route path="deposit" element={<DashboardDeposit />} />
        <Route path="team" element={<DashboardTeam />} />
        <Route path="wallet" element={<DashboardWallet />} />
        <Route path="activate" element={<DashboardActivate />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
