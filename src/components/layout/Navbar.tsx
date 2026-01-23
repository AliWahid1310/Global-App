"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Menu, X, Users, LogOut, User as UserIcon, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/societies", label: "Explore" },
    { href: "/events", label: "Events" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center">
          {/* Logo - Left */}
          <div className="flex-1">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center group-hover:bg-accent-500/30 transition-colors">
                <Users className="h-5 w-5 text-accent-400" />
              </div>
              <span className="text-xl font-display font-bold text-white">Circl</span>
            </Link>
          </div>

          {/* Desktop nav - Center */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  pathname === link.href
                    ? "text-white bg-white/10"
                    : "text-dark-200 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
            {loading ? (
              <div className="h-10 w-24 bg-dark-700 animate-pulse rounded-xl" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-dark-200 hover:text-white hover:bg-white/5 transition-all"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="text-sm font-medium">Dashboard</span>
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-dark-200 hover:text-white hover:bg-white/5 transition-all"
                >
                  <UserIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Profile</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-dark-200 hover:text-white hover:bg-white/5 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-dark-200 hover:text-white text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 bg-accent-500 text-white text-sm font-semibold rounded-xl hover:bg-accent-600 transition-all btn-glow"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-xl text-dark-200 hover:text-white hover:bg-white/5 transition-all"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 glass border-t border-dark-700 animate-slide-down">
          <div className="px-6 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-3 rounded-xl text-base font-medium transition-all ${
                  pathname === link.href
                    ? "bg-accent-500/20 text-accent-400"
                    : "text-dark-200 hover:text-white hover:bg-white/5"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="h-px bg-dark-700 my-3" />
            
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-dark-200 hover:text-white hover:bg-white/5"
                  onClick={() => setIsOpen(false)}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-dark-200 hover:text-white hover:bg-white/5"
                  onClick={() => setIsOpen(false)}
                >
                  <UserIcon className="h-5 w-5" />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-dark-200 hover:text-white hover:bg-white/5"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-3 rounded-xl text-dark-200 hover:text-white hover:bg-white/5"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-3 rounded-xl bg-accent-500 text-white text-center font-semibold"
                  onClick={() => setIsOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
