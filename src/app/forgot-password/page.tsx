"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mail, Loader2, Users, ArrowLeft, Check } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col justify-center py-12 px-6 relative">
        <div className="absolute inset-0 bg-gradient-radial from-accent-900/20 via-transparent to-transparent" />
        <div className="noise-overlay" />
        
        <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="glass-light rounded-3xl p-8 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-3">
              Check your email
            </h2>
            <p className="text-dark-200 mb-8">
              We&apos;ve sent a password reset link to <span className="text-accent-400 font-medium">{email}</span>.
              Click the link to reset your password.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-accent-400 hover:text-accent-300 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center pt-24 pb-12 px-6 relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-radial from-accent-900/20 via-transparent to-transparent" />
      <div className="noise-overlay" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-accent-400" />
            </div>
            <span className="text-2xl font-display font-bold text-white">Circl</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Forgot password?
          </h1>
          <p className="text-dark-200">
            No worries, we&apos;ll send you reset instructions.
          </p>
        </div>

        {/* Form */}
        <div className="glass-light rounded-3xl p-8">
          <form className="space-y-6" onSubmit={handleResetPassword}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-100 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-dark-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-accent-500 text-white font-semibold rounded-xl hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-glow"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Send reset link"
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-dark-300 hover:text-white font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
