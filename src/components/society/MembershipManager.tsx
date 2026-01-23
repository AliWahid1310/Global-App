"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveMember, rejectMember, removeMember, updateMemberRole } from "@/lib/actions/membership";
import type { SocietyMember, Profile } from "@/types/database";
import {
  Check,
  X,
  Loader2,
  User,
  Shield,
  ShieldAlert,
  Trash2,
} from "lucide-react";

interface MembershipManagerProps {
  societyId: string;
  members: (SocietyMember & { profile: Profile | null })[];
  type: "pending" | "approved";
}

export function MembershipManager({
  societyId,
  members,
  type,
}: MembershipManagerProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [optimisticApproved, setOptimisticApproved] = useState<string[]>([]);
  const router = useRouter();

  // Filter out hidden members for optimistic UI
  const displayMembers = members.filter(m => !hiddenIds.includes(m.id));

  const handleApprove = async (memberId: string) => {
    setLoadingId(memberId);
    setError(null);
    
    // Optimistic update - hide from pending list immediately
    setHiddenIds(prev => [...prev, memberId]);
    setOptimisticApproved(prev => [...prev, memberId]);
    
    try {
      const result = await approveMember(societyId, memberId);
      if (result.error) {
        // Revert on error
        setHiddenIds(prev => prev.filter(id => id !== memberId));
        setOptimisticApproved(prev => prev.filter(id => id !== memberId));
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Error approving member:", err);
      setHiddenIds(prev => prev.filter(id => id !== memberId));
      setOptimisticApproved(prev => prev.filter(id => id !== memberId));
      setError("Failed to approve member");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (memberId: string) => {
    setLoadingId(memberId);
    setError(null);
    
    // Optimistic update - hide immediately
    setHiddenIds(prev => [...prev, memberId]);
    
    try {
      const result = await rejectMember(societyId, memberId);
      if (result.error) {
        // Revert on error
        setHiddenIds(prev => prev.filter(id => id !== memberId));
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Error rejecting member:", err);
      setHiddenIds(prev => prev.filter(id => id !== memberId));
      setError("Failed to reject member");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    setLoadingId(memberId);
    setError(null);
    
    // Optimistic update - hide immediately
    setHiddenIds(prev => [...prev, memberId]);
    
    try {
      const result = await removeMember(societyId, memberId);
      if (result.error) {
        // Revert on error
        setHiddenIds(prev => prev.filter(id => id !== memberId));
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Error removing member:", err);
      setHiddenIds(prev => prev.filter(id => id !== memberId));
      setError("Failed to remove member");
    } finally {
      setLoadingId(null);
    }
  };

  const handlePromote = async (memberId: string, newRole: "admin" | "moderator" | "member") => {
    setLoadingId(memberId);
    setError(null);
    try {
      const result = await updateMemberRole(societyId, memberId, newRole);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Error updating role:", err);
      setError("Failed to update role");
    } finally {
      setLoadingId(null);
    }
  };

  if (displayMembers.length === 0) {
    return (
      <p className="text-dark-400 text-sm text-center py-6">
        {type === "pending" ? "No pending requests" : "No members yet"}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {displayMembers.map((member) => (
        <div
          key={member.id}
          className={`flex items-center justify-between p-4 rounded-xl border ${
            type === "pending"
              ? "bg-yellow-500/10 border-yellow-500/20"
              : "bg-dark-800/50 border-dark-700"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-dark-700 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-dark-400" />
            </div>
            <div>
              <p className="font-medium text-white">
                {member.profile?.full_name || "Unknown User"}
              </p>
              <p className="text-sm text-dark-400">{member.profile?.email}</p>
              {type === "approved" && (
                <span
                  className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full capitalize ${
                    member.role === "admin"
                      ? "bg-accent-500/20 text-accent-400 border border-accent-500/30"
                      : member.role === "moderator"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-dark-700 text-dark-300 border border-dark-600"
                  }`}
                >
                  {member.role}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {loadingId === member.id ? (
              <Loader2 className="h-5 w-5 animate-spin text-dark-400" />
            ) : type === "pending" ? (
              <>
                <button
                  onClick={() => handleApprove(member.id)}
                  className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all"
                  title="Approve"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleReject(member.id)}
                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                  title="Reject"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              member.role !== "admin" && (
                <>
                  {member.role === "member" && (
                    <button
                      onClick={() => handlePromote(member.id, "moderator")}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all"
                      title="Promote to Moderator"
                    >
                      <Shield className="h-4 w-4" />
                    </button>
                  )}
                  {member.role === "moderator" && (
                    <>
                      <button
                        onClick={() => handlePromote(member.id, "admin")}
                        className="p-2 text-accent-400 hover:bg-accent-500/20 rounded-lg transition-all"
                        title="Promote to Admin"
                      >
                        <ShieldAlert className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handlePromote(member.id, "member")}
                        className="p-2 text-dark-400 hover:bg-dark-700 rounded-lg transition-all"
                        title="Demote to Member"
                      >
                        <User className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                    title="Remove Member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )
            )}
          </div>
        </div>
      ))}
      {error && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
