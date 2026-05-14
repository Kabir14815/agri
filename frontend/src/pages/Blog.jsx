import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageBanner from '../components/PageBanner.jsx'
import { api } from '../api.js'

export default function Blog() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    api.getBlog().then(setPosts).catch(() => {})
  }, [])

  return (
    <>
      <PageBanner title="Blog" />
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span className="section-title-eyebrow">Latest Articles</span>
            <h2 className="section-title">From our blog</h2>
          </div>

          <div className="grid grid-3">
            {posts.map((p) => (
              <article key={p.id} className="blog-card">
                <div className="blog-image">
                  <img src={p.image} alt={p.title} loading="lazy" />
                </div>
                <div className="blog-body">
                  <div className="blog-meta">
                    {p.date} · {p.author}
                  </div>
                  <h3>{p.title}</h3>
                  <p>{p.excerpt}</p>
                  <Link to={`/blog/${p.id}`} className="btn btn-outline" style={{ padding: '8px 18px' }}>
                    Read More
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
