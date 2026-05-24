import { FiMail, FiPhone } from 'react-icons/fi'
import { useCompany } from '../context/CompanyContext.jsx'

export default function TopBar() {
  const { company } = useCompany()
  const phone = company.phone?.replace(/\s/g, '') || '+919355240503'
  const tel = phone.startsWith('+') ? phone : `+${phone}`

  return (
    <div className="top-bar">
      <div className="container top-bar-inner">
        <span className="top-bar-tag">{company.tagline || 'Vermicompost powered plant boost!'}</span>
        <div className="top-bar-links">
          <a href={`tel:${tel}`}>
            <FiPhone /> {company.phone}
          </a>
          <a href={`mailto:${company.email}`}>
            <FiMail /> {company.email}
          </a>
        </div>
      </div>
    </div>
  )
}
