import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageBanner from '../components/PageBanner.jsx'
import { api } from '../api.js'
import { BRAND } from '../constants/brand.js'

export default function BlogDetail() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getBlogPost(id).then(setPost).catch((e) => setError(e.message))
  }, [id])

  if (error) {
    return (
      <>
        <PageBanner title="Article" />
        <section className="section">
          <div className="container">
            <p>{error}</p>
            <Link to="/blog" className="btn btn-primary">Back to Blog</Link>
          </div>
        </section>
      </>
    )
  }

  if (!post) {
    return (
      <section className="section">
        <div className="container">Loading…</div>
      </section>
    )
  }

  return (
    <>
      <PageBanner title={post.title} current="Blog" />
      <section className="section">
        <div className="container" style={{ maxWidth: 880 }}>
          <div className="blog-meta">{post.date} · {post.author}</div>
          <img src={post.image} alt={post.title} loading="lazy" style={{ borderRadius: 16, marginBottom: 24 }} />
          <p>{post.excerpt}</p>
          <p>
            At {BRAND.name} we believe that healthy soil makes healthy crops. Whether
            it's our 100% organic vermicompost, eco-friendly insecticides or unique
            growth boosters, every product we develop is designed to help Indian
            farmers grow more — sustainably.
          </p>
          <Link to="/blog" className="btn btn-outline">← Back to Blog</Link>
        </div>
      </section>
    </>
  )
}
