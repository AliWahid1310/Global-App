"use server";

import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";

export async function approveSociety(societyId: string) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }
  
  // Check if user is platform admin
  const isAdmin = await isPlatformAdmin(user.id);
  
  if (!isAdmin) {
    return { error: "Not authorized" };
  }
  
  // Update society status
  const { error } = await (supabase
    .from("societies") as any)
    .update({ status: "approved" })
    .eq("id", societyId);
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath("/dashboard/admin/societies");
  return { success: true };
}

export async function rejectSociety(societyId: string) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }
  
  // Check if user is platform admin
  const isAdmin = await isPlatformAdmin(user.id);
  
  if (!isAdmin) {
    return { error: "Not authorized" };
  }
  
  // Update society status
  const { error } = await (supabase
    .from("societies") as any)
    .update({ status: "rejected" })
    .eq("id", societyId);
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath("/dashboard/admin/societies");
  return { success: true };
}

export async function toggleFoundingBadge(societyId: string, isCurrentlyFounding: boolean) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }
  
  // Check if user is platform admin
  const isAdmin = await isPlatformAdmin(user.id);
  
  if (!isAdmin) {
    return { error: "Not authorized - Only platform admins can manage founding badges" };
  }
  
  // Toggle the is_founding flag
  const { error } = await (supabase
    .from("societies") as any)
    .update({ is_founding: !isCurrentlyFounding })
    .eq("id", societyId);
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath("/dashboard/admin/societies");
  revalidatePath("/societies");
  return { success: true, isNowFounding: !isCurrentlyFounding };
}
