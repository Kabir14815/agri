import { Link } from 'react-router-dom'
import { FiDroplet, FiLayers, FiSun, FiActivity } from 'react-icons/fi'

const HIGHLIGHTS = [
  {
    icon: <FiLayers />,
    title: 'Vermicompost',
    text: "Black gold for your plants — nutrient-rich organic fertilizer and soil conditioner from decomposed organic matter.",
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80',
  },
  {
    icon: <FiDroplet />,
    title: 'Organic Compost',
    text: 'Turn kitchen scraps and farm waste into a nutrient-rich goldmine for healthier soil and stronger crops.',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80',
  },
  {
    icon: <FiSun />,
    title: 'Organic Farming',
    text: 'Crop rotation, companion planting and natural inputs — cultivating without synthetic pesticides or fertilizers.',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80',
  },
  {
    icon: <FiActivity />,
    title: 'Liquid Plant Manures',
    text: 'Nutrient-rich brews from compost, seaweed and natural sources — easily absorbed for faster plant health.',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&q=80',
  },
]

export default function HighlightsSection() {
  return (
    <section className="section highlights-section">
      <div className="container">
        <div className="section-head-center">
          <span className="section-title-eyebrow">Highlights</span>
          <h2 className="section-title">Sustainable solutions for modern farming</h2>
          <p className="section-lead">
            Inspired by nature-first agriculture — vermicompost, organic inputs and crop care
            products trusted by farmers across India.
          </p>
        </div>
        <div className="grid grid-4 highlight-grid">
          {HIGHLIGHTS.map((h) => (
            <article key={h.title} className="highlight-card">
              <div className="highlight-card-image">
                <img src={h.image} alt={h.title} loading="lazy" />
                <span className="highlight-card-icon">{h.icon}</span>
              </div>
              <div className="highlight-card-body">
                <h3>{h.title}</h3>
                <p>{h.text}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="section-cta-center">
          <Link to="/register" className="btn btn-primary">Register Now</Link>
        </div>
      </div>
    </section>
  )
}
