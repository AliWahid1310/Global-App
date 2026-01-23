"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Calendar, MessageCircle, Zap } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Find Your Tribe",
    description: "Discover societies that match your vibe. No overwhelming lists, just curated communities.",
    color: "#8b5cf6",
  },
  {
    icon: Calendar,
    title: "Never Miss Out",
    description: "Events that actually matter. Get notified about the experiences you care about.",
    color: "#22d3ee",
  },
  {
    icon: MessageCircle,
    title: "Real Conversations",
    description: "Chat that feels alive. Not another boring group chat, but meaningful connections.",
    color: "#f472b6",
  },
  {
    icon: Zap,
    title: "Instant Updates",
    description: "Real-time everything. See what's happening right now across all your circles.",
    color: "#fbbf24",
  },
];

export function FeaturesSection() {
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger the card animations
            features.forEach((_, index) => {
              setTimeout(() => {
                setVisibleCards((prev) => [...prev, index]);
              }, index * 150);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Built different.
          </h2>
          <p className="text-xl text-dark-200 max-w-2xl mx-auto">
            Not another platform. A space designed for how students actually connect.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isVisible = visibleCards.includes(index);

            return (
              <div
                key={index}
                className={`group relative p-8 rounded-3xl glass-light card-tilt transition-all duration-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                {/* Glow effect on hover */}
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                  style={{ background: `${feature.color}10` }}
                />

                <div className="relative z-10">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: feature.color }} />
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>

                  <p className="text-dark-200 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
