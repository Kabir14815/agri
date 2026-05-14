import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { FiMenu, FiX, FiChevronDown, FiShield } from 'react-icons/fi'
import { useAdminAuth } from '../admin/AdminAuth.jsx'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const { user: adminUser } = useAdminAuth()

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={close}>
          <div className="brand-logo">K</div>
          <div>
            <div>KGF Farming</div>
            <div className="brand-sub">Kamauput Growth Farming</div>
          </div>
        </Link>

        <ul className={`nav-links ${open ? 'open' : ''}`}>
          <li>
            <NavLink to="/" end onClick={close}>Home</NavLink>
          </li>
          <li className="nav-dropdown">
            <NavLink to="/about" onClick={close}>
              About <FiChevronDown style={{ verticalAlign: 'middle' }} />
            </NavLink>
            <ul className="dropdown-menu">
              <li><Link to="/about/legals" onClick={close}>Our Legals</Link></li>
            </ul>
          </li>
          <li><NavLink to="/why-us" onClick={close}>Why Us</NavLink></li>
          <li><NavLink to="/services" onClick={close}>Services</NavLink></li>
          <li><NavLink to="/achievers" onClick={close}>Achievers</NavLink></li>
          <li><NavLink to="/blog" onClick={close}>Blog</NavLink></li>
          <li><NavLink to="/contact" onClick={close}>Contact</NavLink></li>
          <li><NavLink to="/login" onClick={close}>Login</NavLink></li>
          <li><NavLink to="/franchisee-login" onClick={close}>Franchisee Login</NavLink></li>
          {adminUser && (
            <li>
              <NavLink to="/admin" onClick={close} className="admin-pill-link">
                <FiShield style={{ verticalAlign: 'middle' }} /> Admin Panel
              </NavLink>
            </li>
          )}
        </ul>

        <div className="nav-actions">
          <Link to="/register" className="btn btn-primary">Register</Link>
          <button
            className="menu-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
    </header>
  )
}
