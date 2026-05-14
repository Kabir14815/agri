import { Link } from 'react-router-dom'

export default function BenefitsSection() {
  return (
    <section className="section benefits">
      <div className="container">
        <span className="section-title-eyebrow" style={{ color: '#9be39a' }}>
          Our Benefits
        </span>
        <h2>Improves the physical structure of the soil</h2>
        <p>
          Vermicomposting increases the fertility and water-resistance of the soil.
          Helps in germination, plant growth, and crop yield. Nurtures soil with
          plant growth hormones such as auxins, gibberellic acid, etc. Vermicompost
          is the product of the decomposition process using various species of
          worms, usually red wigglers and white worms.
        </p>
        <Link to="/why-us" className="btn btn-light">Discover More</Link>
      </div>
    </section>
  )
}
