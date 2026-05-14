import { useEffect, useState } from 'react'
import PageBanner from '../components/PageBanner.jsx'
import { api } from '../api.js'

export default function Achievers() {
  const [items, setItems] = useState([])

  useEffect(() => {
    api.getAchievers().then(setItems).catch(() => {})
  }, [])

  return (
    <>
      <PageBanner title="Achievers" />
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span className="section-title-eyebrow">Our Stars</span>
            <h2 className="section-title">Meet our top achievers</h2>
            <p style={{ maxWidth: 700, margin: '0 auto' }}>
              The hard work and dedication of our partners is the foundation of KGF
              Farming's success. We're proud to celebrate them here.
            </p>
          </div>

          <div className="grid grid-3">
            {items.map((a) => (
              <article key={a.id} className="achiever-card">
                <img src={a.avatar} alt={a.name} loading="lazy" />
                <div className="achiever-body">
                  <small>{a.title}</small>
                  <h4>{a.name}</h4>
                  <span>{a.location}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
