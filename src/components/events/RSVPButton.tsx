"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rsvpToEvent, cancelRSVP } from "@/lib/actions/events";
import type { RSVPStatus, EventRSVP, Event } from "@/types/database";
import {
  Check,
  HelpCircle,
  X,
  Loader2,
  Users,
  ChevronDown,
  Calendar,
  Clock,
} from "lucide-react";

interface RSVPButtonProps {
  event: Event;
  userRSVP: EventRSVP | null;
  rsvpCount: {
    going: number;
    maybe: number;
    waitlist: number;
    total_guests: number;
  };
  isLoggedIn: boolean;
}

export function RSVPButton({
  event,
  userRSVP,
  rsvpCount,
  isLoggedIn,
}: RSVPButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestCount, setGuestCount] = useState(userRSVP?.guest_count || 0);
  const [pendingStatus, setPendingStatus] = useState<RSVPStatus | null>(null);
  const router = useRouter();

  const isAtCapacity =
    event.capacity &&
    rsvpCount.going + rsvpCount.total_guests >= event.capacity;
  const isPastDeadline =
    event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date();
  const isPastEvent = new Date(event.start_time) < new Date();

  const handleRSVP = async (status: RSVPStatus) => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/events/${event.id}`);
      return;
    }

    // If allowing guests and going, show guest modal
    if (event.allow_guests && status === "going" && !showGuestModal) {
      setPendingStatus(status);
      setShowGuestModal(true);
      setShowOptions(false);
      return;
    }

    setLoading(true);
    setShowOptions(false);
    setShowGuestModal(false);

    try {
      const result = await rsvpToEvent(event.id, status, guestCount);
      if (result.error) {
        console.error(result.error);
      }
      router.refresh();
    } catch (error) {
      console.error("RSVP failed:", error);
    } finally {
      setLoading(false);
      setPendingStatus(null);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await cancelRSVP(event.id);
      router.refresh();
    } catch (error) {
      console.error("Cancel RSVP failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmGuestRSVP = () => {
    if (pendingStatus) {
      handleRSVP(pendingStatus);
    }
  };

  // Disabled state
  if (isPastEvent) {
    return (
      <div className="px-6 py-3 bg-dark-700 text-dark-400 rounded-xl text-center">
        Event has ended
      </div>
    );
  }

  if (isPastDeadline) {
    return (
      <div className="px-6 py-3 bg-dark-700 text-dark-400 rounded-xl text-center">
        RSVP deadline passed
      </div>
    );
  }

  // Already RSVPed
  if (userRSVP) {
    return (
      <div className="relative">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOptions(!showOptions)}
            disabled={loading}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
              userRSVP.status === "going"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : userRSVP.status === "maybe"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : userRSVP.status === "waitlist"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-dark-700 text-dark-300 border border-dark-600"
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : userRSVP.status === "going" ? (
              <Check className="w-4 h-4" />
            ) : userRSVP.status === "maybe" ? (
              <HelpCircle className="w-4 h-4" />
            ) : userRSVP.status === "waitlist" ? (
              <Clock className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
            <span className="capitalize">
              {userRSVP.status === "waitlist" ? "On Waitlist" : userRSVP.status}
            </span>
            {userRSVP.guest_count > 0 && (
              <span className="text-xs opacity-75">
                +{userRSVP.guest_count} guest{userRSVP.guest_count > 1 ? "s" : ""}
              </span>
            )}
            <ChevronDown className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Dropdown options */}
        {showOptions && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowOptions(false)}
            />
            <div className="absolute top-full left-0 mt-2 w-48 glass rounded-xl overflow-hidden z-50 animate-slide-down">
              {userRSVP.status !== "going" && (
                <button
                  onClick={() => handleRSVP("going")}
                  className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                  <Check className="w-4 h-4 text-green-400" />
                  Going
                </button>
              )}
              {userRSVP.status !== "maybe" && (
                <button
                  onClick={() => handleRSVP("maybe")}
                  className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  Maybe
                </button>
              )}
              <button
                onClick={handleCancel}
                className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2 transition-colors border-t border-dark-600"
              >
                <X className="w-4 h-4" />
                Cancel RSVP
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // New RSVP
  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleRSVP("going")}
          disabled={loading || (isAtCapacity && !event.capacity) || false}
          className="flex items-center gap-2 px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-glow"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Calendar className="w-4 h-4" />
          )}
          {isAtCapacity ? "Join Waitlist" : "RSVP"}
        </button>
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="p-3 bg-dark-700 hover:bg-dark-600 rounded-xl transition-colors"
        >
          <ChevronDown className="w-4 h-4 text-dark-300" />
        </button>
      </div>

      {/* Options dropdown */}
      {showOptions && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowOptions(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-48 glass rounded-xl overflow-hidden z-50 animate-slide-down">
            <button
              onClick={() => handleRSVP("going")}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4 text-green-400" />
              {isAtCapacity ? "Join Waitlist" : "Going"}
            </button>
            <button
              onClick={() => handleRSVP("maybe")}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              Maybe
            </button>
            <button
              onClick={() => handleRSVP("not_going")}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
            >
              <X className="w-4 h-4 text-dark-400" />
              Not Going
            </button>
          </div>
        </>
      )}

      {/* Guest modal */}
      {showGuestModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowGuestModal(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-72 glass rounded-xl p-4 z-50 animate-slide-down">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-accent-400" />
              Bringing Guests?
            </h4>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setGuestCount(Math.max(0, guestCount - 1))}
                className="w-10 h-10 rounded-lg bg-dark-700 hover:bg-dark-600 text-white flex items-center justify-center transition-colors"
              >
                -
              </button>
              <span className="text-2xl font-bold text-white w-12 text-center">
                {guestCount}
              </span>
              <button
                onClick={() =>
                  setGuestCount(
                    Math.min(
                      event.max_guests_per_rsvp || 10,
                      guestCount + 1
                    )
                  )
                }
                className="w-10 h-10 rounded-lg bg-dark-700 hover:bg-dark-600 text-white flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
            {event.max_guests_per_rsvp && (
              <p className="text-xs text-dark-400 mb-3">
                Maximum {event.max_guests_per_rsvp} guests allowed
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowGuestModal(false);
                  setPendingStatus(null);
                }}
                className="flex-1 px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmGuestRSVP}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
