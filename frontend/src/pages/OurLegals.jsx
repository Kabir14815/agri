import PageBanner from '../components/PageBanner.jsx'

const LEGALS = [
  {
    title: 'Company Registration',
    detail: 'Kamauput Growth Farming Pvt. Ltd. is incorporated under the Companies Act, 2013.',
  },
  {
    title: 'GST Registration',
    detail: 'Registered taxpayer providing organic farming products across India.',
  },
  {
    title: 'MSME / Udyam',
    detail: 'Registered as a Micro, Small and Medium Enterprise contributing to local agriculture.',
  },
  {
    title: 'FSSAI / Organic Certification',
    detail: 'Compliant with FSSAI standards for organic agricultural produce.',
  },
  {
    title: 'ISO Certification',
    detail: 'ISO 9001:2015 certified for quality management.',
  },
  {
    title: 'Trademark',
    detail: 'KGF Farming™ is a registered trademark of Kamauput Growth Farming Pvt. Ltd.',
  },
]

export default function OurLegals() {
  return (
    <>
      <PageBanner title="Our Legals" current="About / Our Legals" />
      <section className="section">
        <div className="container">
          <span className="section-title-eyebrow">Compliance</span>
          <h2 className="section-title">Trusted, certified & compliant.</h2>
          <p style={{ maxWidth: 720 }}>
            We are proud to comply with all government and industry regulations
            relevant to organic farming and crop protection in India.
          </p>
          <div className="grid grid-3" style={{ marginTop: 30 }}>
            {LEGALS.map((l) => (
              <div className="legal-card" key={l.title}>
                <h3>{l.title}</h3>
                <p>{l.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
