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
  Users,
} from "lucide-react";

type MemberWithProfile = SocietyMember & { profile: Profile | null };

interface MembershipSectionProps {
  societyId: string;
  pendingMembers: MemberWithProfile[];
  approvedMembers: MemberWithProfile[];
}

type ModalAction = {
  type: "approve" | "reject" | "remove" | "promote" | "demote";
  memberId: string;
  memberName: string;
  newRole?: MemberRole;
};

export function MembershipSection({
  societyId,
  pendingMembers: initialPending,
  approvedMembers: initialApproved,
}: MembershipSectionProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<ModalAction | null>(null);
  const router = useRouter();

  // Optimistic state for members
  const [pendingMembers, setPendingMembers] = useState(initialPending);
  const [approvedMembers, setApprovedMembers] = useState(initialApproved);
  const [optimisticRoles, setOptimisticRoles] = useState<Record<string, MemberRole>>({});

  const closeModal = () => setModalAction(null);

  const executeAction = async () => {
    if (!modalAction) return;

    const { type: actionType, memberId, newRole } = modalAction;
    
    setLoadingId(memberId);
    setError(null);

    // Store original states for rollback
    const originalPending = [...pendingMembers];
    const originalApproved = [...approvedMembers];
    const originalRoles = { ...optimisticRoles };

    try {
      let result: { error?: string; success?: boolean };

      switch (actionType) {
        case "approve":
          // Optimistically move member from pending to approved
          const memberToApprove = pendingMembers.find(m => m.id === memberId);
          if (memberToApprove) {
            setPendingMembers(prev => prev.filter(m => m.id !== memberId));
            setApprovedMembers(prev => [...prev, { ...memberToApprove, status: "approved" as const }]);
          }
          result = await approveMember(societyId, memberId);
          if (result.error) {
            // Rollback on error
            setPendingMembers(originalPending);
            setApprovedMembers(originalApproved);
          }
          break;

        case "reject":
          // Optimistically remove from pending
          setPendingMembers(prev => prev.filter(m => m.id !== memberId));
          result = await rejectMember(societyId, memberId);
          if (result.error) {
            setPendingMembers(originalPending);
          }
          break;

        case "remove":
          // Optimistically remove from approved
          setApprovedMembers(prev => prev.filter(m => m.id !== memberId));
          result = await removeMember(societyId, memberId);
          if (result.error) {
            setApprovedMembers(originalApproved);
          }
          break;

        case "promote":
        case "demote":
          if (newRole) {
            setOptimisticRoles(prev => ({ ...prev, [memberId]: newRole }));
            result = await updateMemberRole(societyId, memberId, newRole);
            if (result.error) {
              setOptimisticRoles(originalRoles);
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
        // Refresh in background to sync with server
        router.refresh();
      }
    } catch (err) {
      console.error(`Error performing ${actionType}:`, err);
      setError(getUserFriendlyError(err));
      // Rollback on error
      setPendingMembers(originalPending);
      setApprovedMembers(originalApproved);
      setOptimisticRoles(originalRoles);
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

  // Apply optimistic roles to approved members
  const displayApprovedMembers = approvedMembers.map(m => ({
    ...m,
    role: optimisticRoles[m.id] || m.role
  }));

  return (
    <>
      {/* Pending Requests */}
      <section className="glass-light rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Users className="h-5 w-5 text-yellow-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Pending Requests ({pendingMembers.length})
          </h2>
        </div>
        
        {pendingMembers.length === 0 ? (
          <p className="text-dark-400 text-sm text-center py-6">No pending requests</p>
        ) : (
          <div className="space-y-3">
            {pendingMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-xl border bg-yellow-500/10 border-yellow-500/20"
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
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {loadingId === member.id ? (
                    <Loader2 className="h-5 w-5 animate-spin text-dark-400" />
                  ) : (
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
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Current Members */}
      <section className="glass-light rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <Users className="h-5 w-5 text-green-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Members ({displayApprovedMembers.length})
          </h2>
        </div>
        
        {displayApprovedMembers.length === 0 ? (
          <p className="text-dark-400 text-sm text-center py-6">No members yet</p>
        ) : (
          <div className="space-y-3">
            {displayApprovedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-xl border bg-dark-800/50 border-dark-700"
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
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {loadingId === member.id ? (
                    <Loader2 className="h-5 w-5 animate-spin text-dark-400" />
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
          </div>
        )}
      </section>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

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
