import { Link } from 'react-router-dom'
import {
  FiMapPin,
  FiMail,
  FiPhone,
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiYoutube,
} from 'react-icons/fi'

export default function Footer() {
  return (
    <footer>
      <div className="footer-top-banner">
        <div className="container">
          <p>
            <strong>Vermicompost powered plant boost!</strong> Nutrient-rich organic fertilizer
            and soil conditioner — Kamauput Growth Farming Pvt Ltd.
          </p>
        </div>
      </div>
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ color: '#fff' }}>
              <div className="brand-logo">K</div>
              <div>
                <div style={{ color: '#fff' }}>KGF Farming</div>
                <div className="brand-sub" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Kamauput Growth Farming
                </div>
              </div>
            </div>
            <p style={{ marginTop: 16 }}>
              Leading provider of vermicompost, organic fertilizers and natural crop protection
              solutions across India.
            </p>
            <div className="social-icons">
              <a href="#" aria-label="Facebook"><FiFacebook /></a>
              <a href="#" aria-label="Twitter"><FiTwitter /></a>
              <a href="#" aria-label="Instagram"><FiInstagram /></a>
              <a href="#" aria-label="YouTube"><FiYoutube /></a>
            </div>
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
                <a href="tel:+919355240503">+91 93552 40503</a>
              </li>
              <li>
                <span className="icon"><FiMail /></span>
                <a href="mailto:info@kgffarming.com">info@kgffarming.com</a>
              </li>
              <li>
                <span className="icon"><FiMapPin /></span>
                <span>
                  1133/3, Sheetal Puri Colony, Apollo Road, Jind 126102 — Near Madhur Milan
                  Hotel, Gali No. 03
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} Kamauput Growth Farming Pvt Ltd.</div>
          <div>Healthy Soil · Healthy Plants · Healthy Yield</div>
        </div>
      </div>
    </footer>
  )
}
