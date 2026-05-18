import { Link } from 'react-router-dom'

export default function AboutSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="about-grid">
          <div className="about-image">
            <img
              src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=900&q=80"
              alt="Vermicompost farming"
            />
            <div className="image-tag">Eco Farming</div>
          </div>
          <div>
            <span className="section-title-eyebrow">Introduction</span>
            <h2 className="section-title">
              Kamauput Growth Farming Pvt Ltd.
            </h2>
            <p>
              We specialise in high-quality vermicompost, organic fertilizers and natural crop
              protection — promoting eco-friendly farming that boosts soil fertility and crop
              yields across Haryana and beyond.
            </p>
            <p>
              Vermicompost is like black gold for your plants: a nutrient-rich organic fertilizer
              and soil conditioner made from decomposed organic matter with the help of earthworms
              and beneficial microorganisms.
            </p>
            <div className="about-tags">
              <div className="about-tag">
                <span>01</span>
                Indoor Vermicompost
              </div>
              <div className="about-tag">
                <span>02</span>
                Outdoor Vermicompost
              </div>
              <div className="about-tag">
                <span>03</span>
                Windrow & Trench Methods
              </div>
            </div>
            <Link to="/about" className="btn btn-primary">Discover More</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
