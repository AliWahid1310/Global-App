"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { AnnouncementFeedItem } from "@/types/database";
import { Megaphone, Pin, MessageCircle, Share2, Heart, AlertTriangle, Trophy, Zap } from "lucide-react";

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
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 50) + 5);

  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
  const badge = getBadgeType(item.title, item.description);
  const BadgeIcon = badge.icon;

  const handleLike = () => {
    if (liked) {
      setLikeCount((prev) => prev - 1);
    } else {
      setLikeCount((prev) => prev + 1);
    }
    setLiked(!liked);
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
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                liked ? "text-red-400" : "text-dark-400 hover:text-red-400"
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
              <span className="text-xs">{likeCount}</span>
            </button>

            {/* Comment */}
            <button className="flex items-center gap-1.5 text-dark-400 hover:text-blue-400 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{Math.floor(Math.random() * 15)}</span>
            </button>

            {/* Share */}
            <button className="flex items-center gap-1.5 text-dark-400 hover:text-green-400 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
