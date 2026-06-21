import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { BRAND } from '../constants/brand.js'

export default function TestimonialsSection() {
  const [items, setItems] = useState([])

  useEffect(() => {
    api.getTestimonials().then(setItems).catch(() => setItems([]))
  }, [])

  return (
    <section className="section">
      <div className="container" style={{ textAlign: 'center' }}>
        <span className="section-title-eyebrow">Our Testimonials</span>
        <h2 className="section-title">What they're talking?</h2>

        <div className="testimonials-grid" style={{ marginTop: 30 }}>
          {items.map((t) => (
            <div key={t.id} className="testimonial-card">
              <p>{t.message}</p>
              <div className="testimonial-person">
                <img src={t.avatar} alt={t.name} loading="lazy" />
                <div>
                  <h4>{t.name}</h4>
                  <span>{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="stats-banner">
          <div className="stats-banner-info">
            <span>{BRAND.fullName}</span>
            <h3>Vermi Composting · Happy Customers</h3>
          </div>
          <div className="stats-banner-info" style={{ textAlign: 'right' }}>
            <span>Contact us for more detail</span>
            <h3><a href="tel:+919355240503">+91 93552 40503</a></h3>
          </div>
        </div>
      </div>
    </section>
  )
}
