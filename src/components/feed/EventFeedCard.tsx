"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { rsvpToEvent, cancelRSVP } from "@/lib/actions/events";
import type { EventFeedItem, RSVPStatus } from "@/types/database";
import {
  MapPin,
  Users,
  Check,
  Clock,
  Loader2,
  Sparkles,
  MessageCircle,
  Share2,
  Bookmark,
} from "lucide-react";

interface EventFeedCardProps {
  item: EventFeedItem;
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

export function EventFeedCard({ item, featured = false }: EventFeedCardProps) {
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus | null>(item.user_rsvp_status);
  const [loading, setLoading] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(item.rsvp_count);
  const [reactions, setReactions] = useState<Record<string, number>>({
    like: Math.floor(Math.random() * 15),
    fire: Math.floor(Math.random() * 8),
    celebrate: Math.floor(Math.random() * 5),
  });
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const eventDate = new Date(item.start_time);
  const isToday = eventDate.toDateString() === new Date().toDateString();
  const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

  const handleRSVP = async (status: RSVPStatus) => {
    setLoading(true);
    try {
      if (rsvpStatus === status) {
        await cancelRSVP(item.id);
        setRsvpStatus(null);
        setRsvpCount((prev) => ({
          ...prev,
          going: status === "going" ? prev.going - 1 : prev.going,
          maybe: status === "maybe" ? prev.maybe - 1 : prev.maybe,
        }));
      } else {
        const result = await rsvpToEvent(item.id, status, 0);
        if (!result.error) {
          const newCount = { ...rsvpCount };
          if (rsvpStatus === "going") newCount.going -= 1;
          if (rsvpStatus === "maybe") newCount.maybe -= 1;
          if (status === "going") newCount.going += 1;
          if (status === "maybe") newCount.maybe += 1;
          setRsvpCount(newCount);
          setRsvpStatus(status);
        }
      }
    } catch (error) {
      console.error("RSVP error:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const getDateLabel = () => {
    if (isToday) return "Today";
    if (isTomorrow) return "Tomorrow";
    return format(eventDate, "EEE, MMM d");
  };

  return (
    <div className={`group relative bg-dark-900/50 backdrop-blur-sm border border-dark-700/50 rounded-3xl overflow-hidden hover:border-purple-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 ${featured ? "md:col-span-2" : ""}`}>
      {/* Event Image or Gradient */}
      <div className={`relative ${featured ? "h-72" : "h-48"} overflow-hidden`}>
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-accent-700 to-dark-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent" />

        {/* Date Badge */}
        <div className="absolute top-4 left-4">
          <div className="glass px-4 py-2 rounded-2xl">
            <p className="text-xs text-purple-300 font-medium uppercase tracking-wider">
              {getDateLabel()}
            </p>
            <p className="text-white font-bold">{format(eventDate, "h:mm a")}</p>
          </div>
        </div>

        {/* Event Type Badge - Purple for events */}
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/90 backdrop-blur-sm rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-semibold text-white">Event</span>
          </div>
        </div>

        {/* Featured Badge */}
        {featured && (
          <div className="absolute bottom-4 left-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 backdrop-blur-sm rounded-full">
              <span className="text-xs font-semibold text-white">🔥 Featured</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`p-5 space-y-3 ${featured ? "md:p-6" : ""}`}>
        {/* Title */}
        <Link href={`/events/${item.id}`}>
          <h3 className={`${featured ? "text-2xl" : "text-xl"} font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-2 leading-tight`}>
            {item.title}
          </h3>
        </Link>

        {/* Society Info */}
        <Link
          href={`/societies/${item.society_slug}`}
          className="inline-flex items-center gap-2 group/society"
        >
          {item.society_logo ? (
            <Image
              src={item.society_logo}
              alt={item.society_name}
              width={20}
              height={20}
              className="rounded-md ring-1 ring-dark-700 group-hover/society:ring-purple-500/50 transition-all"
            />
          ) : (
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-purple-500 to-accent-700 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">
                {item.society_name[0]}
              </span>
            </div>
          )}
          <span className="text-xs text-dark-400 group-hover/society:text-purple-400 transition-colors">
            {item.society_name}
          </span>
        </Link>

        {/* Description */}
        {item.description && (
          <p className={`text-dark-300 text-sm line-clamp-2 leading-relaxed ${featured ? "line-clamp-3" : ""}`}>
            {item.description}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap gap-3 text-sm">
          {item.location && (
            <div className="flex items-center gap-1.5 text-dark-400">
              <MapPin className="w-4 h-4 text-glow" />
              <span className="line-clamp-1">{item.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-dark-400">
            <Users className="w-4 h-4 text-purple-400" />
            <span>{rsvpCount.going} going</span>
          </div>
        </div>

        {/* RSVP Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => handleRSVP("going")}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
              rsvpStatus === "going"
                ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
                : "bg-dark-700 text-dark-200 hover:bg-green-500/20 hover:text-green-400"
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                {rsvpStatus === "going" ? "Going!" : "Going"}
              </>
            )}
          </button>
          <button
            onClick={() => handleRSVP("maybe")}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
              rsvpStatus === "maybe"
                ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                : "bg-dark-700 text-dark-200 hover:bg-amber-500/20 hover:text-amber-400"
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Clock className="w-4 h-4" />
                Maybe
              </>
            )}
          </button>
        </div>

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
              <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1 px-2 py-1.5 bg-dark-800 border border-dark-600 rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200 z-10">
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
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/5 via-transparent to-purple-500/5" />
      </div>
    </div>
  );
}
