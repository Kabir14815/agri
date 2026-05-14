import { useState } from 'react'
import PageBanner from '../components/PageBanner.jsx'
import { api } from '../api.js'
import { FiMail, FiPhone, FiMapPin, FiClock } from 'react-icons/fi'

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      const res = await api.submitContact(form)
      setStatus({ type: 'success', text: res.message })
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageBanner title="Contact Us" />
      <section className="section">
        <div className="container">
          <div className="contact-grid">
            <aside className="contact-info">
              <h3>Get in touch</h3>
              <p>Have a question? Reach us at any of the channels below — we usually respond within one business day.</p>
              <ul>
                <li>
                  <span className="icon-circle"><FiMapPin /></span>
                  <div>
                    <small>Address</small>
                    NEW KRISHNA COLONY GALI NO 4, JIND HARYANA 126102
                  </div>
                </li>
                <li>
                  <span className="icon-circle"><FiMail /></span>
                  <div>
                    <small>Email</small>
                    info@kgffarming.com
                  </div>
                </li>
                <li>
                  <span className="icon-circle"><FiPhone /></span>
                  <div>
                    <small>Phone</small>
                    +91 11 6931 2730
                  </div>
                </li>
                <li>
                  <span className="icon-circle"><FiClock /></span>
                  <div>
                    <small>Hours</small>
                    Mon – Sat · 9:00 AM – 6:30 PM
                  </div>
                </li>
              </ul>
            </aside>

            <div className="form-card">
              <span className="section-title-eyebrow">Contact Form</span>
              <h2 className="section-title">Send us a message</h2>

              {status && (
                <div className={`form-message ${status.type}`}>{status.text}</div>
              )}

              <form onSubmit={onSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      className="form-control"
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={form.email}
                      onChange={onChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      className="form-control"
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Subject</label>
                    <input
                      className="form-control"
                      name="subject"
                      value={form.subject}
                      onChange={onChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Message *</label>
                  <textarea
                    className="form-control"
                    name="message"
                    value={form.message}
                    onChange={onChange}
                    required
                  />
                </div>

                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
