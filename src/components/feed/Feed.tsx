"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getFeedItems } from "@/lib/actions/feed";
import { AnnouncementFeedCard } from "./AnnouncementFeedCard";
import type { FeedItem, EventFeedItem, AnnouncementFeedItem } from "@/types/database";
import type { RSVPStatus } from "@/types/database";
import { rsvpToEvent, cancelRSVP } from "@/lib/actions/events";
import { Loader2, Inbox, Flame, Megaphone, ChevronRight, X } from "lucide-react";
import Image from "next/image";

interface FeedProps {
  initialItems: FeedItem[];
  initialHasMore: boolean;
}

export function Feed({ initialItems, initialHasMore }: FeedProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Separate items by type
  const events = items.filter((item) => item.type === "event") as EventFeedItem[];
  const announcements = items.filter((item) => item.type === "announcement") as AnnouncementFeedItem[];

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const result = await getFeedItems(page);
      setItems((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setPage((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to load more items:", error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, loading]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-dark-800 flex items-center justify-center mb-6">
          <Inbox className="w-10 h-10 text-dark-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Your feed is empty</h3>
        <p className="text-dark-400 max-w-sm">
          Join some societies to see events and announcements from your campus community!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ========== EVENTS SECTION - Horizontal Scroll ========== */}
      {events.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl">
                <Flame className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Happening Now 🔥</h2>
                <p className="text-sm text-dark-400">Events from your societies</p>
              </div>
            </div>
            <a
              href="/events"
              className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors group"
            >
              See all
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* Horizontal Scrollable Events - Netflix Style */}
          <div className="relative -mx-4 px-4">
            <div 
              className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {events.map((event, index) => (
                <div
                  key={event.id}
                  className="flex-shrink-0 w-[320px] snap-start animate-in fade-in slide-in-from-right-4 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <EventHorizontalCard item={event} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== ANNOUNCEMENTS SECTION - Vertical Stack ========== */}
      {announcements.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl">
                <Megaphone className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Updates 📢</h2>
                <p className="text-sm text-dark-400">Latest announcements</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {announcements.slice(0, 5).map((announcement, index) => (
              <div
                key={announcement.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                <AnnouncementFeedCard item={announcement} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Loader / End of feed */}
      <div ref={loaderRef} className="flex justify-center py-8">
        {loading && (
          <div className="flex items-center gap-3 text-dark-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading more...</span>
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <div className="text-center">
            <p className="text-dark-500 text-sm">You&apos;re all caught up! ✨</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== EVENT HORIZONTAL CARD (Netflix Style) ==========
function EventHorizontalCard({ item }: { item: EventFeedItem }) {
  const [rsvpStatus, setRsvpStatus] = useState(item.user_rsvp_status);
  const [loading, setLoading] = useState<"going" | "maybe" | null>(null);
  const [rsvpCount, setRsvpCount] = useState(item.rsvp_count);

  const eventDate = new Date(item.start_time);
  const isToday = eventDate.toDateString() === new Date().toDateString();
  const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

  const handleRSVP = async (status: RSVPStatus) => {
    if (loading) return;
    
    // Optimistic update - update UI immediately
    const previousStatus = rsvpStatus;
    const previousCount = { ...rsvpCount };
    
    setLoading(status as "going" | "maybe");
    
    // Optimistically update the UI
    if (rsvpStatus === status) {
      setRsvpStatus(null);
      setRsvpCount((prev) => ({
        ...prev,
        going: status === "going" ? prev.going - 1 : prev.going,
        maybe: status === "maybe" ? prev.maybe - 1 : prev.maybe,
      }));
    } else {
      const newCount = { ...rsvpCount };
      if (rsvpStatus === "going") newCount.going -= 1;
      if (rsvpStatus === "maybe") newCount.maybe -= 1;
      if (status === "going") newCount.going += 1;
      if (status === "maybe") newCount.maybe += 1;
      setRsvpCount(newCount);
      setRsvpStatus(status);
    }

    try {
      if (previousStatus === status) {
        await cancelRSVP(item.id);
      } else {
        const result = await rsvpToEvent(item.id, status, 0);
        if (result.error) {
          // Revert on error
          setRsvpStatus(previousStatus);
          setRsvpCount(previousCount);
        }
      }
    } catch (error) {
      // Revert on error
      setRsvpStatus(previousStatus);
      setRsvpCount(previousCount);
      console.error("RSVP error:", error);
    } finally {
      setLoading(null);
    }
  };

  const getDateLabel = () => {
    if (isToday) return "Today";
    if (isTomorrow) return "Tomorrow";
    return eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const getTimeLabel = () => {
    return eventDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="group relative bg-dark-900/60 backdrop-blur-sm border border-dark-700/50 rounded-2xl overflow-hidden hover:border-purple-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-accent-700 to-dark-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/30 to-transparent" />

        {/* Date Badge */}
        <div className="absolute top-3 left-3">
          <div className="glass px-3 py-1.5 rounded-xl text-center">
            <p className="text-[10px] text-purple-300 font-semibold uppercase tracking-wide">
              {getDateLabel()}
            </p>
            <p className="text-white font-bold text-sm">{getTimeLabel()}</p>
          </div>
        </div>

        {/* RSVP Count */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-1 bg-dark-900/80 backdrop-blur-sm rounded-lg">
            <span className="text-xs text-white font-medium">{rsvpCount.going}</span>
            <span className="text-[10px] text-green-400 font-semibold">going</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <a href={`/events/${item.id}`}>
          <h3 className="font-bold text-white text-base group-hover:text-purple-400 transition-colors line-clamp-2 leading-tight">
            {item.title}
          </h3>
        </a>

        {/* Society */}
        <div className="flex items-center gap-2">
          {item.society_logo ? (
            <Image
              src={item.society_logo}
              alt={item.society_name}
              width={18}
              height={18}
              className="rounded-md"
            />
          ) : (
            <div className="w-[18px] h-[18px] rounded-md bg-gradient-to-br from-purple-500 to-accent-700 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">{item.society_name[0]}</span>
            </div>
          )}
          <span className="text-xs text-dark-400 truncate">{item.society_name}</span>
        </div>

        {/* RSVP Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => handleRSVP("going")}
            disabled={loading !== null}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
              rsvpStatus === "going"
                ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
                : "bg-dark-800 text-dark-300 hover:bg-green-500/20 hover:text-green-400"
            }`}
          >
            {loading === "going" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : rsvpStatus === "going" ? (
              "✓ Going"
            ) : (
              "Going"
            )}
          </button>
          <button
            onClick={() => handleRSVP("maybe")}
            disabled={loading !== null}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
              rsvpStatus === "maybe"
                ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                : "bg-dark-800 text-dark-300 hover:bg-amber-500/20 hover:text-amber-400"
            }`}
          >
            {loading === "maybe" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : rsvpStatus === "maybe" ? (
              "✓ Maybe"
            ) : (
              "Maybe"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
