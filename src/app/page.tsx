import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="bg-dark-950 min-h-screen">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Hero */}
      <HeroSection isLoggedIn={!!user} />

      {/* Features */}
      <FeaturesSection />

      {/* CTA */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
