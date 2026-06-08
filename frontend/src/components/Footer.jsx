import { Link } from 'react-router-dom'
import {
  FiMapPin,
  FiMail,
  FiPhone,
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiYoutube,
  FiMessageCircle,
} from 'react-icons/fi'
import { useCompany } from '../context/CompanyContext.jsx'

export default function Footer() {
  const { company } = useCompany()
  const phone = company.phone?.replace(/\s/g, '') || '+919355240503'
  const tel = phone.startsWith('+') ? phone : `+${phone}`
  const wa = company.whatsapp?.replace(/\D/g, '') || phone.replace(/\D/g, '')
  const waUrl = `https://wa.me/${wa}`

  const socials = [
    { icon: FiFacebook, href: company.facebook, label: 'Facebook' },
    { icon: FiTwitter, href: company.twitter, label: 'Twitter' },
    { icon: FiInstagram, href: company.instagram, label: 'Instagram' },
    { icon: FiYoutube, href: company.youtube, label: 'YouTube' },
    { icon: FiMessageCircle, href: waUrl, label: 'WhatsApp' },
  ].filter((s) => s.href)

  return (
    <footer>
      <div className="footer-top-banner">
        <div className="container">
          <p>
            <strong>{company.tagline || 'Vermicompost powered plant boost!'}</strong> —{' '}
            {company.full_name || company.name}
          </p>
        </div>
      </div>
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ color: '#fff' }}>
              <div className="brand-logo">K</div>
              <div>
                <div style={{ color: '#fff' }}>{company.name}</div>
                <div className="brand-sub" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {company.full_name}
                </div>
              </div>
            </div>
            <p style={{ marginTop: 16 }}>
              Leading provider of vermicompost, organic fertilizers and natural crop protection
              solutions across India.
            </p>
            {socials.length > 0 && (
              <div className="social-icons">
                {socials.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4>Important Links</h4>
            <ul>
              <li><Link to="/about/legals">Terms & Conditions</Link></li>
              <li><Link to="/about/legals">Privacy Policy</Link></li>
              <li><Link to="/services">Services & Pricing</Link></li>
              <li><Link to="/why-us">Why Choose Us</Link></li>
            </ul>
          </div>

          <div>
            <h4>Get In Touch</h4>
            <ul className="footer-contact">
              <li>
                <span className="icon"><FiPhone /></span>
                <a href={`tel:${tel}`}>{company.phone}</a>
              </li>
              <li>
                <span className="icon"><FiMail /></span>
                <a href={`mailto:${company.email}`}>{company.email}</a>
              </li>
              <li>
                <span className="icon"><FiMapPin /></span>
                <span>{company.address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} {company.full_name || company.name}</div>
          <div>Healthy Soil · Healthy Plants · Healthy Yield</div>
        </div>
      </div>
    </footer>
  )
}
