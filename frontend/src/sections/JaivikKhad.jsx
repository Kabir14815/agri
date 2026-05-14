import { Link } from 'react-router-dom'

export default function JaivikKhad() {
  return (
    <section className="section">
      <div className="container">
        <div className="about-content">
          <div>
            <span className="section-title-eyebrow">Jaivik Khad</span>
            <h2 className="section-title">
              Jaivik khad, or organic fertilizer, is derived from organic sources.
            </h2>
            <p>
              It is an eco-friendly alternative to chemical fertilizers. Organic
              fertilizers improve soil health and structure. They enhance the
              water-holding capacity of the soil. Jaivik khad is rich in essential
              nutrients for plant growth. Nutrients in organic fertilizers are
              released slowly, promoting long-term plant health.
            </p>
            <p>
              They do not harm beneficial soil microorganisms. Organic fertilizers
              reduce the risk of soil and water pollution. These fertilizers are safe
              for human and animal health. Jaivik khad includes materials like
              compost, bone meal, and fish emulsion.
            </p>
            <Link to="/services" className="btn btn-primary">Discover More</Link>
          </div>
          <img
            src="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=900&q=80"
            alt="Jaivik Khad"
          />
        </div>
      </div>
    </section>
  )
}
