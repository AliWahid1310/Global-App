"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function CTASection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-32 px-6">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-radial from-accent-900/30 via-transparent to-transparent" />

      <div
        className={`relative max-w-4xl mx-auto text-center transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <h2 className="font-display text-4xl sm:text-6xl font-bold text-white mb-6">
          Ready to find
          <br />
          <span className="gradient-text">your circle?</span>
        </h2>

        <p className="text-xl text-dark-200 mb-12 max-w-2xl mx-auto">
          Join thousands of students already building meaningful connections.
          Your community is waiting.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 bg-accent-500 text-white text-lg font-semibold rounded-2xl btn-glow overflow-hidden"
          >
            <span className="relative z-10">Get Started Free</span>
            <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <p className="text-sm text-dark-300 mt-6">
          No credit card required • Free forever
        </p>
      </div>
    </section>
  );
}
