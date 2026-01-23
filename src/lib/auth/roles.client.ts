import { createClient } from "@/lib/supabase/client";
import type { MemberRole } from "@/types/database";

/**
 * Client-side helper to check if user is platform admin
 */
export async function isPlatformAdminClient(userId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();
  
  const profile = data as { is_admin: boolean } | null;
  return profile?.is_admin === true;
}

/**
 * Client-side helper to get society role
 */
export async function getSocietyRoleClient(
  userId: string,
  societyId: string
): Promise<MemberRole | null> {
  const supabase = createClient();
  
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
 * Client-side helper to check creation permissions
 */
export async function canCreateSocietyClient(userId: string): Promise<{
  allowed: boolean;
  defaultStatus: "approved" | "pending";
  isPlatformAdmin: boolean;
}> {
  const isAdmin = await isPlatformAdminClient(userId);
  
  return {
    allowed: true,
    defaultStatus: isAdmin ? "approved" : "pending",
    isPlatformAdmin: isAdmin,
  };
}
