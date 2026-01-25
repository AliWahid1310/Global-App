"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { AnnouncementFeedItem } from "@/types/database";
import { Megaphone, Pin, MessageCircle } from "lucide-react";

interface AnnouncementFeedCardProps {
  item: AnnouncementFeedItem;
}

export function AnnouncementFeedCard({ item }: AnnouncementFeedCardProps) {
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

  return (
    <div className="group relative bg-dark-900/50 backdrop-blur-sm border border-dark-700/50 rounded-3xl overflow-hidden hover:border-glow/30 transition-all duration-500 hover:shadow-2xl hover:shadow-glow/10">
      {/* Image if exists */}
      {item.image_url && (
        <div className="relative h-56 overflow-hidden">
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

          {/* Type Badge */}
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-glow/90 backdrop-blur-sm rounded-full">
              <Megaphone className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-semibold text-white">Announcement</span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-5 space-y-4">
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
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-glow/20 rounded-full">
              <Megaphone className="w-3 h-3 text-glow" />
              <span className="text-xs font-medium text-glow">Announcement</span>
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
                width={32}
                height={32}
                className="rounded-xl ring-2 ring-dark-700 group-hover/society:ring-glow/50 transition-all"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-glow to-accent-600 flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {item.society_name[0]}
                </span>
              </div>
            )}
            <div>
              <span className="text-sm text-white font-medium group-hover/society:text-glow transition-colors">
                {item.society_name}
              </span>
              <p className="text-xs text-dark-400">{timeAgo}</p>
            </div>
          </Link>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white leading-tight line-clamp-2">
          {item.title}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-dark-300 text-sm leading-relaxed line-clamp-3">
            {item.description}
          </p>
        )}

        {/* Author */}
        {item.author_name && (
          <div className="flex items-center gap-2 pt-2 border-t border-dark-700/50">
            {item.author_avatar ? (
              <Image
                src={item.author_avatar}
                alt={item.author_name}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-dark-700 flex items-center justify-center">
                <span className="text-xs text-dark-400">
                  {item.author_name[0]}
                </span>
              </div>
            )}
            <span className="text-xs text-dark-400">
              Posted by <span className="text-dark-300">{item.author_name}</span>
            </span>
          </div>
        )}
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-glow/5 via-transparent to-glow/5" />
      </div>
    </div>
  );
}
