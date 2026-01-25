"use client";

import { useState } from "react";
import Image from "next/image";
import type { RSVPWithUser } from "@/types/database";
import {
  User,
  Check,
  HelpCircle,
  Clock,
  Users,
  Search,
  ChevronDown,
  CheckCircle,
} from "lucide-react";

interface AttendeesListProps {
  attendees: RSVPWithUser[];
  showCheckinStatus?: boolean;
  maxDisplay?: number;
}

export function AttendeesList({
  attendees,
  showCheckinStatus = false,
  maxDisplay = 10,
}: AttendeesListProps) {
  const [filter, setFilter] = useState<"all" | "going" | "maybe" | "waitlist">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filteredAttendees = attendees.filter((a) => {
    const matchesFilter = filter === "all" || a.status === filter;
    const matchesSearch =
      !searchQuery ||
      a.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const displayedAttendees = showAll
    ? filteredAttendees
    : filteredAttendees.slice(0, maxDisplay);

  const goingCount = attendees.filter((a) => a.status === "going").length;
  const maybeCount = attendees.filter((a) => a.status === "maybe").length;
  const waitlistCount = attendees.filter((a) => a.status === "waitlist").length;
  const totalGuests = attendees
    .filter((a) => a.status === "going")
    .reduce((sum, a) => sum + (a.guest_count || 0), 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            filter === "all"
              ? "bg-accent-500 text-white"
              : "bg-dark-700 text-dark-300 hover:bg-dark-600"
          }`}
        >
          All ({attendees.length})
        </button>
        <button
          onClick={() => setFilter("going")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
            filter === "going"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-dark-700 text-dark-300 hover:bg-dark-600"
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          Going ({goingCount})
          {totalGuests > 0 && (
            <span className="text-xs opacity-75">+{totalGuests} guests</span>
          )}
        </button>
        <button
          onClick={() => setFilter("maybe")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
            filter === "maybe"
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "bg-dark-700 text-dark-300 hover:bg-dark-600"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Maybe ({maybeCount})
        </button>
        {waitlistCount > 0 && (
          <button
            onClick={() => setFilter("waitlist")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
              filter === "waitlist"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-dark-700 text-dark-300 hover:bg-dark-600"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Waitlist ({waitlistCount})
          </button>
        )}
      </div>

      {/* Search */}
      {attendees.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search attendees..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
        </div>
      )}

      {/* Attendees list */}
      {displayedAttendees.length > 0 ? (
        <div className="space-y-2">
          {displayedAttendees.map((attendee) => (
            <div
              key={attendee.id}
              className="flex items-center justify-between p-3 bg-dark-800/50 rounded-xl hover:bg-dark-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-dark-700 overflow-hidden flex items-center justify-center">
                  {attendee.user?.avatar_url ? (
                    <Image
                      src={attendee.user.avatar_url}
                      alt={attendee.user.full_name || "User"}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-dark-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {attendee.user?.full_name || "Unknown User"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-dark-400">
                    {attendee.status === "going" && (
                      <span className="text-green-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Going
                      </span>
                    )}
                    {attendee.status === "maybe" && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <HelpCircle className="w-3 h-3" /> Maybe
                      </span>
                    )}
                    {attendee.status === "waitlist" && (
                      <span className="text-blue-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Waitlist
                      </span>
                    )}
                    {attendee.guest_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />+{attendee.guest_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {showCheckinStatus && (
                <div>
                  {attendee.checkin ? (
                    <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-lg">
                      <CheckCircle className="w-3 h-3" />
                      Checked in
                    </span>
                  ) : (
                    <span className="text-xs text-dark-500">Not checked in</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Users className="w-10 h-10 text-dark-500 mx-auto mb-2" />
          <p className="text-dark-400 text-sm">No attendees yet</p>
        </div>
      )}

      {/* Show more */}
      {filteredAttendees.length > maxDisplay && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-3 text-sm text-accent-400 hover:text-accent-300 flex items-center justify-center gap-1 transition-colors"
        >
          Show all {filteredAttendees.length} attendees
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Compact version for preview
export function AttendeesPreview({
  attendees,
  limit = 5,
}: {
  attendees: RSVPWithUser[];
  limit?: number;
}) {
  const goingAttendees = attendees.filter((a) => a.status === "going");
  const displayAttendees = goingAttendees.slice(0, limit);
  const remaining = goingAttendees.length - limit;

  if (goingAttendees.length === 0) return null;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {displayAttendees.map((attendee) => (
          <div
            key={attendee.id}
            className="w-8 h-8 rounded-full bg-dark-700 border-2 border-dark-900 overflow-hidden"
          >
            {attendee.user?.avatar_url ? (
              <Image
                src={attendee.user.avatar_url}
                alt={attendee.user.full_name || "User"}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-4 h-4 text-dark-400" />
              </div>
            )}
          </div>
        ))}
        {remaining > 0 && (
          <div className="w-8 h-8 rounded-full bg-dark-600 border-2 border-dark-900 flex items-center justify-center text-xs font-medium text-dark-200">
            +{remaining}
          </div>
        )}
      </div>
      <span className="ml-3 text-sm text-dark-300">
        {goingAttendees.length} going
      </span>
    </div>
  );
}
