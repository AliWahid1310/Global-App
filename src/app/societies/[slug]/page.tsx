import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { PostCard } from "@/components/society/PostCard";
import { EventCard } from "@/components/society/EventCard";
import { JoinButton } from "@/components/society/JoinButton";
import { Users, MapPin, Calendar, MessageCircle, Sparkles, ArrowRight, Shield } from "lucide-react";
import type { Society, Post, Event, Profile, SocietyMember } from "@/types/database";

type PostWithAuthor = Post & { author: Profile | null };

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SocietyPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Check if current user is platform admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  const isAdmin = user ? await isPlatformAdmin(user.id) : false;

  // Platform admins can view any society, others only see approved public ones
  let societyData;
  if (isAdmin) {
    // Platform admin can see any society
    const { data } = await supabase
      .from("societies")
      .select("*")
      .eq("slug", slug)
      .single();
    societyData = data;
  } else {
    // Regular users only see approved public societies
    const { data } = await supabase
      .from("societies")
      .select("*")
      .eq("slug", slug)
      .eq("is_public", true)
      .eq("status", "approved")
      .single();
    societyData = data;
  }

  const society = societyData as Society | null;

  if (!society) {
    notFound();
  }

  // Fetch member count (excluding platform admins who should remain hidden)
  const { data: membersForCount } = await supabase
    .from("society_members")
    .select(`
      id,
      profile:profiles(is_admin)
    `)
    .eq("society_id", society.id)
    .eq("status", "approved");
  
  // Filter out platform admins from count
  const memberCount = (membersForCount || []).filter(
    (m: any) => !m.profile?.is_admin
  ).length;

  // Fetch recent posts
  const { data: postsData } = await supabase
    .from("posts")
    .select(
      `
      *,
      author:profiles(*)
    `
    )
    .eq("society_id", society.id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(6);

  const posts = (postsData || []) as PostWithAuthor[];

  // Fetch upcoming events
  const { data: eventsData } = await supabase
    .from("events")
    .select("*")
    .eq("society_id", society.id)
    .eq("is_public", true)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(4);

  const events = (eventsData || []) as Event[];

  // Check current user's membership
  let membership: SocietyMember | null = null;
  if (user) {
    const { data } = await supabase
      .from("society_members")
      .select("*")
      .eq("society_id", society.id)
      .eq("user_id", user.id)
      .single();
    membership = data as SocietyMember | null;
  }

  return (
    <div className="bg-dark-950 min-h-screen pt-24">
      {/* Banner with gradient overlay */}
      <div className="relative h-72 md:h-96">
        {society.banner_url ? (
          <Image
            src={society.banner_url}
            alt={society.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent-600 via-accent-700 to-dark-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-transparent" />
        
        {/* Floating decorations */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-glow/10 rounded-full blur-3xl" />
      </div>

      {/* Society Info Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-32 mb-8">
          <div className="glass rounded-3xl p-8 animate-slide-up">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Logo */}
              <div className="flex-shrink-0">
                <div className="w-36 h-36 rounded-2xl overflow-hidden ring-4 ring-dark-800 shadow-2xl shadow-accent-500/20">
                  {society.logo_url ? (
                    <Image
                      src={society.logo_url}
                      alt={society.name}
                      width={144}
                      height={144}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
                      <Users className="h-16 w-16 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <h1 className="text-4xl font-display font-bold text-white mb-3">
                      {society.name}
                    </h1>
                    {society.category && (
                      <span className="inline-flex items-center gap-1 px-4 py-1.5 bg-accent-500/20 text-accent-300 text-sm font-medium rounded-full border border-accent-500/30">
                        <Sparkles className="h-3.5 w-3.5" />
                        {society.category}
                      </span>
                    )}
                  </div>
                  <JoinButton
                    societyId={society.id}
                    userId={user?.id}
                    membership={membership}
                  />
                </div>

                {society.description && (
                  <p className="mt-5 text-dark-200 text-lg leading-relaxed">
                    {society.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap gap-6 mt-6">
                  {society.university && (
                    <div className="flex items-center text-dark-300 hover:text-white transition-colors">
                      <MapPin className="h-5 w-5 mr-2 text-accent-400" />
                      {society.university}
                    </div>
                  )}
                  <div className="flex items-center text-dark-300">
                    <Users className="h-5 w-5 mr-2 text-accent-400" />
                    <span className="text-white font-semibold">{memberCount || 0}</span>
                    <span className="ml-1">members</span>
                  </div>
                  {events.length > 0 && (
                    <div className="flex items-center text-dark-300">
                      <Calendar className="h-5 w-5 mr-2 text-accent-400" />
                      <span className="text-white font-semibold">{events.length}</span>
                      <span className="ml-1">upcoming events</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 pb-16">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Posts Section */}
            <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-accent-400" />
                Recent Announcements
              </h2>
              {posts.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {posts.map((post, index) => (
                    <div 
                      key={post.id} 
                      className="animate-slide-up"
                      style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                    >
                      <PostCard post={post} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-light rounded-2xl p-10 text-center">
                  <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-dark-400" />
                  </div>
                  <p className="text-dark-300 text-lg">No announcements yet</p>
                  <p className="text-dark-400 text-sm mt-1">Check back soon for updates</p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <section 
              className="glass-light rounded-2xl p-6 animate-slide-up"
              style={{ animationDelay: "0.15s" }}
            >
              <h3 className="font-display font-semibold text-white text-lg mb-5 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent-400" />
                Upcoming Events
              </h3>
              {events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-sm text-center py-6">
                  No upcoming events scheduled
                </p>
              )}
            </section>

            {/* Member Access Notice */}
            {membership?.status === "approved" && (
              <div 
                className="relative overflow-hidden rounded-2xl p-6 animate-slide-up"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20" />
                <div className="absolute inset-0 glass-light" />
                <div className="relative z-10">
                  <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Member Access
                  </h4>
                  <p className="text-sm text-dark-200 mb-4">
                    You&apos;re part of the circle! Access the group chat and join discussions.
                  </p>
                  <Link
                    href={`/dashboard/societies/${society.slug}/chat`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl text-sm font-medium transition-all group"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Open Group Chat
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            )}

            {/* Admin Panel - for society admins and platform admins */}
            {(membership?.role === "admin" || isAdmin) && (
              <div 
                className="relative overflow-hidden rounded-2xl p-6 animate-slide-up"
                style={{ animationDelay: "0.25s" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent-500/20 to-purple-600/20" />
                <div className="absolute inset-0 glass-light" />
                <div className="relative z-10">
                  <h4 className="font-semibold text-accent-400 mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin Panel
                  </h4>
                  <p className="text-sm text-dark-200 mb-4">
                    Manage members, posts, and events for this society.
                  </p>
                  <Link
                    href={`/dashboard/societies/${society.slug}/manage`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-500/20 hover:bg-accent-500/30 text-accent-400 rounded-xl text-sm font-medium transition-all group"
                  >
                    <Shield className="h-4 w-4" />
                    Manage Society
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
