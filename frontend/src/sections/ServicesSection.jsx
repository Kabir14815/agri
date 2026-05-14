import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

export default function ServicesSection() {
  const [services, setServices] = useState([])

  useEffect(() => {
    api.getServices().then(setServices).catch(() => {})
  }, [])

  return (
    <section className="section">
      <div className="container" style={{ textAlign: 'center' }}>
        <span className="section-title-eyebrow">What we're doing</span>
        <h2 className="section-title">Services We're offering</h2>
        <p style={{ maxWidth: 640, margin: '0 auto 40px' }}>
          We provide end-to-end farming and crop protection solutions backed by
          decades of agricultural expertise.
        </p>

        <div className="grid grid-3">
          {services.map((s) => (
            <article key={s.id} className="service-card">
              <div className="service-image">
                <img src={s.image} alt={s.title} loading="lazy" />
              </div>
              <div className="service-body">
                <div className="service-number">{s.number}</div>
                <div className="service-subtitle">{s.subtitle}</div>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
                <Link to="/services" className="btn btn-outline" style={{ padding: '8px 18px' }}>
                  More Detail
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
