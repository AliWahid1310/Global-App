"use client";

import Link from "next/link";
import { Users } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-r from-zinc-950 via-black to-zinc-950 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity sm:flex-1">
            <div className="w-6 h-6 rounded-lg bg-accent-500/20 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-accent-400" />
            </div>
            <span className="text-sm font-display font-semibold text-white">Circl</span>
          </Link>

          {/* Center: Tagline */}
          <p className="text-sm text-zinc-400 tracking-wide text-center">
            Built for students, by students{" "}
            <span className="text-pink-500">❤️</span>
          </p>

          {/* Right: Links */}
          <div className="flex items-center gap-4 text-sm text-zinc-400 sm:flex-1 sm:justify-end">
            <Link
              href="#"
              className="hover:text-white hover:underline transition-all"
            >
              Privacy
            </Link>
            <span className="text-zinc-600">•</span>
            <Link
              href="#"
              className="hover:text-white hover:underline transition-all"
            >
              Terms
            </Link>
            <span className="text-zinc-600">•</span>
            <Link
              href="#"
              className="hover:text-white hover:underline transition-all"
            >
              Safety
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
