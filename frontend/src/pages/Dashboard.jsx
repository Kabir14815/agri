import { Navigate, Route, Routes } from 'react-router-dom'
import UserDashboardLayout from '../user/UserDashboardLayout.jsx'
import DashboardHome from './dashboard/DashboardHome.jsx'
import DashboardRewards from './dashboard/DashboardRewards.jsx'
import DashboardPlaceholder from './dashboard/DashboardPlaceholder.jsx'

export default function Dashboard() {
  return (
    <Routes>
      <Route element={<UserDashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="rewards" element={<DashboardRewards />} />
        <Route path="profile" element={<DashboardPlaceholder title="Profile" />} />
        <Route path="deposit" element={<DashboardPlaceholder title="Deposit" />} />
        <Route path="team" element={<DashboardPlaceholder title="Team" />} />
        <Route path="wallet" element={<DashboardPlaceholder title="Wallet" />} />
        <Route path="activate" element={<DashboardPlaceholder title="Activate" />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
