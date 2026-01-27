"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, LayoutDashboard } from "lucide-react";
import { Typewriter } from "@/components/ui/Typewriter";
import { FloatingCards } from "@/components/ui/FloatingCards";
import { useEffect, useState } from "react";

interface HeroSectionProps {
  isLoggedIn?: boolean;
}

export function HeroSection({ isLoggedIn = false }: HeroSectionProps) {
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
            
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 glass-light text-white font-semibold rounded-2xl hover:bg-white/10 transition-all text-lg"
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
            ) : (
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 glass-light text-white font-semibold rounded-2xl hover:bg-white/10 transition-all text-lg"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Trusted Universities Section - Premium Design */}
      <section className="relative py-32 bg-dark-950 overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-500/[0.02] to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent-500/[0.03] rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          {/* Header */}
          <div 
            className={`text-center mb-16 transition-all duration-1000 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "400ms" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-500/10 border border-accent-500/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
              <span className="text-xs text-accent-300 font-medium uppercase tracking-wider">Campus Network</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white mb-3">
              Trusted by <span className="text-accent-400">top universities</span>
            </h2>
            <p className="text-dark-400 text-base max-w-md mx-auto">
              Empowering students across campuses
            </p>
          </div>
          
          {/* Glass container for marquee */}
          <div 
            className={`relative transition-all duration-1000 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "600ms" }}
          >
            {/* Main glass card */}
            <div className="relative rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/20 p-8 md:p-10 overflow-hidden">
              {/* Inner glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-accent-500/[0.03] via-transparent to-purple-500/[0.03]" />
              
              {/* Fade edges */}
              <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-dark-950/90 via-dark-950/50 to-transparent z-20 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-dark-950/90 via-dark-950/50 to-transparent z-20 pointer-events-none" />
              
              {/* Scrolling content */}
              <div className="relative overflow-hidden">
                <div className="flex animate-university-scroll gap-8 items-center">
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
                    "GIKI",
                    "PIEAS",
                    "UET Lahore",
                    "SZABIST",
                  ].map((uni, i) => (
                    <div 
                      key={i} 
                      className="flex-shrink-0 group cursor-default"
                    >
                      <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.06] hover:bg-accent-500/20 hover:border-accent-500/30 hover:scale-105 transition-all duration-300">
                        <span className="text-lg group-hover:scale-110 transition-transform">🎓</span>
                        <span className="text-dark-200 text-sm font-semibold whitespace-nowrap group-hover:text-accent-400 transition-colors duration-300">
                          {uni}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* CSS for smooth marquee animation */}
        <style jsx>{`
          @keyframes universityScroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .animate-university-scroll {
            animation: universityScroll 25s linear infinite;
            will-change: transform;
          }
          .animate-university-scroll:hover {
            animation-play-state: paused;
          }
        `}</style>
      </section>
    </>
  );
}
