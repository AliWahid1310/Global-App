import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/types/database";

/**
 * Check if a user is a platform admin
 */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();
  
  const profile = data as { is_admin: boolean } | null;
  return profile?.is_admin === true;
}

/**
 * Get user's role in a specific society
 * Returns null if user is not a member or not approved
 */
export async function getSocietyRole(
  userId: string,
  societyId: string
): Promise<MemberRole | null> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from("society_members")
    .select("role")
    .eq("user_id", userId)
    .eq("society_id", societyId)
    .eq("status", "approved")
    .single();
  
  const member = data as { role: MemberRole } | null;
  return member?.role ?? null;
}

/**
 * Check if user is an admin of a specific society
 * Platform admins are considered admins of all societies
 */
export async function isSocietyAdmin(
  userId: string,
  societyId: string
): Promise<boolean> {
  // Platform admins can admin any society
  const isAdmin = await isPlatformAdmin(userId);
  if (isAdmin) return true;
  
  const role = await getSocietyRole(userId, societyId);
  return role === "admin";
}

/**
 * Check if user is a moderator or admin of a society
 * Platform admins are considered moderators of all societies
 */
export async function isSocietyModerator(
  userId: string,
  societyId: string
): Promise<boolean> {
  // Platform admins can moderate any society
  const isAdmin = await isPlatformAdmin(userId);
  if (isAdmin) return true;
  
  const role = await getSocietyRole(userId, societyId);
  return role === "admin" || role === "moderator";
}

/**
 * Determine if user can create societies and what status they'll get
 */
export async function canCreateSociety(userId: string): Promise<{
  allowed: boolean;
  defaultStatus: "approved" | "pending";
  isPlatformAdmin: boolean;
}> {
  const isAdmin = await isPlatformAdmin(userId);
  
  return {
    allowed: true, // Any logged-in user can request/create
    defaultStatus: isAdmin ? "approved" : "pending",
    isPlatformAdmin: isAdmin,
  };
}

/**
 * Check if user can manage a society (update settings, members, etc.)
 */
export async function canManageSociety(
  userId: string,
  societyId: string
): Promise<boolean> {
  // Platform admins can manage any society
  const isAdmin = await isPlatformAdmin(userId);
  if (isAdmin) return true;
  
  // Society admins can manage their society
  return await isSocietyAdmin(userId, societyId);
}

/**
 * Check if user can moderate content in a society (posts, events)
 */
export async function canModerateSociety(
  userId: string,
  societyId: string
): Promise<boolean> {
  // Platform admins can moderate any society
  const isAdmin = await isPlatformAdmin(userId);
  if (isAdmin) return true;
  
  // Society admins and moderators can moderate
  return await isSocietyModerator(userId, societyId);
}

/**
 * Check if user can approve/reject society requests (platform admin only)
 */
export async function canApproveSocieties(userId: string): Promise<boolean> {
  return await isPlatformAdmin(userId);
}
