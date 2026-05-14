import PageBanner from '../components/PageBanner.jsx'
import ServicesSection from '../sections/ServicesSection.jsx'
import BenefitsSection from '../sections/BenefitsSection.jsx'
import ProductsSection from '../sections/ProductsSection.jsx'

export default function Services() {
  return (
    <>
      <PageBanner title="Our Services" />
      <ServicesSection />
      <BenefitsSection />
      <ProductsSection />
    </>
  )
}
