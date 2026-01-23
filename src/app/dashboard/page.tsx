import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SocietyCard } from "@/components/society/SocietyCard";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { Plus, Users, Calendar, MessageCircle, Sparkles, ArrowRight, Clock, Shield } from "lucide-react";
import type { Society, SocietyMember } from "@/types/database";

type MembershipWithSociety = SocietyMember & { society: Society };

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is platform admin
  const isAdmin = await isPlatformAdmin(user.id);

  // Fetch user's society memberships (including pending societies they created)
  const { data: membershipsData } = await supabase
    .from("society_members")
    .select(`
      *,
      society:societies(*)
    `)
    .eq("user_id", user.id)
    .eq("status", "approved");

  const memberships = (membershipsData || []) as MembershipWithSociety[];
  
  // Get societies where user is an admin or moderator (can manage)
  const adminSocieties = memberships.filter((m) => m.role === "admin" || m.role === "moderator");

  // Get societies where user is just a member
  const memberSocieties = memberships.filter(
    (m) => m.role === "member"
  );

  // Separate pending and approved societies for admins
  const pendingSocieties = adminSocieties.filter(
    (m) => m.society.status === "pending"
  );
  const approvedAdminSocieties = adminSocieties.filter(
    (m) => m.society.status === "approved"
  );

  // Count pending society requests for platform admins
  let pendingRequestsCount = 0;
  if (isAdmin) {
    const { count } = await supabase
      .from("societies")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    pendingRequestsCount = count || 0;
  }

  return (
    <div className="bg-dark-950 min-h-screen pt-24 pb-12 relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-radial from-accent-900/10 via-transparent to-transparent" />
      <div className="noise-overlay" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent-400" />
            <span className="text-sm text-accent-400 font-medium">Dashboard</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Welcome back!
          </h1>
          <p className="text-dark-300">
            Manage your societies and stay connected with your communities.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{memberships.length}</p>
                <p className="text-sm text-dark-300">Societies Joined</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-glow/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-glow" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{approvedAdminSocieties.length}</p>
                <p className="text-sm text-dark-300">Societies Managed</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{memberSocieties.length}</p>
                <p className="text-sm text-dark-300">Communities</p>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Admin Panel */}
        {isAdmin && pendingRequestsCount > 0 && (
          <div className="mb-12">
            <Link
              href="/dashboard/admin/societies"
              className="block glass rounded-2xl p-6 hover:bg-white/5 transition-colors border border-amber-500/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">Society Requests</p>
                    <p className="text-sm text-dark-300">
                      {pendingRequestsCount} pending {pendingRequestsCount === 1 ? "request" : "requests"} to review
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-amber-400" />
              </div>
            </Link>
          </div>
        )}

        {/* Pending Societies (user's own requests) */}
        {pendingSocieties.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
              <Clock className="w-6 h-6 text-amber-400" />
              Pending Approval
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingSocieties.map((membership) => (
                <div key={membership.id} className="relative">
                  <div className="opacity-70">
                    <SocietyCard society={membership.society} />
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1.5 bg-amber-500/20 backdrop-blur-sm text-amber-300 text-xs rounded-full border border-amber-500/30 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Pending Review
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Societies Section */}
        {approvedAdminSocieties.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-white">
                Your Societies
              </h2>
              <Link
                href="/dashboard/societies/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-xl hover:bg-accent-600 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Create New
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedAdminSocieties.map((membership) => (
                <div key={membership.id} className="relative group">
                  <SocietyCard society={membership.society} />
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/dashboard/societies/${membership.society.slug}/manage`}
                      className="px-3 py-1.5 bg-dark-800/90 backdrop-blur-sm text-white text-xs rounded-lg hover:bg-dark-700 transition-colors"
                    >
                      Manage
                    </Link>
                    <Link
                      href={`/dashboard/societies/${membership.society.slug}/chat`}
                      className="px-3 py-1.5 bg-accent-500/90 backdrop-blur-sm text-white text-xs rounded-lg hover:bg-accent-600 transition-colors"
                    >
                      Chat
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Member Societies Section */}
        {memberSocieties.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              Communities You&apos;re Part Of
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {memberSocieties.map((membership) => (
                <div key={membership.id} className="relative group">
                  <SocietyCard society={membership.society} />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/dashboard/societies/${membership.society.slug}/chat`}
                      className="px-3 py-1.5 bg-accent-500/90 backdrop-blur-sm text-white text-xs rounded-lg hover:bg-accent-600 transition-colors"
                    >
                      Chat
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {memberships.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-dark-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No societies yet
            </h3>
            <p className="text-dark-300 mb-8 max-w-md mx-auto">
              Join existing societies or create your own to start connecting with like-minded students.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/societies"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 glass-light text-white rounded-xl hover:bg-white/10 transition-colors font-medium"
              >
                Explore Societies
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard/societies/create"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent-500 text-white rounded-xl hover:bg-accent-600 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Create Society
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
