import { Link } from 'react-router-dom'
import { FiCheckCircle } from 'react-icons/fi'

const NUTRIENTS = [
  { symbol: 'N', label: 'Nitrogen', desc: 'Leaf growth & chlorophyll' },
  { symbol: 'P', label: 'Phosphorus', desc: 'Roots & flowering' },
  { symbol: 'K', label: 'Potassium', desc: 'Fruit quality & strength' },
  { symbol: 'Mg', label: 'Magnesium', desc: 'Photosynthesis support' },
  { symbol: 'Ca', label: 'Calcium', desc: 'Cell wall structure' },
  { symbol: 'Fe', label: 'Iron', desc: 'Enzyme activation' },
]

export default function NutrientsSection() {
  return (
    <section className="section section-soft nutrients-section">
      <div className="container">
        <div className="nutrients-grid">
          <div>
            <span className="section-title-eyebrow">Microorganisms</span>
            <h2 className="section-title">Beneficial bacteria break down organic matter</h2>
            <p>
              Beneficial bacteria and microorganisms play a crucial role in breaking down
              organic matter into simpler forms that plants can absorb — the foundation of
              healthy vermicompost and living soil.
            </p>
            <ul className="check-list">
              <li><FiCheckCircle /> Improves soil structure & porosity</li>
              <li><FiCheckCircle /> Boosts water-holding capacity</li>
              <li><FiCheckCircle /> Supports germination & crop yield</li>
            </ul>
          </div>
          <div>
            <span className="section-title-eyebrow">Nutrients</span>
            <h2 className="section-title">Essential elements for plant growth</h2>
            <p>
              Vermicompost and our organic range are rich in nitrogen, phosphorus, potassium,
              magnesium and trace elements — nature&apos;s complete nutrition package.
            </p>
            <div className="nutrient-pills">
              {NUTRIENTS.map((n) => (
                <div key={n.symbol} className="nutrient-pill" title={n.desc}>
                  <strong>{n.symbol}</strong>
                  <span>{n.label}</span>
                </div>
              ))}
            </div>
            <Link to="/why-us" className="btn btn-primary" style={{ marginTop: 24 }}>
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
