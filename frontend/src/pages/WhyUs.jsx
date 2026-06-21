import PageBanner from '../components/PageBanner.jsx'
import FeatureStrip from '../sections/FeatureStrip.jsx'
import BenefitsSection from '../sections/BenefitsSection.jsx'
import FaqSection from '../sections/FaqSection.jsx'
import { BRAND } from '../constants/brand.js'

export default function WhyUs() {
  return (
    <>
      <PageBanner title="Why Choose Us" />
      <section className="section">
        <div className="container">
          <span className="section-title-eyebrow">Our Benefits</span>
          <h2 className="section-title">
            We blend tradition with modern science for sustainable agriculture.
          </h2>
          <p style={{ maxWidth: 760 }}>
            From soil enrichment to crop protection, {BRAND.name} offers complete
            organic solutions that deliver real results — without harming the
            environment. Our products are trusted by thousands of farmers across
            India.
          </p>
        </div>
      </section>
      <FeatureStrip />
      <BenefitsSection />
      <FaqSection />
    </>
  )
}
