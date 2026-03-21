import CallToAction from "@/components/call-to-action"
import FAQSection from "@/components/faq-section"
import FeaturesSection from "@/components/features-section"
import Footer from "@/components/footer"
import HeroSection from "@/components/hero-section"
import ScreenshotsSection from "@/components/screenshots-section"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <HeroSection />
      <FeaturesSection />
      <ScreenshotsSection />
      <FAQSection />
      <CallToAction />

      <Footer />
    </div>
  )
}
