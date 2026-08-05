import CallToAction from "@/components/call-to-action"
import FAQSection from "@/components/faq-section"
import FeaturesSection from "@/components/features-section"
import Footer from "@/components/footer"
import HeroSection from "@/components/hero-section"
import ScreenshotsSection from "@/components/screenshots-section"

export default function HomePage() {
  return (
    <div className="bg-canvas min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <ScreenshotsSection />
      <FAQSection />
      <CallToAction />

      <Footer />
    </div>
  )
}
