"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rsvpToEvent, cancelRSVP } from "@/lib/actions/events";
import { getUserFriendlyError } from "@/lib/utils/errors";
import type { RSVPStatus, EventRSVP, Event } from "@/types/database";
import { format } from "date-fns";
import {
  Check,
  HelpCircle,
  X,
  Loader2,
  Users,
  ChevronDown,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface RSVPSectionProps {
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

export function RSVPSection({
  event,
  userRSVP: initialUserRSVP,
  rsvpCount: initialRsvpCount,
  isLoggedIn,
}: RSVPSectionProps) {
  // Optimistic state for both stats and button
  const [currentRSVP, setCurrentRSVP] = useState<{
    status: RSVPStatus | null;
    guest_count: number;
  } | null>(initialUserRSVP ? { status: initialUserRSVP.status as RSVPStatus, guest_count: initialUserRSVP.guest_count } : null);
  
  const [counts, setCounts] = useState(initialRsvpCount);
  const [loading, setLoading] = useState<RSVPStatus | "cancel" | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestCount, setGuestCount] = useState(initialUserRSVP?.guest_count || 0);
  const [pendingStatus, setPendingStatus] = useState<RSVPStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const totalAttending = counts.going + counts.total_guests;
  const isAtCapacity = event.capacity && totalAttending >= event.capacity;
  const spotsLeft = event.capacity ? event.capacity - totalAttending : null;
  const isPastDeadline = event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date();
  const isPastEvent = new Date(event.start_time) < new Date();

  const handleRSVP = async (status: RSVPStatus) => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/events/${event.id}`);
      return;
    }

    if (event.allow_guests && status === "going" && !showGuestModal) {
      setPendingStatus(status);
      setShowGuestModal(true);
      setShowOptions(false);
      return;
    }

    const previousRSVP = currentRSVP;
    const previousCounts = { ...counts };

    setLoading(status);
    setShowOptions(false);
    setShowGuestModal(false);
    setError(null);

    // Optimistic update for counts
    const newCounts = { ...counts };
    if (previousRSVP?.status === "going") {
      newCounts.going -= 1;
      newCounts.total_guests -= (previousRSVP.guest_count || 0);
    }
    if (previousRSVP?.status === "maybe") newCounts.maybe -= 1;
    if (previousRSVP?.status === "waitlist") newCounts.waitlist -= 1;
    
    if (status === "going") {
      newCounts.going += 1;
      newCounts.total_guests += guestCount;
    }
    if (status === "maybe") newCounts.maybe += 1;
    if (status === "waitlist") newCounts.waitlist += 1;

    setCurrentRSVP({ status, guest_count: guestCount });
    setCounts(newCounts);

    try {
      const result = await rsvpToEvent(event.id, status, guestCount);
      if (result.error) {
        setCurrentRSVP(previousRSVP);
        setCounts(previousCounts);
        setError(getUserFriendlyError(result.error));
      } else {
        router.refresh();
      }
    } catch (err) {
      setCurrentRSVP(previousRSVP);
      setCounts(previousCounts);
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(null);
      setPendingStatus(null);
    }
  };

  const handleCancel = async () => {
    const previousRSVP = currentRSVP;
    const previousCounts = { ...counts };

    setLoading("cancel");
    setShowOptions(false);
    setError(null);

    const newCounts = { ...counts };
    if (previousRSVP?.status === "going") {
      newCounts.going -= 1;
      newCounts.total_guests -= (previousRSVP.guest_count || 0);
    }
    if (previousRSVP?.status === "maybe") newCounts.maybe -= 1;
    if (previousRSVP?.status === "waitlist") newCounts.waitlist -= 1;

    setCurrentRSVP(null);
    setCounts(newCounts);

    try {
      const result = await cancelRSVP(event.id);
      if (result.error) {
        setCurrentRSVP(previousRSVP);
        setCounts(previousCounts);
        setError(getUserFriendlyError(result.error));
      } else {
        router.refresh();
      }
    } catch (err) {
      setCurrentRSVP(previousRSVP);
      setCounts(previousCounts);
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(null);
    }
  };

  const confirmGuestRSVP = () => {
    if (pendingStatus) {
      handleRSVP(pendingStatus);
    }
  };

  return (
    <div className="glass rounded-3xl p-6 sticky top-28">
      {/* Attendee Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-2xl font-bold text-white">{counts.going}</span>
          </div>
          <p className="text-xs text-green-400 font-medium">Going</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-2xl font-bold text-white">{counts.maybe}</span>
          </div>
          <p className="text-xs text-amber-400 font-medium">Maybe</p>
        </div>
      </div>
      
      {counts.waitlist > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-6 text-center">
          <span className="text-sm text-blue-400">
            <Users className="w-4 h-4 inline mr-1" />
            {counts.waitlist} on waitlist
          </span>
        </div>
      )}

      {/* Capacity indicator */}
      {event.capacity && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-dark-400">Capacity</span>
            <span className="text-white font-medium">
              {totalAttending} / {event.capacity}
            </span>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                isAtCapacity ? "bg-amber-500" : "bg-accent-500"
              }`}
              style={{
                width: `${Math.min(100, (totalAttending / event.capacity) * 100)}%`,
              }}
            />
          </div>
          {spotsLeft !== null && spotsLeft > 0 && (
            <p className="text-sm text-green-400 mt-2">
              {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
            </p>
          )}
        </div>
      )}

      {/* RSVP deadline warning */}
      {event.rsvp_deadline && new Date(event.rsvp_deadline) > new Date() && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-200">
            RSVP by {format(new Date(event.rsvp_deadline), "MMM d, h:mm a")}
          </p>
        </div>
      )}

      {/* Disabled states */}
      {isPastEvent ? (
        <div className="px-6 py-3 bg-dark-700 text-dark-400 rounded-xl text-center">
          Event has ended
        </div>
      ) : isPastDeadline ? (
        <div className="px-6 py-3 bg-dark-700 text-dark-400 rounded-xl text-center">
          RSVP deadline passed
        </div>
      ) : currentRSVP?.status ? (
        /* Already RSVPed */
        <div className="relative">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOptions(!showOptions)}
              disabled={loading !== null}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all w-full justify-center ${
                currentRSVP.status === "going"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : currentRSVP.status === "maybe"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : currentRSVP.status === "waitlist"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-dark-700 text-dark-300 border border-dark-600"
              }`}
            >
              {loading !== null ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentRSVP.status === "going" ? (
                <Check className="w-4 h-4" />
              ) : currentRSVP.status === "maybe" ? (
                <HelpCircle className="w-4 h-4" />
              ) : currentRSVP.status === "waitlist" ? (
                <Clock className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
              <span className="capitalize">
                {currentRSVP.status === "waitlist" ? "On Waitlist" : currentRSVP.status}
              </span>
              {currentRSVP.guest_count > 0 && (
                <span className="text-xs opacity-75">
                  +{currentRSVP.guest_count} guest{currentRSVP.guest_count > 1 ? "s" : ""}
                </span>
              )}
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
          </div>

          {showOptions && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
              <div className="absolute top-full left-0 right-0 mt-2 glass rounded-xl overflow-hidden z-50 animate-slide-down">
                {currentRSVP.status !== "going" && (
                  <button
                    onClick={() => handleRSVP("going")}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                  >
                    <Check className="w-4 h-4 text-green-400" />
                    Going
                  </button>
                )}
                {currentRSVP.status !== "maybe" && (
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
      ) : (
        /* New RSVP */
        <div className="relative">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRSVP("going")}
              disabled={loading !== null}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 btn-glow"
            >
              {loading === "going" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              {isAtCapacity ? "Join Waitlist" : "RSVP"}
            </button>
            <button
              onClick={() => setShowOptions(!showOptions)}
              disabled={loading !== null}
              className="p-3 bg-dark-700 hover:bg-dark-600 rounded-xl transition-colors disabled:opacity-50"
            >
              <ChevronDown className="w-4 h-4 text-dark-300" />
            </button>
          </div>

          {showOptions && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
              <div className="absolute top-full left-0 right-0 mt-2 glass rounded-xl overflow-hidden z-50 animate-slide-down">
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
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Guest modal */}
      {showGuestModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowGuestModal(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 glass rounded-xl p-4 z-50 animate-slide-down">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-accent-400" />
              Bringing Guests?
            </h4>
            <div className="flex items-center justify-center gap-3 mb-4">
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
                onClick={() => setGuestCount(Math.min(event.max_guests_per_rsvp || 10, guestCount + 1))}
                className="w-10 h-10 rounded-lg bg-dark-700 hover:bg-dark-600 text-white flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
            {event.max_guests_per_rsvp && (
              <p className="text-xs text-dark-400 mb-3 text-center">
                Maximum {event.max_guests_per_rsvp} guests allowed
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowGuestModal(false); setPendingStatus(null); }}
                className="flex-1 px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmGuestRSVP}
                disabled={loading !== null}
                className="flex-1 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors flex items-center justify-center gap-2"
              >
                {loading === "going" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
