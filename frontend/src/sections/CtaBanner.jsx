import { Link } from 'react-router-dom'
import { BRAND } from '../constants/brand.js'

export default function CtaBanner() {
  return (
    <section className="cta-banner">
      <div className="container cta-banner-inner">
        <div>
          <span className="cta-banner-eyebrow">Join {BRAND.name}</span>
          <h2>High quality vermicompost & organic crop care</h2>
          <p>
            Register today to partner with {BRAND.fullName} — eco-friendly products,
            expert support and sustainable solutions for your farm.
          </p>
        </div>
        <div className="cta-banner-actions">
          <Link to="/register" className="btn btn-accent">Join Now</Link>
          <Link to="/contact" className="btn btn-light">Contact Us</Link>
        </div>
      </div>
    </section>
  )
}
