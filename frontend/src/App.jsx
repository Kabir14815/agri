import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import TopBar from './components/TopBar.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Services from './pages/Services.jsx'
import WhyUs from './pages/WhyUs.jsx'
import Achievers from './pages/Achievers.jsx'
import Blog from './pages/Blog.jsx'
import BlogDetail from './pages/BlogDetail.jsx'
import Contact from './pages/Contact.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import FranchiseeLogin from './pages/FranchiseeLogin.jsx'
import OurLegals from './pages/OurLegals.jsx'
import NotFound from './pages/NotFound.jsx'

import { AdminAuthProvider, RequireAdmin } from './admin/AdminAuth.jsx'
import { UserAuthProvider, RequireUser } from './user/UserAuth.jsx'
import { CompanyProvider } from './context/CompanyContext.jsx'
import ReferralLanding from './pages/ReferralLanding.jsx'
import ReferralTracker from './components/ReferralTracker.jsx'

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const AdminLayout = lazy(() => import('./admin/AdminLayout.jsx'))
const AdminLogin = lazy(() => import('./admin/AdminLogin.jsx'))
const AdminDashboard = lazy(() => import('./admin/AdminDashboard.jsx'))
const ProductsPage = lazy(() => import('./admin/pages/ProductsPage.jsx'))
const ServicesPage = lazy(() => import('./admin/pages/ServicesPage.jsx'))
const BlogPage = lazy(() => import('./admin/pages/BlogPage.jsx'))
const AchieversPage = lazy(() => import('./admin/pages/AchieversPage.jsx'))
const TestimonialsPage = lazy(() => import('./admin/pages/TestimonialsPage.jsx'))
const FaqsPage = lazy(() => import('./admin/pages/FaqsPage.jsx'))
const ContactsPage = lazy(() => import('./admin/pages/ContactsPage.jsx'))
const UsersPage = lazy(() => import('./admin/pages/UsersPage.jsx'))
const DepositsPage = lazy(() => import('./admin/pages/DepositsPage.jsx'))
const HelpDeskPage = lazy(() => import('./admin/pages/HelpDeskPage.jsx'))
const ExchangePage = lazy(() => import('./admin/pages/ExchangePage.jsx'))
const WalletTransfersPage = lazy(() => import('./admin/pages/WalletTransfersPage.jsx'))
const ReferralsPage = lazy(() => import('./admin/pages/ReferralsPage.jsx'))
const FarmerLogsPage = lazy(() => import('./admin/pages/FarmerLogsPage.jsx'))

function RouteFallback() {
  return <div className="route-loading">Loading…</div>
}

export default function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')
  const isMemberDash = pathname.startsWith('/dashboard')
  const hideChrome = isAdmin || isMemberDash

  return (
    <AdminAuthProvider>
      <UserAuthProvider>
      <CompanyProvider>
      <ScrollToTop />
      <ReferralTracker />
      {!hideChrome && (
        <>
          <TopBar />
          <Navbar />
        </>
      )}
      <main
        className={`site-main${isMemberDash ? ' site-main--dash' : ''}${isAdmin ? ' site-main--admin' : ''}`}
      >
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/about/legals" element={<OurLegals />} />
          <Route path="/services" element={<Services />} />
          <Route path="/why-us" element={<WhyUs />} />
          <Route path="/achievers" element={<Achievers />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/ref/:code" element={<ReferralLanding />} />
          <Route path="/join/:code" element={<ReferralLanding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register/ref/:code" element={<Register />} />
          <Route path="/register" element={<Register />} />
          <Route path="/franchisee-login" element={<FranchiseeLogin />} />
          <Route path="/farmer-login" element={<Navigate to="/login" replace />} />
          <Route path="/farmer" element={<Navigate to="/dashboard/daily-log" replace />} />
          <Route
            path="/dashboard/*"
            element={
              <RequireUser>
                <Dashboard />
              </RequireUser>
            }
          />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="achievers" element={<AchieversPage />} />
            <Route path="testimonials" element={<TestimonialsPage />} />
            <Route path="faqs" element={<FaqsPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="referrals" element={<ReferralsPage />} />
            <Route path="deposits" element={<DepositsPage />} />
            <Route path="farmer-logs" element={<FarmerLogsPage />} />
            <Route path="help-desk" element={<HelpDeskPage />} />
            <Route path="exchange" element={<ExchangePage />} />
            <Route path="wallet-transfers" element={<WalletTransfersPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      {!hideChrome && <Footer />}
      </CompanyProvider>
      </UserAuthProvider>
    </AdminAuthProvider>
  )
}
