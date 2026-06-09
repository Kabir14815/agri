import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import UserDashboardLayout from '../user/UserDashboardLayout.jsx'

const DashboardHome = lazy(() => import('./dashboard/DashboardHome.jsx'))
const DashboardRewards = lazy(() => import('./dashboard/DashboardRewards.jsx'))
const ProfileLayout = lazy(() => import('./dashboard/ProfileLayout.jsx'))
const ProfileView = lazy(() => import('./dashboard/ProfileView.jsx'))
const ProfileEdit = lazy(() => import('./dashboard/ProfileEdit.jsx'))
const ProfileBank = lazy(() => import('./dashboard/ProfileBank.jsx'))
const ProfilePassword = lazy(() => import('./dashboard/ProfilePassword.jsx'))
const DepositLayout = lazy(() => import('./dashboard/DepositLayout.jsx'))
const DepositRequest = lazy(() => import('./dashboard/DepositRequest.jsx'))
const DepositHistory = lazy(() => import('./dashboard/DepositHistory.jsx'))
const WalletLayout = lazy(() => import('./dashboard/WalletLayout.jsx'))
const WalletIncome = lazy(() => import('./dashboard/WalletIncome.jsx'))
const WalletRepurchase = lazy(() => import('./dashboard/WalletRepurchase.jsx'))
const WalletTopup = lazy(() => import('./dashboard/WalletTopup.jsx'))
const WalletStatement = lazy(() => import('./dashboard/WalletStatement.jsx'))
const WalletTransfer = lazy(() => import('./dashboard/WalletTransfer.jsx'))
const TeamLayout = lazy(() => import('./dashboard/TeamLayout.jsx'))
const DashboardTeam = lazy(() => import('./dashboard/DashboardTeam.jsx'))
const DashboardReferralTree = lazy(() => import('./dashboard/DashboardReferralTree.jsx'))
const DashboardActivate = lazy(() => import('./dashboard/DashboardActivate.jsx'))
const DashboardIncomes = lazy(() => import('./dashboard/DashboardIncomes.jsx'))
const DashboardExchange = lazy(() => import('./dashboard/DashboardExchange.jsx'))
const DashboardTransactions = lazy(() => import('./dashboard/DashboardTransactions.jsx'))
const DashboardHelpDesk = lazy(() => import('./dashboard/DashboardHelpDesk.jsx'))
const DashboardRegister = lazy(() => import('./dashboard/DashboardRegister.jsx'))
const DashboardSecurity = lazy(() => import('./dashboard/DashboardSecurity.jsx'))
const DashboardDailyLog = lazy(() => import('./dashboard/DashboardDailyLog.jsx'))

function DashFallback() {
  return <div className="mlm-loading">Loading…</div>
}

export default function Dashboard() {
  return (
    <Routes>
      <Route element={<UserDashboardLayout />}>
        <Route
          index
          element={
            <Suspense fallback={<DashFallback />}>
              <DashboardHome />
            </Suspense>
          }
        />
        <Route
          path="rewards"
          element={
            <Suspense fallback={<DashFallback />}>
              <DashboardRewards />
            </Suspense>
          }
        />
        <Route
          path="profile"
          element={
            <Suspense fallback={<DashFallback />}>
              <ProfileLayout />
            </Suspense>
          }
        >
          <Route index element={<Suspense fallback={<DashFallback />}><ProfileView /></Suspense>} />
          <Route path="edit" element={<Suspense fallback={<DashFallback />}><ProfileEdit /></Suspense>} />
          <Route path="bank" element={<Suspense fallback={<DashFallback />}><ProfileBank /></Suspense>} />
          <Route path="password" element={<Suspense fallback={<DashFallback />}><ProfilePassword /></Suspense>} />
        </Route>
        <Route
          path="deposit"
          element={
            <Suspense fallback={<DashFallback />}>
              <DepositLayout />
            </Suspense>
          }
        >
          <Route index element={<Suspense fallback={<DashFallback />}><DepositRequest /></Suspense>} />
          <Route path="history" element={<Suspense fallback={<DashFallback />}><DepositHistory /></Suspense>} />
        </Route>
        <Route
          path="team"
          element={
            <Suspense fallback={<DashFallback />}>
              <TeamLayout />
            </Suspense>
          }
        >
          <Route index element={<Suspense fallback={<DashFallback />}><DashboardTeam /></Suspense>} />
          <Route path="referral-tree" element={<Suspense fallback={<DashFallback />}><DashboardReferralTree /></Suspense>} />
        </Route>
        <Route
          path="wallet"
          element={
            <Suspense fallback={<DashFallback />}>
              <WalletLayout />
            </Suspense>
          }
        >
          <Route index element={<Suspense fallback={<DashFallback />}><WalletIncome /></Suspense>} />
          <Route path="transfer" element={<Suspense fallback={<DashFallback />}><WalletTransfer /></Suspense>} />
          <Route path="repurchase" element={<Suspense fallback={<DashFallback />}><WalletRepurchase /></Suspense>} />
          <Route path="topup" element={<Suspense fallback={<DashFallback />}><WalletTopup /></Suspense>} />
          <Route path="statement" element={<Suspense fallback={<DashFallback />}><WalletStatement /></Suspense>} />
        </Route>
        <Route path="activate" element={<Suspense fallback={<DashFallback />}><DashboardActivate /></Suspense>} />
        <Route path="daily-log" element={<Suspense fallback={<DashFallback />}><DashboardDailyLog /></Suspense>} />
        <Route path="incomes" element={<Suspense fallback={<DashFallback />}><DashboardIncomes /></Suspense>} />
        <Route path="exchange" element={<Suspense fallback={<DashFallback />}><DashboardExchange /></Suspense>} />
        <Route path="transactions" element={<Suspense fallback={<DashFallback />}><DashboardTransactions /></Suspense>} />
        <Route path="help-desk" element={<Suspense fallback={<DashFallback />}><DashboardHelpDesk /></Suspense>} />
        <Route path="register-member" element={<Suspense fallback={<DashFallback />}><DashboardRegister /></Suspense>} />
        <Route path="security" element={<Suspense fallback={<DashFallback />}><DashboardSecurity /></Suspense>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
