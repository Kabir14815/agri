import { useEffect, useState } from 'react'
import { api } from '../api.js'

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
    <section className="section section-soft">
      <div className="container" style={{ textAlign: 'center' }}>
        <span className="section-title-eyebrow">Categories</span>
        <h2 className="section-title">Our Products</h2>

        <div className="product-categories">
          <button
            className={`cat-pill ${active === 'ALL' ? 'active' : ''}`}
            onClick={() => setActive('ALL')}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={`cat-pill ${active === c ? 'active' : ''}`}
              onClick={() => setActive(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Loading products…</p>
        ) : (
          <div className="grid grid-4">
            {filtered.map((p) => (
              <article key={p.id} className="product-card">
                <div className="product-image">
                  {p.discount > 0 && <span className="sale-badge">Sale</span>}
                  <img src={p.image} alt={p.name} loading="lazy" />
                </div>
                <div className="product-body">
                  <h4>{p.name}</h4>
                  <div className="product-prices">
                    {p.original_price !== p.price && (
                      <span className="price-old">₹{p.original_price}</span>
                    )}
                    <span className="price-new">₹{p.price}</span>
                  </div>
                  <div className="product-discount">
                    Discount: {p.discount}%
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
