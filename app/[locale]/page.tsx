import Hero from '@/components/sections/Hero'
import TrustBand from '@/components/sections/TrustBand'
import FeaturedProperties from '@/components/sections/FeaturedProperties'
import GallerySlider from '@/components/sections/GallerySlider'
import Services from '@/components/sections/Services'
import CTASection from '@/components/sections/CTASection'

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBand />
      <FeaturedProperties />
      <GallerySlider />
      <Services />
      <CTASection />
    </>
  )
}
