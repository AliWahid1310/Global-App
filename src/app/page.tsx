import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <div className="bg-dark-950 min-h-screen">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Hero */}
      <HeroSection />

      {/* Features */}
      <FeaturesSection />

      {/* CTA */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
