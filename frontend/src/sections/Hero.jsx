import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero-content">
        <div className="hero-eyebrow">Welcome to KGF Farming</div>
        <h1>
          Agriculture &<br /> Pure Eco Farming
        </h1>
        <p>
          Kamauput Growth Farming Pvt Ltd. – your trusted partner in vermicomposting,
          organic fertilizers and natural crop protection. Building a sustainable
          future for Indian agriculture.
        </p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Link to="/about" className="btn btn-primary">Discover More</Link>
          <Link to="/contact" className="btn btn-light">Contact Us</Link>
        </div>
      </div>
    </section>
  )
}
