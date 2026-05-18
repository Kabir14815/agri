import { FiMail, FiPhone } from 'react-icons/fi'

export default function TopBar() {
  return (
    <div className="top-bar">
      <div className="container top-bar-inner">
        <span className="top-bar-tag">Vermicompost powered plant boost!</span>
        <div className="top-bar-links">
          <a href="tel:+919355240503">
            <FiPhone /> +91 93552 40503
          </a>
          <a href="mailto:info@kgffarming.com">
            <FiMail /> info@kgffarming.com
          </a>
        </div>
      </div>
    </div>
  )
}
