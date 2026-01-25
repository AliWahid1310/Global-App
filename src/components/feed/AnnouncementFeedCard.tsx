"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { AnnouncementFeedItem } from "@/types/database";
import { Megaphone, Pin, MessageCircle, Share2, Bookmark, AlertTriangle, Trophy, Zap } from "lucide-react";

interface AnnouncementFeedCardProps {
  item: AnnouncementFeedItem;
  featured?: boolean;
}

// Reaction emojis
const REACTIONS = [
  { emoji: "👍", name: "like" },
  { emoji: "❤️", name: "love" },
  { emoji: "🔥", name: "fire" },
  { emoji: "🎉", name: "celebrate" },
  { emoji: "👀", name: "eyes" },
];

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
  const [reactions, setReactions] = useState<Record<string, number>>({
    like: Math.floor(Math.random() * 20),
    love: Math.floor(Math.random() * 10),
    fire: Math.floor(Math.random() * 5),
  });
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
  const badge = getBadgeType(item.title, item.description);
  const BadgeIcon = badge.icon;

  const handleReaction = (reaction: string) => {
    if (userReaction === reaction) {
      setReactions((prev) => ({ ...prev, [reaction]: prev[reaction] - 1 }));
      setUserReaction(null);
    } else {
      if (userReaction) {
        setReactions((prev) => ({ ...prev, [userReaction]: prev[userReaction] - 1 }));
      }
      setReactions((prev) => ({ ...prev, [reaction]: (prev[reaction] || 0) + 1 }));
      setUserReaction(reaction);
    }
    setShowReactions(false);
  };

  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);

  return (
    <div className={`group relative bg-dark-900/50 backdrop-blur-sm border border-dark-700/50 rounded-3xl overflow-hidden hover:border-blue-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 ${featured ? "md:col-span-2" : ""}`}>
      {/* Image if exists */}
      {item.image_url && (
        <div className={`relative ${featured ? "h-72" : "h-56"} overflow-hidden`}>
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/20 to-transparent" />
          
          {/* Pinned Badge */}
          {item.is_pinned && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/90 backdrop-blur-sm rounded-full">
              <Pin className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-semibold text-white">Pinned</span>
            </div>
          )}

          {/* Type Badge with color */}
          <div className="absolute top-4 right-4">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 ${badge.bgClass}/90 backdrop-blur-sm rounded-full`}>
              <BadgeIcon className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-semibold text-white">{badge.text}</span>
            </div>
          </div>

          {/* Featured Badge */}
          {featured && (
            <div className="absolute bottom-4 left-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-accent-500 to-glow backdrop-blur-sm rounded-full">
                <span className="text-xs font-semibold text-white">🔥 Featured</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={`p-5 space-y-4 ${featured ? "md:p-6" : ""}`}>
        {/* Header with badges (when no image) */}
        {!item.image_url && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {item.is_pinned && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 rounded-full">
                  <Pin className="w-3 h-3 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">Pinned</span>
                </div>
              )}
              {featured && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-accent-500/20 to-glow/20 rounded-full">
                  <span className="text-xs font-medium text-accent-400">🔥 Featured</span>
                </div>
              )}
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 ${badge.bgLightClass} rounded-full`}>
              <BadgeIcon className={`w-3 h-3 ${badge.textClass}`} />
              <span className={`text-xs font-medium ${badge.textClass}`}>{badge.text}</span>
            </div>
          </div>
        )}

        {/* Society Info */}
        <div className="flex items-center justify-between">
          <Link
            href={`/societies/${item.society_slug}`}
            className="flex items-center gap-2.5 group/society"
          >
            {item.society_logo ? (
              <Image
                src={item.society_logo}
                alt={item.society_name}
                width={featured ? 40 : 32}
                height={featured ? 40 : 32}
                className="rounded-xl ring-2 ring-dark-700 group-hover/society:ring-blue-500/50 transition-all"
              />
            ) : (
              <div className={`${featured ? "w-10 h-10" : "w-8 h-8"} rounded-xl bg-gradient-to-br from-blue-500 to-accent-600 flex items-center justify-center`}>
                <span className={`${featured ? "text-base" : "text-sm"} font-bold text-white`}>
                  {item.society_name[0]}
                </span>
              </div>
            )}
            <div>
              <span className="text-sm text-white font-medium group-hover/society:text-blue-400 transition-colors">
                {item.society_name}
              </span>
              <p className="text-xs text-dark-400">{timeAgo}</p>
            </div>
          </Link>
        </div>

        {/* Title */}
        <h3 className={`${featured ? "text-2xl" : "text-xl"} font-bold text-white leading-tight line-clamp-2`}>
          {item.title}
        </h3>

        {/* Description */}
        {item.description && (
          <p className={`text-dark-300 text-sm leading-relaxed ${featured ? "line-clamp-4" : "line-clamp-3"}`}>
            {item.description}
          </p>
        )}

        {/* Author */}
        {item.author_name && (
          <div className="flex items-center gap-2 text-xs text-dark-400">
            {item.author_avatar ? (
              <Image
                src={item.author_avatar}
                alt={item.author_name}
                width={20}
                height={20}
                className="rounded-full"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-dark-700 flex items-center justify-center">
                <span className="text-[10px] text-dark-400">
                  {item.author_name[0]}
                </span>
              </div>
            )}
            <span>by {item.author_name}</span>
          </div>
        )}

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-dark-700/50">
          {/* Reactions */}
          <div className="relative flex items-center gap-1">
            <button
              onClick={() => setShowReactions(!showReactions)}
              onBlur={() => setTimeout(() => setShowReactions(false), 200)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-dark-300 hover:bg-dark-700/50 transition-colors"
            >
              {userReaction ? (
                <span className="text-lg">{REACTIONS.find(r => r.name === userReaction)?.emoji}</span>
              ) : (
                <span className="text-lg">👍</span>
              )}
              <span>{totalReactions}</span>
            </button>

            {/* Reactions Popup */}
            {showReactions && (
              <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1 px-2 py-1.5 bg-dark-800 border border-dark-600 rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
                {REACTIONS.map((reaction) => (
                  <button
                    key={reaction.name}
                    onClick={() => handleReaction(reaction.name)}
                    className={`text-xl hover:scale-125 transition-transform p-1 rounded-lg ${userReaction === reaction.name ? "bg-dark-600" : "hover:bg-dark-700"}`}
                  >
                    {reaction.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Other Actions */}
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-dark-300 hover:bg-dark-700/50 hover:text-white transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Comment</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-dark-300 hover:bg-dark-700/50 hover:text-white transition-colors">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button 
              onClick={() => setSaved(!saved)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-colors ${saved ? "text-amber-400 bg-amber-500/20" : "text-dark-300 hover:bg-dark-700/50 hover:text-white"}`}
            >
              <Bookmark className={`w-4 h-4 ${saved ? "fill-amber-400" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5" />
      </div>
    </div>
  );
}
