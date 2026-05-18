import { useEffect, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { FiMenu, FiX, FiChevronDown, FiShield } from 'react-icons/fi'
import { useAdminAuth } from '../admin/AdminAuth.jsx'
import { useUserAuth } from '../user/UserAuth.jsx'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const { user: adminUser } = useAdminAuth()
  const { user: memberUser } = useUserAuth()

  useEffect(() => {
    document.body.classList.toggle('nav-open', open)
    return () => document.body.classList.remove('nav-open')
  }, [open])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 992) setOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main navigation">
        <div className="container navbar-inner">
          <Link to="/" className="brand" onClick={close}>
            <div className="brand-logo">K</div>
            <div>
              <div>KGF Farming</div>
              <div className="brand-sub">Kamauput Growth Farming</div>
            </div>
          </Link>

          <ul className={`nav-links nav-drawer ${open ? 'open' : ''}`}>
            <li>
              <NavLink to="/" end onClick={close}>
                Home
              </NavLink>
            </li>
            <li className="nav-dropdown">
              <NavLink to="/about" onClick={close}>
                About Us <FiChevronDown style={{ verticalAlign: 'middle' }} />
              </NavLink>
              <ul className="dropdown-menu">
                <li>
                  <Link to="/about/legals" onClick={close}>
                    Our Legals
                  </Link>
                </li>
                <li>
                  <Link to="/why-us" onClick={close}>
                    Why Us
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <NavLink to="/#products" onClick={close}>
                Products
              </NavLink>
            </li>
            <li>
              <NavLink to="/services" onClick={close}>
                Services
              </NavLink>
            </li>
            <li>
              <NavLink to="/blog" onClick={close}>
                Blog
              </NavLink>
            </li>
            <li>
              <NavLink to="/contact" onClick={close}>
                Contact Us
              </NavLink>
            </li>
            {memberUser ? (
              <li>
                <NavLink to="/dashboard" onClick={close}>
                  My Dashboard
                </NavLink>
              </li>
            ) : (
              <li>
                <NavLink to="/login" onClick={close}>
                  Login
                </NavLink>
              </li>
            )}
            {adminUser && (
              <li>
                <NavLink to="/admin" onClick={close} className="admin-pill-link">
                  <FiShield style={{ verticalAlign: 'middle' }} /> Admin Panel
                </NavLink>
              </li>
            )}
            <li className="nav-drawer-mobile-cta">
              <Link to="/register" className="btn btn-accent" onClick={close}>
                Register Now
              </Link>
            </li>
          </ul>

          <div className="nav-actions">
            <Link to="/register" className="btn btn-accent btn-register-desktop">
              Register
            </Link>
            <button
              type="button"
              className="menu-toggle"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        <button
          type="button"
          className={`nav-overlay ${open ? 'visible' : ''}`}
          onClick={close}
          aria-label="Close menu"
          tabIndex={open ? 0 : -1}
        />
      </nav>
    </header>
  )
}
