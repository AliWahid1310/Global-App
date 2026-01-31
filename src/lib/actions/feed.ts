"use server";

import { createClient } from "@/lib/supabase/server";
import type { FeedItem, EventFeedItem, AnnouncementFeedItem, RSVPStatus } from "@/types/database";

const FEED_PAGE_SIZE = 10;

interface FeedResponse {
  items: FeedItem[];
  hasMore: boolean;
  error?: string;
}

interface ProfileRow {
  university: string | null;
}

interface MembershipRow {
  society_id: string;
}

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  society_id: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  capacity: number | null;
  created_at: string;
  society: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    university: string | null;
  };
}

interface PostRow {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  society_id: string;
  is_pinned: boolean;
  created_at: string;
  author: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  society: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    university: string | null;
  };
}

interface RsvpRow {
  event_id: string;
  status: string;
  guest_count: number;
}

interface SocietyRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export async function getFeedItems(page: number = 0): Promise<FeedResponse> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { items: [], hasMore: false, error: "Not authenticated" };
  }

  // Get user's profile to filter by university
  const { data: profileData } = await supabase
    .from("profiles")
    .select("university")
    .eq("id", user.id)
    .single();

  const profile = profileData as ProfileRow | null;

  if (!profile?.university) {
    return { items: [], hasMore: false, error: "Please set your university in your profile" };
  }

  const offset = page * FEED_PAGE_SIZE;

  // Fetch events from ALL societies in user's university
  const { data: eventsRaw } = await supabase
    .from("events")
    .select(`
      id,
      title,
      description,
      image_url,
      society_id,
      start_time,
      end_time,
      location,
      capacity,
      created_at,
      society:societies!inner(
        id,
        name,
        slug,
        logo_url,
        university
      )
    `)
    .eq("society.university", profile.university)
    .eq("is_public", true)
    .gte("start_time", new Date().toISOString())
    .order("created_at", { ascending: false });

  const eventsData = (eventsRaw || []) as unknown as EventRow[];

  // Fetch announcements/posts from ALL societies in user's university
  const { data: postsRaw } = await supabase
    .from("posts")
    .select(`
      id,
      title,
      content,
      image_url,
      society_id,
      is_pinned,
      created_at,
      author:profiles(full_name, avatar_url),
      society:societies!inner(
        id,
        name,
        slug,
        logo_url,
        university
      )
    `)
    .eq("society.university", profile.university)
    .order("created_at", { ascending: false });

  const postsData = (postsRaw || []) as unknown as PostRow[];

  // Get user's RSVPs for the events
  const eventIds = eventsData.map((e) => e.id);
  const { data: userRsvpsRaw } = await supabase
    .from("event_rsvps")
    .select("event_id, status")
    .eq("user_id", user.id)
    .in("event_id", eventIds);

  const userRsvps = (userRsvpsRaw || []) as { event_id: string; status: string }[];
  const rsvpMap = new Map(userRsvps.map((r) => [r.event_id, r.status as RSVPStatus]));

  // Get RSVP counts for events
  const { data: rsvpCountsRaw } = await supabase
    .from("event_rsvps")
    .select("event_id, status, guest_count")
    .in("event_id", eventIds);

  const rsvpCounts = (rsvpCountsRaw || []) as RsvpRow[];
  const eventRsvpCounts = new Map<string, { going: number; maybe: number; total_guests: number }>();
  rsvpCounts.forEach((rsvp) => {
    const current = eventRsvpCounts.get(rsvp.event_id) || { going: 0, maybe: 0, total_guests: 0 };
    if (rsvp.status === "going") {
      current.going += 1;
      current.total_guests += rsvp.guest_count || 0;
    } else if (rsvp.status === "maybe") {
      current.maybe += 1;
    }
    eventRsvpCounts.set(rsvp.event_id, current);
  });

  // Transform events to feed items
  const eventItems: EventFeedItem[] = eventsData.map((event) => {
    return {
      id: event.id,
      type: "event" as const,
      title: event.title,
      description: event.description,
      image_url: event.image_url,
      society_id: event.society_id,
      society_name: event.society.name,
      society_slug: event.society.slug,
      society_logo: event.society.logo_url,
      created_at: event.created_at,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location,
      capacity: event.capacity,
      rsvp_count: eventRsvpCounts.get(event.id) || { going: 0, maybe: 0, total_guests: 0 },
      user_rsvp_status: rsvpMap.get(event.id) || null,
    };
  });

  // Transform posts to feed items
  const announcementItems: AnnouncementFeedItem[] = postsData.map((post) => {
    return {
      id: post.id,
      type: "announcement" as const,
      title: post.title,
      description: post.content,
      image_url: post.image_url,
      society_id: post.society_id,
      society_name: post.society.name,
      society_slug: post.society.slug,
      society_logo: post.society.logo_url,
      created_at: post.created_at,
      author_name: post.author?.full_name || null,
      author_avatar: post.author?.avatar_url || null,
      is_pinned: post.is_pinned,
    };
  });

  // Merge and sort by created_at (newest first)
  const allItems: FeedItem[] = [...eventItems, ...announcementItems].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Paginate
  const paginatedItems = allItems.slice(offset, offset + FEED_PAGE_SIZE);
  const hasMore = offset + FEED_PAGE_SIZE < allItems.length;

  return { items: paginatedItems, hasMore };
}

export async function getUserSocieties(): Promise<SocietyRow[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: memberships } = await supabase
    .from("society_members")
    .select(`
      society:societies(
        id,
        name,
        slug,
        logo_url
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "approved");

  const result = (memberships || []) as unknown as { society: SocietyRow }[];
  return result.map((m) => m.society);
}

export interface LeaderboardSociety {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  member_count: number;
  post_count?: number;
  event_count?: number;
  score?: number;
}

export interface LeaderboardMember {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  society_count: number;
}

export async function getLeaderboard(university: string | null): Promise<{
  topSocieties: LeaderboardSociety[];
  fastestGrowing: LeaderboardSociety[];
  mostActive: LeaderboardMember[];
}> {
  const supabase = await createClient();

  // Get societies with member count, posts, and events for this university
  let societyQuery = supabase
    .from("societies")
    .select(`
      id,
      name,
      slug,
      logo_url,
      created_at,
      society_members(user_id, joined_at),
      posts(id, created_at),
      events(id, created_at)
    `)
    .eq("approval_status", "approved");

  if (university) {
    societyQuery = societyQuery.eq("university", university);
  }

  const { data: societies } = await societyQuery;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Calculate engagement scores and growth
  const societiesWithStats = (societies || []).map((s: any) => {
    const members = Array.isArray(s.society_members) ? s.society_members : [];
    const posts = Array.isArray(s.posts) ? s.posts : [];
    const events = Array.isArray(s.events) ? s.events : [];
    
    // Recent activity (last 30 days)
    const recentPosts = posts.filter((p: any) => new Date(p.created_at) > thirtyDaysAgo).length;
    const recentEvents = events.filter((e: any) => new Date(e.created_at) > thirtyDaysAgo).length;
    const recentMembers = members.filter((m: any) => m.joined_at && new Date(m.joined_at) > thirtyDaysAgo).length;
    
    // Engagement score = members + (posts * 2) + (events * 3) + (recent activity bonus)
    const score = members.length + (posts.length * 2) + (events.length * 3) + (recentPosts * 5) + (recentEvents * 10);
    
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      logo_url: s.logo_url,
      member_count: members.length,
      post_count: posts.length,
      event_count: events.length,
      score,
      recent_members: recentMembers,
    };
  });

  // Top societies by engagement score
  const topSocieties = [...societiesWithStats]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Fastest growing (most new members in last 30 days)
  const fastestGrowing = [...societiesWithStats]
    .filter(s => s.recent_members > 0)
    .sort((a, b) => b.recent_members - a.recent_members)
    .slice(0, 3);

  // Get most active members (by number of societies joined)
  let memberQuery = supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      avatar_url,
      society_members!inner(society_id, societies!inner(university))
    `);

  const { data: members } = await memberQuery;

  const membersWithCounts = (members || [])
    .map((m: any) => {
      const societyMemberships = Array.isArray(m.society_members) ? m.society_members : [];
      // Filter by university if specified
      const relevantMemberships = university 
        ? societyMemberships.filter((sm: any) => sm.societies?.university === university)
        : societyMemberships;
      
      return {
        id: m.id,
        full_name: m.full_name,
        avatar_url: m.avatar_url,
        society_count: relevantMemberships.length,
      };
    })
    .filter((m: any) => m.society_count > 0)
    .sort((a: any, b: any) => b.society_count - a.society_count)
    .slice(0, 3);

  return {
    topSocieties,
    fastestGrowing,
    mostActive: membersWithCounts,
  };
}
