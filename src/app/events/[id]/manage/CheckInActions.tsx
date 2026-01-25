"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { checkInUser, undoCheckIn } from "@/lib/actions/events";
import type { RSVPWithUser } from "@/types/database";
import {
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Undo,
} from "lucide-react";

interface CheckInActionsProps {
  eventId: string;
  rsvps: RSVPWithUser[];
}

export function CheckInActions({ eventId, rsvps }: CheckInActionsProps) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const router = useRouter();

  // Filter RSVPs that can be checked in (going status)
  const eligibleRSVPs = rsvps.filter(
    (r) => r.status === "going" || r.status === "maybe"
  );

  const filteredRSVPs = eligibleRSVPs.filter(
    (r) =>
      !search ||
      r.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCheckIn = async (userId: string, userName: string) => {
    setLoading(userId);
    setMessage(null);

    try {
      const result = await checkInUser(eventId, userId, 0, "manual");

      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: `${userName} checked in!` });
        router.refresh();
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to check in" });
    } finally {
      setLoading(null);
    }
  };

  const handleUndoCheckIn = async (userId: string, userName: string) => {
    setLoading(`undo-${userId}`);
    setMessage(null);

    try {
      const result = await undoCheckIn(eventId, userId);

      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({
          type: "success",
          text: `${userName} check-in removed`,
        });
        router.refresh();
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to undo check-in" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          {message.text}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>

      {/* RSVP list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredRSVPs.length > 0 ? (
          filteredRSVPs.map((rsvp) => {
            const isCheckedIn = rsvp.checkin ? (Array.isArray(rsvp.checkin) ? rsvp.checkin.length > 0 : true) : false;
            const isLoading =
              loading === rsvp.user_id || loading === `undo-${rsvp.user_id}`;

            return (
              <div
                key={rsvp.id}
                className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                  isCheckedIn ? "bg-green-500/10" : "bg-dark-800/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-dark-700 overflow-hidden">
                    {rsvp.user?.avatar_url ? (
                      <Image
                        src={rsvp.user.avatar_url}
                        alt={rsvp.user.full_name || "User"}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-5 h-5 text-dark-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {rsvp.user?.full_name || "Unknown"}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={
                          rsvp.status === "going"
                            ? "text-green-400"
                            : "text-amber-400"
                        }
                      >
                        {rsvp.status}
                      </span>
                      {rsvp.guest_count > 0 && (
                        <span className="text-dark-400">
                          +{rsvp.guest_count} guests
                        </span>
                      )}
                      {isCheckedIn && (
                        <span className="text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Checked in
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isCheckedIn ? (
                  <button
                    onClick={() =>
                      handleUndoCheckIn(
                        rsvp.user_id,
                        rsvp.user?.full_name || "User"
                      )
                    }
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Undo className="w-4 h-4" />
                        Undo
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      handleCheckIn(
                        rsvp.user_id,
                        rsvp.user?.full_name || "User"
                      )
                    }
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Check In
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-dark-400 text-center py-6">
            {search ? "No matching RSVPs" : "No RSVPs to check in"}
          </p>
        )}
      </div>
    </div>
  );
}
