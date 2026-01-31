"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { HierarchyLevel } from "@/types/database";

interface AddPositionData {
  societyId: string;
  societySlug: string;
  userId: string | null;
  positionTitle: string;
  hierarchyLevel: HierarchyLevel;
  customTitle?: string | null;
  tenureStart?: string | null;
  tenureEnd?: string | null;
  displayOrder?: number;
}

interface UpdatePositionData {
  positionId: string;
  societySlug: string;
  userId?: string | null;
  positionTitle?: string;
  hierarchyLevel?: HierarchyLevel;
  customTitle?: string | null;
  tenureStart?: string | null;
  tenureEnd?: string | null;
  displayOrder?: number;
}

/**
 * Check if user is a society admin
 */
async function isSocietyAdmin(userId: string, societyId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from("society_members")
    .select("role")
    .eq("user_id", userId)
    .eq("society_id", societyId)
    .eq("status", "approved")
    .single();
  
  return (data as any)?.role === "admin";
}

/**
 * Add a new leadership position
 */
export async function addLeadershipPosition(data: AddPositionData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }
  
  // Check if user is society admin
  const isAdmin = await isSocietyAdmin(user.id, data.societyId);
  if (!isAdmin) {
    return { error: "Only society admins can manage leadership positions" };
  }
  
  const { error } = await (supabase
    .from("society_positions") as any)
    .insert({
      society_id: data.societyId,
      user_id: data.userId || null,
      position_title: data.positionTitle,
      hierarchy_level: data.hierarchyLevel,
      custom_title: data.customTitle || null,
      tenure_start: data.tenureStart || null,
      tenure_end: data.tenureEnd || null,
      display_order: data.displayOrder || 0,
    });
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath(`/societies/${data.societySlug}`);
  revalidatePath(`/dashboard/societies/${data.societySlug}/manage`);
  
  return { success: true };
}

/**
 * Update an existing leadership position
 */
export async function updateLeadershipPosition(data: UpdatePositionData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }
  
  // Get the position to check society_id
  const { data: position } = await supabase
    .from("society_positions")
    .select("society_id")
    .eq("id", data.positionId)
    .single();
  
  if (!position) {
    return { error: "Position not found" };
  }
  
  // Check if user is society admin
  const isAdmin = await isSocietyAdmin(user.id, (position as any).society_id);
  if (!isAdmin) {
    return { error: "Only society admins can manage leadership positions" };
  }
  
  const updateData: Record<string, any> = {};
  if (data.userId !== undefined) updateData.user_id = data.userId;
  if (data.positionTitle !== undefined) updateData.position_title = data.positionTitle;
  if (data.hierarchyLevel !== undefined) updateData.hierarchy_level = data.hierarchyLevel;
  if (data.customTitle !== undefined) updateData.custom_title = data.customTitle;
  if (data.tenureStart !== undefined) updateData.tenure_start = data.tenureStart;
  if (data.tenureEnd !== undefined) updateData.tenure_end = data.tenureEnd;
  if (data.displayOrder !== undefined) updateData.display_order = data.displayOrder;
  
  const { error } = await (supabase
    .from("society_positions") as any)
    .update(updateData)
    .eq("id", data.positionId);
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath(`/societies/${data.societySlug}`);
  revalidatePath(`/dashboard/societies/${data.societySlug}/manage`);
  
  return { success: true };
}

/**
 * Delete a leadership position
 */
export async function deleteLeadershipPosition(positionId: string, societySlug: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }
  
  // Get the position to check society_id
  const { data: position } = await supabase
    .from("society_positions")
    .select("society_id")
    .eq("id", positionId)
    .single();
  
  if (!position) {
    return { error: "Position not found" };
  }
  
  // Check if user is society admin
  const isAdmin = await isSocietyAdmin(user.id, (position as any).society_id);
  if (!isAdmin) {
    return { error: "Only society admins can manage leadership positions" };
  }
  
  const { error } = await supabase
    .from("society_positions")
    .delete()
    .eq("id", positionId);
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath(`/societies/${societySlug}`);
  revalidatePath(`/dashboard/societies/${societySlug}/manage`);
  
  return { success: true };
}

/**
 * Get all approved members of a society (for selecting in dropdown)
 */
export async function getSocietyMembers(societyId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("society_members")
    .select(`
      user_id,
      profile:profiles(id, full_name, avatar_url)
    `)
    .eq("society_id", societyId)
    .eq("status", "approved");
  
  if (error) {
    return { error: error.message, members: [] };
  }
  
  return { 
    members: (data || []).map((m: any) => ({
      id: m.profile?.id,
      full_name: m.profile?.full_name,
      avatar_url: m.profile?.avatar_url,
    }))
  };
}
