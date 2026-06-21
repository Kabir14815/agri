import { useEffect, useState } from 'react'
import PageBanner from '../components/PageBanner.jsx'
import { api } from '../api.js'
import { BRAND } from '../constants/brand.js'

export default function Achievers() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    api.getAchievers().then(setItems).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <>
      <PageBanner title="Achievers" />
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span className="section-title-eyebrow">Our Stars</span>
            <h2 className="section-title">Meet our top achievers</h2>
            <p style={{ maxWidth: 700, margin: '0 auto' }}>
              The hard work and dedication of our partners is the foundation of {BRAND.name}&apos;s
              success. We&apos;re proud to celebrate them here.
            </p>
          </div>

          {loading ? (
            <p className="text-center">Loading achievers…</p>
          ) : error ? (
            <div className="text-center">
              <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>
              <button type="button" className="btn btn-outline" onClick={load}>Try again</button>
            </div>
          ) : items.length === 0 ? (
            <p className="text-center" style={{ color: 'var(--color-muted)' }}>No achievers to display yet.</p>
          ) : (
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
          )}
        </div>
      </section>
    </>
  )
}
