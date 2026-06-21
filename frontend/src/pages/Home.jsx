import { lazy, Suspense } from 'react'
import Hero from '../sections/Hero.jsx'
import FeatureStrip from '../sections/FeatureStrip.jsx'
import HighlightsSection from '../sections/HighlightsSection.jsx'

const AboutSection = lazy(() => import('../sections/AboutSection.jsx'))
const NutrientsSection = lazy(() => import('../sections/NutrientsSection.jsx'))
const ProductsSection = lazy(() => import('../sections/ProductsSection.jsx'))
const CtaBanner = lazy(() => import('../sections/CtaBanner.jsx'))
const JaivikKhad = lazy(() => import('../sections/JaivikKhad.jsx'))
const EarthwormSection = lazy(() => import('../sections/EarthwormSection.jsx'))
const ServicesSection = lazy(() => import('../sections/ServicesSection.jsx'))
const BenefitsSection = lazy(() => import('../sections/BenefitsSection.jsx'))
const FaqSection = lazy(() => import('../sections/FaqSection.jsx'))
const TestimonialsSection = lazy(() => import('../sections/TestimonialsSection.jsx'))
const ProjectsSection = lazy(() => import('../sections/ProjectsSection.jsx'))

export default function Home() {
  return (
    <>
      <Hero />
      <FeatureStrip />
      <HighlightsSection />
      <Suspense fallback={null}>
        <AboutSection />
        <NutrientsSection />
        <ProductsSection />
        <CtaBanner />
        <JaivikKhad />
        <EarthwormSection />
        <ServicesSection />
        <BenefitsSection />
        <FaqSection />
        <TestimonialsSection />
        <ProjectsSection />
      </Suspense>
    </>
  )
}
