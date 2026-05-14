import PageBanner from '../components/PageBanner.jsx'
import AboutSection from '../sections/AboutSection.jsx'
import JaivikKhad from '../sections/JaivikKhad.jsx'
import EarthwormSection from '../sections/EarthwormSection.jsx'
import TestimonialsSection from '../sections/TestimonialsSection.jsx'

export default function About() {
  return (
    <>
      <PageBanner title="About Us" />
      <AboutSection />
      <JaivikKhad />
      <EarthwormSection />
      <TestimonialsSection />
    </>
  )
}
