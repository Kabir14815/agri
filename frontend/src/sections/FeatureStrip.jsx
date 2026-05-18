import { FiActivity, FiDroplet, FiShield, FiTruck } from 'react-icons/fi'

const FEATURES = [
  {
    icon: <FiActivity />,
    title: 'Microorganisms',
    text: 'Beneficial bacteria for living soil',
  },
  {
    icon: <FiDroplet />,
    title: 'Rich Nutrients',
    text: 'N, P, K, Mg & trace elements',
  },
  {
    icon: <FiShield />,
    title: '100% Organic',
    text: 'Safe for crops & environment',
  },
  {
    icon: <FiTruck />,
    title: 'We Deliver',
    text: 'Pan-India partner network',
  },
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
