import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { ArrowLeft, Users, MessageCircle, Shield } from "lucide-react";
import Link from "next/link";
import type { Society, Profile, ChatMessage } from "@/types/database";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SocietyChatPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/dashboard/societies/${slug}/chat`);
  }

  // Fetch society
  const { data: societyData } = await supabase
    .from("societies")
    .select("*")
    .eq("slug", slug)
    .single();

  const society = societyData as Society | null;

  if (!society) {
    notFound();
  }

  // Check if user is platform admin (has access to everything)
  const isAdmin = await isPlatformAdmin(user.id);

  // Check if user is approved member (platform admins bypass this)
  const { data: membership } = await supabase
    .from("society_members")
    .select("*")
    .eq("society_id", society.id)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .single();

  // Platform admins can access any chat, others need to be approved members
  if (!membership && !isAdmin) {
    redirect(`/societies/${slug}`);
  }

  // Fetch user profile
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as Profile | null;

  // Fetch initial messages
  const { data: messagesData } = await supabase
    .from("chat_messages")
    .select(
      `
      *,
      user:profiles(*)
    `
    )
    .eq("society_id", society.id)
    .order("created_at", { ascending: true })
    .limit(50);

  const initialMessages = (messagesData || []) as (ChatMessage & { user: Profile | null })[];

  // Fetch member count
  const { count: memberCount } = await supabase
    .from("society_members")
    .select("*", { count: "exact", head: true })
    .eq("society_id", society.id)
    .eq("status", "approved");

  return (
    <div className="bg-dark-950 min-h-screen flex flex-col pt-24">
      {/* Header */}
      <div className="glass-light border-b border-dark-700 sticky top-24 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-dark-400 hover:text-white transition-colors p-2 hover:bg-dark-700 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-accent-400" />
                </div>
                <div>
                  <h1 className="font-semibold text-white">{society.name}</h1>
                  <div className="flex items-center text-sm text-dark-300">
                    <Users className="h-4 w-4 mr-1 text-dark-400" />
                    {memberCount} members
                  </div>
                </div>
              </div>
            </div>
            <Link
              href={`/societies/${slug}`}
              className="text-sm text-accent-400 hover:text-accent-300 transition-colors"
            >
              View Society
            </Link>
          </div>
        </div>
      </div>

      {/* Chat Room */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4">
        <ChatRoom
          societyId={society.id}
          currentUser={profile!}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  );
}
