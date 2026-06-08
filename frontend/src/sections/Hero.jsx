import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const SLIDES = [
  {
    eyebrow: 'High Quality Vermicompost',
    title: 'Vermicompost — black gold for your plants',
    text: "Nutrient-rich organic fertilizer and soil conditioner made from decomposed organic matter — powered by Kamauput Growth Farming.",
    cta: 'Join Now',
    ctaTo: '/register',
    ctaIsAnchor: false,
  },
  {
    eyebrow: 'Organic Crop Protection',
    title: 'Natural products for healthier yields',
    text: 'Bio-insecticides, growth boosters and soil care solutions — safe for crops, farmers and the environment.',
    cta: 'View Products',
    ctaTo: '/#products',
    ctaIsAnchor: true,
  },
]

export default function Hero() {
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 6000)
    return () => clearInterval(t)
  }, [])

  const current = SLIDES[slide]

  return (
    <section className="hero">
      <div className="hero-overlay" />
      <div className="container hero-layout">
        <div className="hero-content">
          <div className="hero-eyebrow">{current.eyebrow}</div>
          <h1>{current.title}</h1>
          <p>{current.text}</p>
          <div className="hero-actions">
            {current.ctaIsAnchor ? (
              <a href={current.ctaTo} className="btn btn-accent">
                {current.cta}
              </a>
            ) : (
              <Link to={current.ctaTo} className="btn btn-accent">
                {current.cta}
              </Link>
            )}
            <Link to="/contact" className="btn btn-light">
              Contact Us
            </Link>
          </div>
          <div className="hero-dots">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`hero-dot ${i === slide ? 'active' : ''}`}
                onClick={() => setSlide(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="hero-side-card">
          <div className="hero-side-card-inner">
            <span className="hero-side-badge">100% Organic</span>
            <h3>Vermicompost powered plant boost!</h3>
            <p>
              Rich in N, P, K and beneficial microorganisms — improves soil fertility,
              water retention and crop quality.
            </p>
            <ul className="hero-stats">
              <li>
                <strong>50+</strong>
                <span>Crop types</span>
              </li>
              <li>
                <strong>8+</strong>
                <span>Product range</span>
              </li>
              <li>
                <strong>100%</strong>
                <span>Eco-friendly</span>
              </li>
            </ul>
            <Link to="/register" className="btn btn-primary" style={{ width: '100%' }}>
              Register Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
