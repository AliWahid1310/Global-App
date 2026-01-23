"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { Society } from "@/types/database";
import { Users, MapPin, ArrowRight } from "lucide-react";

interface SocietyCardProps {
  society: Society;
  memberCount?: number;
}

export function SocietyCard({ society, memberCount }: SocietyCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={`/societies/${society.slug}`}
      className="group relative block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`relative rounded-3xl overflow-hidden transition-all duration-500 card-tilt ${
          isHovered ? "scale-[1.02]" : ""
        }`}
      >
        {/* Glow effect */}
        <div
          className={`absolute -inset-1 bg-gradient-to-r from-accent-500/50 to-glow/50 rounded-3xl blur-xl transition-opacity duration-500 ${
            isHovered ? "opacity-60" : "opacity-0"
          }`}
        />

        {/* Card content */}
        <div className="relative glass-light rounded-3xl overflow-hidden">
          {/* Banner */}
          <div className="relative h-36 bg-gradient-to-br from-accent-600/30 to-dark-800">
            {society.banner_url && (
              <Image
                src={society.banner_url}
                alt={society.name}
                fill
                className="object-cover opacity-60"
              />
            )}
            
            {/* Category badge */}
            {society.category && (
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 text-xs font-medium bg-white/10 backdrop-blur-sm text-white rounded-full">
                  {society.category}
                </span>
              </div>
            )}

            {/* Logo */}
            <div className="absolute -bottom-8 left-6">
              <div
                className={`w-16 h-16 rounded-2xl border-4 border-dark-800 overflow-hidden transition-transform duration-300 ${
                  isHovered ? "scale-110" : ""
                }`}
              >
                {society.logo_url ? (
                  <Image
                    src={society.logo_url}
                    alt={society.name}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-accent-500/20 flex items-center justify-center">
                    <Users className="h-7 w-7 text-accent-400" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="pt-12 pb-6 px-6">
            <h3 className="font-display font-semibold text-lg text-white group-hover:text-accent-400 transition-colors">
              {society.name}
            </h3>

            {society.description && (
              <p className="text-dark-200 text-sm mt-2 line-clamp-2">
                {society.description}
              </p>
            )}

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center gap-4 text-sm text-dark-300">
                {society.university && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-accent-400" />
                    <span className="truncate max-w-[100px] text-accent-400 font-semibold" style={{ textShadow: '0 0 10px rgba(139, 92, 246, 0.6)' }}>{society.university}</span>
                  </div>
                )}
                {memberCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{memberCount}</span>
                  </div>
                )}
              </div>

              {/* Arrow indicator */}
              <div
                className={`w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center transition-all duration-300 ${
                  isHovered ? "bg-accent-500 translate-x-1" : ""
                }`}
              >
                <ArrowRight
                  className={`h-4 w-4 transition-colors ${
                    isHovered ? "text-white" : "text-accent-400"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
