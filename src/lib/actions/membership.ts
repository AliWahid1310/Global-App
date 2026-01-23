"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isPlatformAdmin } from "@/lib/auth/roles";

/**
 * Join a society - platform admins get auto-approved, others are pending
 */
export async function joinSociety(societyId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }
  
  // Check if already a member
  const { data: existing } = await supabase
    .from("society_members")
    .select("id, status")
    .eq("society_id", societyId)
    .eq("user_id", user.id)
    .single();
  
  if (existing) {
    const status = (existing as any).status;
    return { error: `Already ${status}` };
  }
  
  // Check if user is platform admin - they get auto-approved
  const isAdmin = await isPlatformAdmin(user.id);
  
  // Platform admins get auto-approved, others are pending
  const { error } = await (supabase.from("society_members") as any).insert({
    society_id: societyId,
    user_id: user.id,
    role: isAdmin ? "admin" : "member",
    status: isAdmin ? "approved" : "pending",
  });
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath(`/societies`);
  return { success: true };
}

/**
 * Leave a society - user can only remove themselves
 */
export async function leaveSociety(societyId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }
  
  // Delete only their own membership
  const { error } = await supabase
    .from("society_members")
    .delete()
    .eq("society_id", societyId)
    .eq("user_id", user.id);
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath(`/societies`);
  revalidatePath(`/dashboard`);
  return { success: true };
}

/**
 * Check if user is admin of a society (society admin, society creator, or platform admin)
 */
async function isSocietyAdminOrCreator(userId: string, societyId: string): Promise<boolean> {
  const supabase = await createClient();
  
  // Check if platform admin
  const platformAdmin = await isPlatformAdmin(userId);
  if (platformAdmin) return true;
  
  // Check if society creator
  const { data: society } = await supabase
    .from("societies")
    .select("created_by")
    .eq("id", societyId)
    .single();
  
  if ((society as any)?.created_by === userId) return true;
  
  // Check if society admin in members table
  const { data } = await supabase
    .from("society_members")
    .select("role")
    .eq("society_id", societyId)
    .eq("user_id", userId)
    .eq("status", "approved")
    .single();
  
  return (data as any)?.role === "admin";
}

/**
 * Approve a member - only society admins can do this
 */
export async function approveMember(societyId: string, memberId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }
  
  // Check if user is society admin, creator, or platform admin
  const canManage = await isSocietyAdminOrCreator(user.id, societyId);
  
  if (!canManage) {
    return { error: "Not authorized - must be society admin" };
  }
  
  // Update member status
  const { error } = await (supabase.from("society_members") as any)
    .update({ status: "approved" })
    .eq("id", memberId)
    .eq("society_id", societyId); // Extra check to prevent manipulation
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath(`/dashboard/societies/${societyId}/manage`);
  return { success: true };
}

/**
 * Reject a member - only society admins can do this
 */
export async function rejectMember(societyId: string, memberId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }
  
  // Check if user is society admin, creator, or platform admin
  const canManage = await isSocietyAdminOrCreator(user.id, societyId);
  
  if (!canManage) {
    return { error: "Not authorized - must be society admin" };
  }
  
  // Update member status
  const { error } = await (supabase.from("society_members") as any)
    .update({ status: "rejected" })
    .eq("id", memberId)
    .eq("society_id", societyId);
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath(`/dashboard/societies/${societyId}/manage`);
  return { success: true };
}

/**
 * Remove a member - only society admins can do this
 */
export async function removeMember(societyId: string, memberId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }
  
  // Check if user is society admin, creator, or platform admin
  const canManage = await isSocietyAdminOrCreator(user.id, societyId);
  
  if (!canManage) {
    return { error: "Not authorized - must be society admin" };
  }
  
  // Prevent removing yourself if you're the only admin
  const { data: member } = await supabase
    .from("society_members")
    .select("user_id, role")
    .eq("id", memberId)
    .single();
  
  if ((member as any)?.user_id === user.id && (member as any)?.role === "admin") {
    // Check if there are other admins
    const { count } = await supabase
      .from("society_members")
      .select("*", { count: "exact", head: true })
      .eq("society_id", societyId)
      .eq("role", "admin")
      .eq("status", "approved");
    
    if (count === 1) {
      return { error: "Cannot remove yourself - you're the only admin" };
    }
  }
  
  // Delete member
  const { error } = await supabase
    .from("society_members")
    .delete()
    .eq("id", memberId)
    .eq("society_id", societyId);
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath(`/dashboard/societies/${societyId}/manage`);
  return { success: true };
}

/**
 * Update member role - only society admins can do this
 */
export async function updateMemberRole(societyId: string, memberId: string, newRole: "member" | "moderator" | "admin") {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }
  
  // Check if user is society admin, creator, or platform admin
  const canManage = await isSocietyAdminOrCreator(user.id, societyId);
  
  if (!canManage) {
    return { error: "Not authorized - must be society admin" };
  }
  
  // Prevent demoting yourself if you're the only admin
  const { data: member } = await supabase
    .from("society_members")
    .select("user_id, role")
    .eq("id", memberId)
    .single();
  
  if ((member as any)?.user_id === user.id && (member as any)?.role === "admin" && newRole !== "admin") {
    const { count } = await supabase
      .from("society_members")
      .select("*", { count: "exact", head: true })
      .eq("society_id", societyId)
      .eq("role", "admin")
      .eq("status", "approved");
    
    if (count === 1) {
      return { error: "Cannot demote yourself - you're the only admin" };
    }
  }
  
  // Update role
  const { error } = await (supabase.from("society_members") as any)
    .update({ role: newRole })
    .eq("id", memberId)
    .eq("society_id", societyId);
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath(`/dashboard/societies/${societyId}/manage`);
  return { success: true };
}

/**
 * Add creator as admin when creating society - only called internally
 */
export async function addCreatorAsAdmin(societyId: string, userId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // Only the creator can add themselves
  if (!user || user.id !== userId) {
    return { error: "Not authorized" };
  }
  
  const { error } = await (supabase.from("society_members") as any).insert({
    society_id: societyId,
    user_id: userId,
    role: "admin",
    status: "approved",
  });
  
  if (error) {
    return { error: error.message };
  }
  
  return { success: true };
}
