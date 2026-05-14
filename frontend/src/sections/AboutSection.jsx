import { Link } from 'react-router-dom'

export default function AboutSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="about-grid">
          <div className="about-image">
            <img
              src="https://images.unsplash.com/photo-1592982537447-7440770faae9?w=900&q=80"
              alt="Farming"
            />
            <div className="image-tag">25+ Years</div>
          </div>
          <div>
            <span className="section-title-eyebrow">Welcome to KGF Farming</span>
            <h2 className="section-title">
              We're Leading Agriculture future need market
            </h2>
            <p>
              Vermicomposting is the process by which worms are used to convert
              organic materials (usually wastes) into a humus-like material known as
              vermin-compost.
            </p>
            <div className="about-tags">
              <div className="about-tag">
                <span>01</span>
                Home Geneity Capacity
              </div>
              <div className="about-tag">
                <span>02</span>
                High Porosity Capacity
              </div>
              <div className="about-tag">
                <span>03</span>
                High Water Holding Capacity
              </div>
            </div>
            <Link to="/about" className="btn btn-primary">Discover More</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
