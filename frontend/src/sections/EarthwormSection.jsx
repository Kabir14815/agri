import { Link } from 'react-router-dom'
import { BRAND } from '../constants/brand.js'

export default function EarthwormSection() {
  return (
    <section className="section section-soft">
      <div className="container">
        <div className="about-content">
          <img
            src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=900&q=80"
            alt="Earthworm"
            loading="lazy"
            decoding="async"
            width={900}
            height={600}
          />
          <div>
            <span className="section-title-eyebrow">{BRAND.shortName}</span>
            <h2 className="section-title">Earthworm (Kechua)</h2>
            <p>
              Earthworms are voracious eaters, consuming organic matter like dead
              leaves, decaying plants, and other detritus. They digest this organic
              material and excrete it as nutrient-rich castings, also known as worm
              poop. These castings are packed with essential nutrients, making them
              an excellent natural fertilizer.
            </p>
            <p>
              Earthworms are also ecosystem engineers. Their burrowing activities
              mix and incorporate organic matter into the soil, leading to improved
              soil structure and microbial activity. This benefits the entire food
              web in the soil.
            </p>
            <div className="earthworm-price-tag">
              <span className="earthworm-price-label">Kechua Buying Price</span>
              <span className="earthworm-price-value">₹5 <small>/ kg</small></span>
            </div>
            <Link to="/about" className="btn btn-primary">Discover More</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
