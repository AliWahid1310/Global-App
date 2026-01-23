"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Typewriter } from "@/components/ui/Typewriter";
import { FloatingCards } from "@/components/ui/FloatingCards";
import { useEffect, useState } from "react";

export function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Main Hero - Takes full viewport */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-radial from-accent-900/20 via-dark-950 to-dark-950" />
        
        {/* Floating cards */}
        <FloatingCards />

        {/* Noise overlay */}
        <div className="noise-overlay" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col justify-center">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full mx-auto mb-12 transition-all duration-700 border border-accent-500/30 bg-accent-500/10 backdrop-blur-sm shadow-lg shadow-accent-500/10 ${
              mounted ? "opacity-100 translate-y-0 animate-pulse-soft" : "opacity-0 translate-y-4"
            }`}
          >
            <Sparkles className="w-4 h-4 text-accent-400 animate-pulse" />
            <span className="text-sm text-accent-300 font-medium tracking-wide">The future of student communities</span>
            <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
          </div>

          {/* Main headline */}
          <h1
            className={`font-display text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 transition-all duration-700 delay-100 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="text-white">Student societies.</span>
            <br />
            <span className="gradient-text">But finally done right.</span>
          </h1>

          {/* Subheadline with typewriter */}
          <div
            className={`text-xl sm:text-2xl text-dark-200 mb-6 h-14 flex items-center justify-center transition-all duration-700 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Typewriter
              texts={[
                "No numbers. No chaos. No boredom.",
                "Just vibes. Just community. Just you.",
                "Connect. Create. Belong.",
              ]}
              speed={60}
              pauseDuration={3000}
              className="text-dark-100"
            />
          </div>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center mt-10 transition-all duration-700 delay-300 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Link
              href="/societies"
              className="group relative inline-flex items-center justify-center gap-2 px-10 py-4 bg-accent-500 text-white font-semibold rounded-2xl btn-glow overflow-hidden text-lg"
            >
              <span className="relative z-10">Enter Circl</span>
              <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 glass-light text-white font-semibold rounded-2xl hover:bg-white/10 transition-all text-lg"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section - Below the fold */}
      <section className="relative py-20 bg-dark-950">
        {/* Top gradient blend */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-dark-950 to-transparent" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8">
            {[
              { value: "50+", label: "Societies" },
              { value: "2.5K", label: "Students" },
              { value: "100+", label: "Events" },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="text-4xl sm:text-5xl font-bold text-white mb-2 group-hover:text-accent-400 transition-colors">
                  {stat.value}
                </div>
                <div className="text-sm sm:text-base text-dark-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
