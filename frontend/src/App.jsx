import { Routes, Route, useLocation } from 'react-router-dom'
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
import Dashboard from './pages/Dashboard.jsx'
import AdminLayout from './admin/AdminLayout.jsx'
import AdminLogin from './admin/AdminLogin.jsx'
import AdminDashboard from './admin/AdminDashboard.jsx'
import ProductsPage from './admin/pages/ProductsPage.jsx'
import ServicesPage from './admin/pages/ServicesPage.jsx'
import BlogPage from './admin/pages/BlogPage.jsx'
import AchieversPage from './admin/pages/AchieversPage.jsx'
import TestimonialsPage from './admin/pages/TestimonialsPage.jsx'
import FaqsPage from './admin/pages/FaqsPage.jsx'
import ContactsPage from './admin/pages/ContactsPage.jsx'
import UsersPage from './admin/pages/UsersPage.jsx'
import DepositsPage from './admin/pages/DepositsPage.jsx'
import HelpDeskPage from './admin/pages/HelpDeskPage.jsx'
import ExchangePage from './admin/pages/ExchangePage.jsx'

export default function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')
  const isMemberDash = pathname.startsWith('/dashboard')

  return (
    <AdminAuthProvider>
      <UserAuthProvider>
      <CompanyProvider>
      <ScrollToTop />
      {!isAdmin && !isMemberDash && (
        <>
          <TopBar />
          <Navbar />
        </>
      )}
      <main className="site-main">
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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/franchisee-login" element={<FranchiseeLogin />} />
          <Route
            path="/dashboard"
            element={
              <RequireUser>
                <Dashboard />
              </RequireUser>
            }
          />

          {/* Admin */}
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
            <Route path="deposits" element={<DepositsPage />} />
            <Route path="help-desk" element={<HelpDeskPage />} />
            <Route path="exchange" element={<ExchangePage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdmin && !isMemberDash && <Footer />}
      </CompanyProvider>
      </UserAuthProvider>
    </AdminAuthProvider>
  )
}
