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
              Welcome to Kamauput Growth Farming Pvt Ltd. Leading provider of organic
              farming, vermicompost and crop protection solutions across India.
            </p>
            <div className="social-icons">
              <a href="#" aria-label="Facebook"><FiFacebook /></a>
              <a href="#" aria-label="Twitter"><FiTwitter /></a>
              <a href="#" aria-label="Instagram"><FiInstagram /></a>
              <a href="#" aria-label="YouTube"><FiYoutube /></a>
            </div>
          </div>

          <div>
            <h4>Explore</h4>
            <ul>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/why-us">Why Us</Link></li>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/admin/login">Admin Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4>News</h4>
            <div className="footer-news">
              <img
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&q=80"
                alt=""
              />
              <div>
                <small>KGF Farming</small>
                <div style={{ color: '#fff', fontSize: 14 }}>
                  Kamauput Growth Farming Pvt Ltd
                </div>
              </div>
            </div>
            <div className="footer-news">
              <img
                src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=200&q=80"
                alt=""
              />
              <div>
                <small>KGF Farming</small>
                <div style={{ color: '#fff', fontSize: 14 }}>
                  Kamauput Growth Farming Pvt Ltd
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4>Contact</h4>
            <ul className="footer-contact">
              <li>
                <span className="icon"><FiMail /></span>
                <a href="mailto:info@kgffarming.com">info@kgffarming.com</a>
              </li>
              <li>
                <span className="icon"><FiMapPin /></span>
                <span>NEW KRISHNA COLONY GALI NO 4, JIND HARYANA 126102</span>
              </li>
              <li>
                <span className="icon"><FiPhone /></span>
                <a href="tel:+911169312730">+91 11 6931 2730</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© Copyright 2026 by www.kgffarming.com</div>
          <div>info@kgffarming.in</div>
        </div>
      </div>
    </footer>
  )
}
