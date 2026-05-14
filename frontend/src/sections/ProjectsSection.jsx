import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

export default function ProjectsSection() {
  const [items, setItems] = useState([])

  useEffect(() => {
    api.getProjects().then(setItems).catch(() => {})
  }, [])

  return (
    <section className="section section-soft">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <span className="section-title-eyebrow">Our Latest Projects</span>
          <h2 className="section-title">Latest Projects</h2>
        </div>

        <div className="projects-grid">
          {items.map((p) => (
            <div key={p.id} className="project-card">
              <img src={p.image} alt={p.title} loading="lazy" />
              <div className="project-overlay">
                <h4>{p.title}</h4>
              </div>
            </div>
          ))}
        </div>

        <div className="cta-banner" style={{ marginTop: 60, borderRadius: 22 }}>
          <h2>We're popular leader in Agriculture & Future need market.</h2>
          <Link to="/contact" className="btn btn-light">More Detail</Link>
        </div>
      </div>
    </section>
  )
}
