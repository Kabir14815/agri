import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

function truncate(text, len = 90) {
  if (!text || text.length <= len) return text
  return `${text.slice(0, len).trim()}…`
}

export default function ProductsSection() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [active, setActive] = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getProducts(), api.getCategories()])
      .then(([prods, cats]) => {
        setProducts(prods)
        setCategories(cats)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered =
    active === 'ALL'
      ? products
      : products.filter((p) => p.category.toUpperCase() === active)

  return (
    <section className="section section-soft" id="products">
      <div className="container">
        <div className="section-head-center">
          <span className="section-title-eyebrow">Our Products</span>
          <h2 className="section-title">High quality organic crop care</h2>
          <p className="section-lead">
            Vermicompost, bio-insecticides, growth boosters and soil solutions — browse our
            catalogue and enquire for pricing.
          </p>
        </div>

        <div className="product-categories">
          <button
            type="button"
            className={`cat-pill ${active === 'ALL' ? 'active' : ''}`}
            onClick={() => setActive('ALL')}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`cat-pill ${active === c ? 'active' : ''}`}
              onClick={() => setActive(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center">Loading products…</p>
        ) : (
          <div className="grid grid-4 product-grid">
            {filtered.map((p) => (
              <article key={p.id} className="product-card">
                <div className="product-image">
                  {p.discount > 0 && <span className="sale-badge">Sale</span>}
                  <span className="product-cat-badge">{p.category}</span>
                  <img src={p.image} alt={p.name} loading="lazy" />
                </div>
                <div className="product-body">
                  <h4>{p.name}</h4>
                  <p className="product-desc">{truncate(p.description)}</p>
                  <div className="product-prices">
                    {p.original_price !== p.price && (
                      <span className="price-old">₹{p.original_price}</span>
                    )}
                    <span className="price-new">₹{p.price}</span>
                  </div>
                  {p.discount > 0 && (
                    <div className="product-discount">Save {p.discount}%</div>
                  )}
                  <Link to="/contact" className="btn btn-outline product-enquire">
                    Enquire Now
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
