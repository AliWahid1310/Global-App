"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setEventReminder, removeEventReminder } from "@/lib/actions/events";
import { Bell, BellOff, Check, Loader2, Clock } from "lucide-react";

interface ReminderButtonProps {
  eventId: string;
  eventDate: string;
  hasReminder?: boolean;
  reminderType?: string;
}

export function ReminderButton({
  eventId,
  eventDate,
  hasReminder = false,
  reminderType = "24h",
}: ReminderButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isSet, setIsSet] = useState(hasReminder);
  const [currentType, setCurrentType] = useState(reminderType);
  const router = useRouter();

  const eventTime = new Date(eventDate);
  const now = new Date();
  
  // Calculate available reminder options
  const hoursUntilEvent = (eventTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const can24h = hoursUntilEvent > 24;
  const can1h = hoursUntilEvent > 1;

  const handleSetReminder = async (type: "24h" | "1h") => {
    setLoading(true);
    setShowOptions(false);

    try {
      const result = await setEventReminder(eventId, type);
      if (result.success) {
        setIsSet(true);
        setCurrentType(type);
      }
    } catch (error) {
      console.error("Failed to set reminder:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveReminder = async () => {
    setLoading(true);

    try {
      const result = await removeEventReminder(eventId, currentType);
      if (result.success) {
        setIsSet(false);
      }
    } catch (error) {
      console.error("Failed to remove reminder:", error);
    } finally {
      setLoading(false);
    }
  };

  // Event is in the past or too soon
  if (hoursUntilEvent <= 0) {
    return null;
  }

  if (isSet) {
    return (
      <button
        onClick={handleRemoveReminder}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-accent-500/20 text-accent-400 border border-accent-500/30 rounded-xl hover:bg-accent-500/30 transition-colors"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Bell className="w-4 h-4" />
        )}
        <span className="text-sm">
          {currentType === "24h" ? "24h reminder set" : "1h reminder set"}
        </span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600 rounded-xl transition-colors"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Bell className="w-4 h-4" />
        )}
        <span className="text-sm">Remind me</span>
      </button>

      {showOptions && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowOptions(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-48 glass rounded-xl overflow-hidden z-50 animate-slide-down">
            {can24h && (
              <button
                onClick={() => handleSetReminder("24h")}
                className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
              >
                <Clock className="w-4 h-4 text-accent-400" />
                24 hours before
              </button>
            )}
            {can1h && (
              <button
                onClick={() => handleSetReminder("1h")}
                className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
              >
                <Clock className="w-4 h-4 text-accent-400" />
                1 hour before
              </button>
            )}
            {!can24h && !can1h && (
              <div className="px-4 py-3 text-sm text-dark-400">
                Event is too soon for reminders
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
