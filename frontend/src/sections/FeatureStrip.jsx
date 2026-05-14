import { FiCpu, FiUsers, FiAward, FiTruck } from 'react-icons/fi'

const FEATURES = [
  { icon: <FiCpu />, title: 'Technology', text: "We've been using tech" },
  { icon: <FiUsers />, title: 'Best Farmers', text: 'Skilled team of farmers' },
  { icon: <FiAward />, title: "We're Certified", text: 'Certified market leader' },
  { icon: <FiTruck />, title: 'We Deliver', text: 'We deliver everywhere' },
]

export default function FeatureStrip() {
  return (
    <section className="feature-strip">
      <div className="container">
        <div className="grid grid-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-item">
              <span className="feature-icon">{f.icon}</span>
              <div>
                <h4>{f.title}</h4>
                <p>{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
