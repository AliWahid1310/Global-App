import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { MembershipManager } from "@/components/society/MembershipManager";
import { PostManager } from "@/components/society/PostManager";
import { EventManager } from "@/components/society/EventManager";
import { ArrowLeft, Users, FileText, Calendar, Settings, ExternalLink, Shield } from "lucide-react";
import type { Society, SocietyMember, Profile, Post, Event } from "@/types/database";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ManageSocietyPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is platform admin (superuser access)
  const isAdmin = await isPlatformAdmin(user.id);

  // Fetch society (platform admin can see any)
  const { data: societyData } = await supabase
    .from("societies")
    .select("*")
    .eq("slug", slug)
    .single();

  const society = societyData as Society | null;

  if (!society) {
    notFound();
  }

  // Check if user is admin of this society (platform admins bypass this)
  const { data: membership } = await supabase
    .from("society_members")
    .select("*")
    .eq("society_id", society.id)
    .eq("user_id", user.id)
    .eq("role", "admin")
    .eq("status", "approved")
    .single();

  // Platform admins can manage any society
  if (!membership && !isAdmin) {
    redirect(`/societies/${slug}`);
  }

  // Fetch pending members
  const { data: pendingMembersData } = await supabase
    .from("society_members")
    .select(
      `
      *,
      profile:profiles(*)
    `
    )
    .eq("society_id", society.id)
    .eq("status", "pending")
    .order("joined_at", { ascending: true });

  const pendingMembers = (pendingMembersData || []) as (SocietyMember & { profile: Profile | null })[];

  // Fetch approved members
  const { data: approvedMembersData } = await supabase
    .from("society_members")
    .select(
      `
      *,
      profile:profiles(*)
    `
    )
    .eq("society_id", society.id)
    .eq("status", "approved")
    .order("role", { ascending: true });

  const approvedMembers = (approvedMembersData || []) as (SocietyMember & { profile: Profile | null })[];

  // Fetch posts
  const { data: postsData } = await supabase
    .from("posts")
    .select(
      `
      *,
      author:profiles(*)
    `
    )
    .eq("society_id", society.id)
    .order("created_at", { ascending: false });

  const posts = (postsData || []) as (Post & { author: Profile | null })[];

  // Fetch events
  const { data: eventsData } = await supabase
    .from("events")
    .select("*")
    .eq("society_id", society.id)
    .order("start_time", { ascending: true });

  const events = (eventsData || []) as Event[];

  return (
    <div className="bg-dark-950 min-h-screen pt-24 pb-8 relative">
      <div className="absolute inset-0 bg-gradient-radial from-accent-900/10 via-transparent to-transparent" />
      <div className="noise-overlay" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-dark-300 hover:text-white transition-colors mb-2 group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
                <Settings className="h-5 w-5 text-accent-400" />
              </div>
              <h1 className="text-2xl font-display font-bold text-white">
                Manage {society.name}
              </h1>
            </div>
          </div>
          <Link
            href={`/societies/${slug}`}
            className="inline-flex items-center gap-2 text-accent-400 hover:text-accent-300 font-medium transition-colors"
          >
            View Public Page
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Members Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Requests */}
            <section className="glass-light rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-yellow-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Pending Requests ({pendingMembers.length})
                </h2>
              </div>
              <MembershipManager
                societyId={society.id}
                members={pendingMembers}
                type="pending"
              />
            </section>

            {/* Current Members */}
            <section className="glass-light rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Members ({approvedMembers.length})
                </h2>
              </div>
              <MembershipManager
                societyId={society.id}
                members={approvedMembers}
                type="approved"
              />
            </section>

            {/* Posts Section */}
            <section className="glass-light rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-accent-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Posts & Announcements
                </h2>
              </div>
              <PostManager societyId={society.id} posts={posts} />
            </section>
          </div>

          {/* Sidebar - Events */}
          <div>
            <section className="glass-light rounded-2xl p-6 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Events</h2>
              </div>
              <EventManager societyId={society.id} events={events} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
