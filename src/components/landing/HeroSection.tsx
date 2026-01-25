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

      {/* Trusted By Section - Universities */}
      <section className="relative py-24 mt-12 bg-dark-950 overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          {/* Header with animation */}
          <div 
            className={`text-center mb-12 transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "400ms" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
              <span className="text-xs text-accent-300 font-medium uppercase tracking-wider">Trusted Platform</span>
            </div>
            <p className="text-dark-300 text-lg">
              Empowering students across <span className="text-white font-semibold">top universities</span>
            </p>
          </div>
          
          {/* University marquee with glass effect */}
          <div 
            className={`relative transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "500ms" }}
          >
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-dark-950 to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-dark-950 to-transparent z-10" />
            
            <div className="glass rounded-2xl py-6 px-4 overflow-hidden">
              <div className="flex animate-scroll gap-16 items-center">
                {[
                  "Air University",
                  "NUST",
                  "FAST-NUCES",
                  "COMSATS",
                  "LUMS",
                  "IBA Karachi",
                  "GIKI",
                  "PIEAS",
                  "UET Lahore",
                  "SZABIST",
                  "Air University",
                  "NUST",
                  "FAST-NUCES",
                  "COMSATS",
                  "LUMS",
                  "IBA Karachi",
                ].map((uni, i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-3 whitespace-nowrap group cursor-default"
                  >
                    <div className="w-10 h-10 rounded-xl bg-dark-700/50 flex items-center justify-center group-hover:bg-accent-500/20 transition-colors">
                      <span className="text-xl">🎓</span>
                    </div>
                    <span className="text-dark-200 text-base font-semibold group-hover:text-accent-400 transition-colors">
                      {uni}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Add CSS for scroll animation */}
        <style jsx>{`
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .animate-scroll {
            animation: scroll 30s linear infinite;
          }
          .animate-scroll:hover {
            animation-play-state: paused;
          }
        `}</style>
      </section>
    </>
  );
}
