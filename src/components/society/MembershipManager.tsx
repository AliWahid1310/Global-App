"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveMember, rejectMember, removeMember, updateMemberRole } from "@/lib/actions/membership";
import { getUserFriendlyError } from "@/lib/utils/errors";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { SocietyMember, Profile, MemberRole } from "@/types/database";
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

type ModalAction = {
  type: "approve" | "reject" | "remove" | "promote" | "demote";
  memberId: string;
  memberName: string;
  newRole?: MemberRole;
};

export function MembershipManager({
  societyId,
  members,
  type,
}: MembershipManagerProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [optimisticApproved, setOptimisticApproved] = useState<string[]>([]);
  const [optimisticRoles, setOptimisticRoles] = useState<Record<string, MemberRole>>({});
  const [modalAction, setModalAction] = useState<ModalAction | null>(null);
  const router = useRouter();

  // Filter out hidden members for optimistic UI
  const displayMembers = members.filter(m => !hiddenIds.includes(m.id)).map(m => ({
    ...m,
    role: optimisticRoles[m.id] || m.role
  }));

  const closeModal = () => setModalAction(null);

  const executeAction = async () => {
    if (!modalAction) return;

    const { type: actionType, memberId, newRole } = modalAction;
    
    setLoadingId(memberId);
    setError(null);

    try {
      let result: { error?: string; success?: boolean };

      switch (actionType) {
        case "approve":
          setHiddenIds(prev => [...prev, memberId]);
          setOptimisticApproved(prev => [...prev, memberId]);
          result = await approveMember(societyId, memberId);
          if (result.error) {
            setHiddenIds(prev => prev.filter(id => id !== memberId));
            setOptimisticApproved(prev => prev.filter(id => id !== memberId));
          }
          break;

        case "reject":
          setHiddenIds(prev => [...prev, memberId]);
          result = await rejectMember(societyId, memberId);
          if (result.error) {
            setHiddenIds(prev => prev.filter(id => id !== memberId));
          }
          break;

        case "remove":
          setHiddenIds(prev => [...prev, memberId]);
          result = await removeMember(societyId, memberId);
          if (result.error) {
            setHiddenIds(prev => prev.filter(id => id !== memberId));
          }
          break;

        case "promote":
        case "demote":
          if (newRole) {
            setOptimisticRoles(prev => ({ ...prev, [memberId]: newRole }));
            result = await updateMemberRole(societyId, memberId, newRole);
            if (result.error) {
              setOptimisticRoles(prev => {
                const updated = { ...prev };
                delete updated[memberId];
                return updated;
              });
            }
          } else {
            result = { error: "Invalid role" };
          }
          break;

        default:
          result = { error: "Unknown action" };
      }

      if (result.error) {
        setError(getUserFriendlyError(result.error));
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(`Error performing ${actionType}:`, err);
      setError(getUserFriendlyError(err));
    } finally {
      setLoadingId(null);
      closeModal();
    }
  };

  const getModalConfig = () => {
    if (!modalAction) return null;

    const { type: actionType, memberName, newRole } = modalAction;

    switch (actionType) {
      case "approve":
        return {
          title: "Approve Member",
          message: `Are you sure you want to approve ${memberName} to join this society?`,
          confirmText: "Approve",
          variant: "info" as const,
        };
      case "reject":
        return {
          title: "Reject Request",
          message: `Are you sure you want to reject ${memberName}'s membership request?`,
          confirmText: "Reject",
          variant: "danger" as const,
        };
      case "remove":
        return {
          title: "Remove Member",
          message: `Are you sure you want to remove ${memberName} from this society? They will need to request to join again.`,
          confirmText: "Remove",
          variant: "danger" as const,
        };
      case "promote":
        return {
          title: `Promote to ${newRole === "admin" ? "Admin" : "Moderator"}`,
          message: `Are you sure you want to promote ${memberName} to ${newRole}? ${
            newRole === "admin" 
              ? "Admins have full control over the society." 
              : "Moderators can manage posts and events."
          }`,
          confirmText: "Promote",
          variant: "info" as const,
        };
      case "demote":
        return {
          title: "Demote to Member",
          message: `Are you sure you want to demote ${memberName} to a regular member? They will lose their moderator privileges.`,
          confirmText: "Demote",
          variant: "warning" as const,
        };
      default:
        return null;
    }
  };

  const modalConfig = getModalConfig();

  if (displayMembers.length === 0) {
    return (
      <p className="text-dark-400 text-sm text-center py-6">
        {type === "pending" ? "No pending requests" : "No members yet"}
      </p>
    );
  }

  return (
    <>
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
                    onClick={() => setModalAction({
                      type: "approve",
                      memberId: member.id,
                      memberName: member.profile?.full_name || "this user",
                    })}
                    className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all"
                    title="Approve"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setModalAction({
                      type: "reject",
                      memberId: member.id,
                      memberName: member.profile?.full_name || "this user",
                    })}
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
                        onClick={() => setModalAction({
                          type: "promote",
                          memberId: member.id,
                          memberName: member.profile?.full_name || "this user",
                          newRole: "moderator",
                        })}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all"
                        title="Promote to Moderator"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                    )}
                    {member.role === "moderator" && (
                      <>
                        <button
                          onClick={() => setModalAction({
                            type: "promote",
                            memberId: member.id,
                            memberName: member.profile?.full_name || "this user",
                            newRole: "admin",
                          })}
                          className="p-2 text-accent-400 hover:bg-accent-500/20 rounded-lg transition-all"
                          title="Promote to Admin"
                        >
                          <ShieldAlert className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setModalAction({
                            type: "demote",
                            memberId: member.id,
                            memberName: member.profile?.full_name || "this user",
                            newRole: "member",
                          })}
                          className="p-2 text-dark-400 hover:bg-dark-700 rounded-lg transition-all"
                          title="Demote to Member"
                        >
                          <User className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setModalAction({
                        type: "remove",
                        memberId: member.id,
                        memberName: member.profile?.full_name || "this user",
                      })}
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

      {/* Confirmation Modal */}
      {modalConfig && (
        <ConfirmModal
          isOpen={!!modalAction}
          onClose={closeModal}
          onConfirm={executeAction}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmText={modalConfig.confirmText}
          variant={modalConfig.variant}
          loading={loadingId !== null}
        />
      )}
    </>
  );
}
