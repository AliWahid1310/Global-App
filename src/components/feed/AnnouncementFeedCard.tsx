"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { AnnouncementFeedItem } from "@/types/database";
import { Megaphone, Pin, Heart, AlertTriangle, Trophy, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AnnouncementFeedCardProps {
  item: AnnouncementFeedItem;
  featured?: boolean;
}

// Badge types based on title/content keywords
const getBadgeType = (title: string, content: string | null) => {
  const text = `${title} ${content || ""}`.toLowerCase();
  if (text.includes("urgent") || text.includes("important") || text.includes("deadline")) {
    return { color: "red", bgClass: "bg-red-500", textClass: "text-red-400", bgLightClass: "bg-red-500/20", text: "Urgent", icon: AlertTriangle };
  }
  if (text.includes("winner") || text.includes("achievement") || text.includes("congratul")) {
    return { color: "green", bgClass: "bg-green-500", textClass: "text-green-400", bgLightClass: "bg-green-500/20", text: "Achievement", icon: Trophy };
  }
  if (text.includes("opportunity") || text.includes("internship") || text.includes("job")) {
    return { color: "amber", bgClass: "bg-amber-500", textClass: "text-amber-400", bgLightClass: "bg-amber-500/20", text: "Opportunity", icon: Zap };
  }
  return { color: "blue", bgClass: "bg-blue-500", textClass: "text-blue-400", bgLightClass: "bg-blue-500/20", text: "Announcement", icon: Megaphone };
};

export function AnnouncementFeedCard({ item, featured = false }: AnnouncementFeedCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
  const badge = getBadgeType(item.title, item.description);
  const BadgeIcon = badge.icon;

  // Fetch initial like data and set up real-time subscription
  useEffect(() => {
    const supabase = createClient();

    const fetchLikes = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }

      // Get like count
      const { count } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", item.id);

      setLikeCount(count || 0);

      // Check if user has liked
      if (user) {
        const { data: existingLike } = await supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", item.id)
          .eq("user_id", user.id)
          .single();

        setLiked(!!existingLike);
      }
    };

    fetchLikes();

    // Set up real-time subscription for likes
    const channel = supabase
      .channel(`post_likes_${item.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_likes",
          filter: `post_id=eq.${item.id}`,
        },
        async () => {
          // Refetch like count when likes change
          const { count } = await supabase
            .from("post_likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", item.id);

          setLikeCount(count || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [item.id]);

  const handleLike = async () => {
    if (!userId || isLoading) return;

    setIsLoading(true);
    const supabase = createClient();

    try {
      if (liked) {
        // Unlike - delete the like
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", item.id)
          .eq("user_id", userId);

        setLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        // Like - insert new like
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("post_likes")
          .insert({ post_id: item.id, user_id: userId });

        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`group relative bg-dark-900/50 backdrop-blur-sm border border-dark-700/50 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5 ${featured ? "p-5" : "p-4"}`}>
      <div className="flex gap-4">
        {/* Left: Image thumbnail (if exists) */}
        {item.image_url && (
          <div className="flex-shrink-0">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden">
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
          </div>
        )}

        {/* Right: Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Top row: Society + Badge + Time */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Link
                href={`/societies/${item.society_slug}`}
                className="flex items-center gap-2 group/society min-w-0"
              >
                {item.society_logo ? (
                  <Image
                    src={item.society_logo}
                    alt={item.society_name}
                    width={24}
                    height={24}
                    className="rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-accent-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-white">
                      {item.society_name[0]}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-white group-hover/society:text-blue-400 transition-colors truncate">
                  {item.society_name}
                </span>
              </Link>
              
              {/* Badge */}
              <div className={`hidden sm:flex items-center gap-1 px-2 py-0.5 ${badge.bgLightClass} rounded-full flex-shrink-0`}>
                <BadgeIcon className={`w-3 h-3 ${badge.textClass}`} />
                <span className={`text-[10px] font-semibold ${badge.textClass}`}>{badge.text}</span>
              </div>

              {/* Pinned */}
              {item.is_pinned && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 rounded-full flex-shrink-0">
                  <Pin className="w-3 h-3 text-amber-400" />
                </div>
              )}
            </div>

            <span className="text-xs text-dark-500 flex-shrink-0">{timeAgo}</span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-white text-base leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors">
            {item.title}
          </h3>

          {/* Description (short) */}
          {item.description && (
            <p className="text-dark-400 text-sm line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Actions Row */}
          <div className="flex items-center gap-4 pt-1">
            {/* Like */}
            <button
              onClick={handleLike}
              disabled={!userId || isLoading}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                liked ? "text-red-400" : "text-dark-400 hover:text-red-400"
              } ${!userId ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
              <span className="text-xs">{likeCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
