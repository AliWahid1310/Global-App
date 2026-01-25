"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getFeedItems } from "@/lib/actions/feed";
import { EventFeedCard } from "./EventFeedCard";
import { AnnouncementFeedCard } from "./AnnouncementFeedCard";
import type { FeedItem, EventFeedItem, AnnouncementFeedItem } from "@/types/database";
import { Loader2, Inbox, Sparkles } from "lucide-react";

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
    <div className="space-y-6">
      {/* Feed Items */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={`${item.type}-${item.id}`}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
          >
            {item.type === "event" ? (
              <EventFeedCard item={item as EventFeedItem} />
            ) : (
              <AnnouncementFeedCard item={item as AnnouncementFeedItem} />
            )}
          </div>
        ))}
      </div>

      {/* Loader / End of feed */}
      <div ref={loaderRef} className="flex justify-center py-8">
        {loading && (
          <div className="flex items-center gap-3 text-dark-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading more...</span>
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <div className="flex flex-col items-center gap-2 text-dark-500">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm">You're all caught up!</span>
          </div>
        )}
      </div>
    </div>
  );
}
