"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinSociety, leaveSociety } from "@/lib/actions/membership";
import type { SocietyMember } from "@/types/database";
import { Loader2, UserPlus, Check, Clock, X, Sparkles } from "lucide-react";

interface JoinButtonProps {
  societyId: string;
  userId?: string;
  membership: SocietyMember | null;
}

export function JoinButton({ societyId, userId, membership }: JoinButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleJoin = async () => {
    if (!userId) {
      router.push(`/login?redirect=/societies`);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await joinSociety(societyId);
      
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Error joining society:", err);
      setError("Failed to join society");
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    
    try {
      const result = await leaveSociety(societyId);
      
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Error leaving society:", err);
      setError("Failed to leave society");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className="inline-flex items-center px-5 py-2.5 bg-dark-700 text-dark-300 rounded-xl"
      >
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </button>
    );
  }

  if (!membership) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={handleJoin}
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 text-white font-semibold rounded-xl hover:bg-accent-600 transition-all btn-glow group"
        >
          <Sparkles className="h-4 w-4 group-hover:animate-pulse" />
          Join the Circle
        </button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    );
  }

  if (membership.status === "pending") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-5 py-2.5 bg-yellow-500/20 text-yellow-400 rounded-xl border border-yellow-500/30">
            <Clock className="h-4 w-4 mr-2" />
            Pending Approval
          </span>
          <button
            onClick={handleLeave}
            className="p-2.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            title="Cancel request"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    );
  }

  if (membership.status === "approved") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-5 py-2.5 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30">
            <Check className="h-4 w-4 mr-2" />
            Member
            {membership.role !== "member" && (
              <span className="ml-1 capitalize">({membership.role})</span>
            )}
          </span>
          {membership.role === "member" && (
            <button
              onClick={handleLeave}
              className="p-2.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title="Leave society"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    );
  }

  if (membership.status === "rejected") {
    return (
      <span className="inline-flex items-center px-5 py-2.5 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
        <X className="h-4 w-4 mr-2" />
        Request Rejected
      </span>
    );
  }

  return null;
}
