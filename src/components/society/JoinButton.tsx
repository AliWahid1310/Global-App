"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinSociety, leaveSociety } from "@/lib/actions/membership";
import { getUserFriendlyError } from "@/lib/utils/errors";
import type { SocietyMember } from "@/types/database";
import { Loader2, UserPlus, Check, Clock, X, Sparkles, AlertTriangle } from "lucide-react";

interface JoinButtonProps {
  societyId: string;
  userId?: string;
  membership: SocietyMember | null;
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ isOpen, title, message, confirmText, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-dark-900 border border-dark-600 rounded-2xl p-6 max-w-md mx-4 animate-scale-up shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="text-dark-200 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-dark-200 hover:text-white hover:bg-dark-700 rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-all"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function JoinButton({ societyId, userId, membership }: JoinButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmType, setConfirmType] = useState<"leave" | "cancel">("leave");
  const [optimisticState, setOptimisticState] = useState<"pending" | "left" | null>(null);
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
        setError(getUserFriendlyError(result.error));
        setLoading(false);
      } else {
        setOptimisticState("pending");
        setLoading(false);
        router.refresh();
      }
    } catch (err) {
      console.error("Error joining society:", err);
      setError(getUserFriendlyError(err));
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    setShowConfirm(false);
    
    try {
      const result = await leaveSociety(societyId);
      
      if (result.error) {
        setError(getUserFriendlyError(result.error));
        setLoading(false);
      } else {
        setOptimisticState("left");
        setLoading(false);
        router.refresh();
      }
    } catch (err) {
      console.error("Error leaving society:", err);
      setError(getUserFriendlyError(err));
      setLoading(false);
    }
  };

  const openConfirmModal = (type: "leave" | "cancel") => {
    setConfirmType(type);
    setShowConfirm(true);
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

  // Show optimistic "left" state - user just left/cancelled
  if (optimisticState === "left" && membership) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={handleJoin}
          className="inline-flex items-center justify-center gap-2 w-fit px-6 py-3 bg-accent-500 text-white font-semibold rounded-xl hover:bg-accent-600 transition-all btn-glow group"
        >
          <Sparkles className="h-4 w-4 group-hover:animate-pulse" />
          Join the Circle
        </button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    );
  }

  // Show optimistic "pending" state - user just joined
  if (optimisticState === "pending" && !membership) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-5 py-2.5 bg-yellow-500/20 text-yellow-400 rounded-xl border border-yellow-500/30">
            <Clock className="h-4 w-4 mr-2" />
            Pending Approval
          </span>
        </div>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={handleJoin}
          className="inline-flex items-center justify-center gap-2 w-fit px-6 py-3 bg-accent-500 text-white font-semibold rounded-xl hover:bg-accent-600 transition-all btn-glow group"
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
            onClick={() => openConfirmModal("cancel")}
            className="p-2.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            title="Cancel request"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <ConfirmModal
          isOpen={showConfirm}
          title="Cancel Request?"
          message="Are you sure you want to cancel your membership request? You can always request to join again later."
          confirmText="Yes, Cancel Request"
          onConfirm={handleLeave}
          onCancel={() => setShowConfirm(false)}
        />
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
              onClick={() => openConfirmModal("leave")}
              className="p-2.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title="Leave society"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <ConfirmModal
          isOpen={showConfirm}
          title="Leave Society?"
          message="Are you sure you want to leave this society? You'll lose access to member-only content and chat."
          confirmText="Yes, Leave Society"
          onConfirm={handleLeave}
          onCancel={() => setShowConfirm(false)}
        />
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
