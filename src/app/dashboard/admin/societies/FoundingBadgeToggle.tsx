"use client";

import { useState } from "react";
import { Award } from "lucide-react";
import { toggleFoundingBadge } from "./actions";

interface FoundingBadgeToggleProps {
  societyId: string;
  societyName: string;
  isFounding: boolean;
}

export function FoundingBadgeToggle({ societyId, societyName, isFounding }: FoundingBadgeToggleProps) {
  const [isCurrentlyFounding, setIsCurrentlyFounding] = useState(isFounding);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const result = await toggleFoundingBadge(societyId, isCurrentlyFounding);
      if (result.success) {
        setIsCurrentlyFounding(result.isNowFounding ?? !isCurrentlyFounding);
      } else {
        alert(result.error || "Failed to update badge");
      }
    } catch (error) {
      console.error("Error toggling founding badge:", error);
      alert("Failed to update badge");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        isCurrentlyFounding
          ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/30"
          : "bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white"
      } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      title={isCurrentlyFounding ? `Remove Founding badge from ${societyName}` : `Give Founding badge to ${societyName}`}
    >
      <Award className="w-4 h-4" />
      {isLoading ? "..." : isCurrentlyFounding ? "Founding ✓" : "Give Founding Badge"}
    </button>
  );
}
