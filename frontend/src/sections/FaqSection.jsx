import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { FiPlus, FiMinus } from 'react-icons/fi'

export default function FaqSection() {
  const [faqs, setFaqs] = useState([])
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    api.getFaqs().then((data) => {
      setFaqs(data)
      if (data[0]) setOpenId(data[0].id)
    }).catch(() => {})
  }, [])

  return (
    <section className="section section-soft">
      <div className="container">
        <div className="faq-grid">
          <div className="faq-list">
            <span className="section-title-eyebrow">Frequently Asked Questions</span>
            <h2 className="section-title">How can we help you?</h2>
            <p>
              We answer the most common questions about our products and services.
              Get in touch if you don't find your answer below.
            </p>
            <ul>
              <li>Vermicomposting</li>
              <li>Increases the fertility</li>
              <li>Water-resistance of the soil</li>
              <li>Helps in germination</li>
              <li>Plant growth</li>
            </ul>
          </div>

          <div>
            {faqs.map((f) => {
              const isOpen = openId === f.id
              return (
                <div key={f.id} className={`faq-item ${isOpen ? 'open' : ''}`}>
                  <button
                    className="faq-question"
                    onClick={() => setOpenId(isOpen ? null : f.id)}
                  >
                    {f.question}
                    <span className="faq-toggle">
                      {isOpen ? <FiMinus /> : <FiPlus />}
                    </span>
                  </button>
                  {isOpen && <div className="faq-answer">{f.answer}</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
