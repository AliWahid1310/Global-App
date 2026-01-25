"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { rsvpToEvent, cancelRSVP } from "@/lib/actions/events";
import type { EventFeedItem, RSVPStatus } from "@/types/database";
import {
  Calendar,
  MapPin,
  Users,
  Check,
  Clock,
  Loader2,
  Sparkles,
} from "lucide-react";

interface EventFeedCardProps {
  item: EventFeedItem;
}

export function EventFeedCard({ item }: EventFeedCardProps) {
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus | null>(item.user_rsvp_status);
  const [loading, setLoading] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(item.rsvp_count);

  const eventDate = new Date(item.start_time);
  const isToday = eventDate.toDateString() === new Date().toDateString();
  const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

  const handleRSVP = async (status: RSVPStatus) => {
    setLoading(true);
    try {
      if (rsvpStatus === status) {
        // Cancel RSVP
        await cancelRSVP(item.id);
        setRsvpStatus(null);
        setRsvpCount((prev) => ({
          ...prev,
          going: status === "going" ? prev.going - 1 : prev.going,
          maybe: status === "maybe" ? prev.maybe - 1 : prev.maybe,
        }));
      } else {
        // Update RSVP
        const result = await rsvpToEvent(item.id, status, 0);
        if (!result.error) {
          // Adjust counts
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

  const getDateLabel = () => {
    if (isToday) return "Today";
    if (isTomorrow) return "Tomorrow";
    return format(eventDate, "EEE, MMM d");
  };

  return (
    <div className="group relative bg-dark-900/50 backdrop-blur-sm border border-dark-700/50 rounded-3xl overflow-hidden hover:border-accent-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-accent-500/10">
      {/* Event Image or Gradient */}
      <div className="relative h-48 overflow-hidden">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent-600 via-accent-700 to-dark-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent" />

        {/* Date Badge */}
        <div className="absolute top-4 left-4">
          <div className="glass px-4 py-2 rounded-2xl">
            <p className="text-xs text-accent-300 font-medium uppercase tracking-wider">
              {getDateLabel()}
            </p>
            <p className="text-white font-bold">{format(eventDate, "h:mm a")}</p>
          </div>
        </div>

        {/* Event Type Badge */}
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-500/90 backdrop-blur-sm rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-semibold text-white">Event</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Title - Make it prominent */}
        <Link href={`/events/${item.id}`}>
          <h3 className="text-xl font-bold text-white group-hover:text-accent-400 transition-colors line-clamp-2 leading-tight">
            {item.title}
          </h3>
        </Link>

        {/* Society Info - Below title */}
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
              className="rounded-md ring-1 ring-dark-700 group-hover/society:ring-accent-500/50 transition-all"
            />
          ) : (
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">
                {item.society_name[0]}
              </span>
            </div>
          )}
          <span className="text-xs text-dark-400 group-hover/society:text-accent-400 transition-colors">
            {item.society_name}
          </span>
        </Link>

        {/* Description */}
        {item.description && (
          <p className="text-dark-300 text-sm line-clamp-2 leading-relaxed">
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
            <Users className="w-4 h-4 text-accent-400" />
            <span>{rsvpCount.going} going</span>
          </div>
        </div>

        {/* RSVP Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => handleRSVP("going")}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
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
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
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
                {rsvpStatus === "maybe" ? "Maybe" : "Maybe"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-accent-500/5 via-transparent to-accent-500/5" />
      </div>
    </div>
  );
}
