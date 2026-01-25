"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { RSVPStatus, Event, EventRSVP, SocietyMember, EventCheckin, Profile } from "@/types/database";

// Helper type for RPC results
type RSVPCounts = {
  going: number;
  maybe: number;
  waitlist: number;
  total_guests: number;
};

/**
 * RSVP to an event
 */
export async function rsvpToEvent(
  eventId: string,
  status: RSVPStatus = "going",
  guestCount: number = 0,
  notes?: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Fetch event details
  const { data: eventData } = await supabase
    .from("events")
    .select("*, society:societies(slug)")
    .eq("id", eventId)
    .single();

  const event = eventData as (Event & { society: { slug: string } | null }) | null;

  if (!event) {
    return { error: "Event not found" };
  }

  // Check RSVP deadline
  if (event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date()) {
    return { error: "RSVP deadline has passed" };
  }

  // Check guest limits
  if (guestCount > 0) {
    if (!event.allow_guests) {
      return { error: "This event does not allow guests" };
    }
    if (event.max_guests_per_rsvp && guestCount > event.max_guests_per_rsvp) {
      return { error: `Maximum ${event.max_guests_per_rsvp} guests allowed` };
    }
  }

  // Check capacity for "going" status
  if (status === "going" && event.capacity) {
    const { data: rsvpCountsData } = await supabase.rpc("get_event_rsvp_counts", {
      p_event_id: eventId,
    } as any);

    const rsvpCounts = rsvpCountsData as RSVPCounts | null;

    const currentCount =
      (rsvpCounts?.going || 0) + (rsvpCounts?.total_guests || 0);
    const newCount = 1 + guestCount;

    if (currentCount + newCount > event.capacity) {
      // Add to waitlist instead
      status = "waitlist";
    }
  }

  // Check if already RSVPed
  const { data: existingData } = await supabase
    .from("event_rsvps")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .single();

  const existing = existingData as { id: string } | null;

  if (existing) {
    // Update existing RSVP
    const { error } = await (supabase
      .from("event_rsvps") as any)
      .update({
        status,
        guest_count: guestCount,
        notes,
      })
      .eq("id", existing.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    // Create new RSVP
    const { error } = await supabase.from("event_rsvps").insert({
      event_id: eventId,
      user_id: user.id,
      status,
      guest_count: guestCount,
      notes,
    } as any);

    if (error) {
      return { error: error.message };
    }

    // Auto-create 24h reminder for "going" status
    if (status === "going") {
      const eventDate = new Date(event.start_time);
      const reminderDate = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);

      if (reminderDate > new Date()) {
        await supabase.from("event_reminders").insert({
          event_id: eventId,
          user_id: user.id,
          remind_at: reminderDate.toISOString(),
          reminder_type: "24h",
        } as any);
      }
    }
  }

  const societySlug = event.society?.slug;
  revalidatePath(`/events/${eventId}`);
  if (societySlug) {
    revalidatePath(`/societies/${societySlug}`);
  }
  revalidatePath("/events");

  return { success: true, status };
}

/**
 * Cancel RSVP
 */
export async function cancelRSVP(eventId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Delete RSVP
  const { error } = await supabase
    .from("event_rsvps")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  // Delete reminders
  await supabase
    .from("event_reminders")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id);

  // Check if anyone on waitlist can be promoted
  await promoteFromWaitlist(eventId);

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");

  return { success: true };
}

/**
 * Get user's RSVP for an event
 */
export async function getUserRSVP(eventId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { rsvp: null };
  }

  const { data } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .single();

  return { rsvp: data };
}

/**
 * Get RSVP counts for an event
 */
export async function getEventRSVPCounts(eventId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_event_rsvp_counts", {
    p_event_id: eventId,
  } as any);

  if (error) {
    return {
      going: 0,
      maybe: 0,
      waitlist: 0,
      total_guests: 0,
    };
  }

  const rsvpCounts = data as RSVPCounts | null;
  return rsvpCounts || { going: 0, maybe: 0, waitlist: 0, total_guests: 0 };
}

/**
 * Get attendees list (for event page)
 */
export async function getEventAttendees(eventId: string, status?: RSVPStatus) {
  const supabase = await createClient();

  let query = supabase
    .from("event_rsvps")
    .select(
      `
      *,
      user:profiles(*),
      checkin:event_checkins(*)
    `
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return { attendees: [], error: error.message };
  }

  return { attendees: data || [] };
}

/**
 * Check in a user (for event admins)
 */
export async function checkInUser(
  eventId: string,
  userId: string,
  guestCount: number = 0,
  method: "qr" | "manual" = "manual",
  notes?: string
) {
  const supabase = await createClient();

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (!adminUser) {
    return { error: "Not authenticated" };
  }

  // Verify admin is a society admin/mod
  const { data: eventData } = await supabase
    .from("events")
    .select("society_id")
    .eq("id", eventId)
    .single();

  const event = eventData as { society_id: string } | null;

  if (!event) {
    return { error: "Event not found" };
  }

  const { data: membershipData } = await supabase
    .from("society_members")
    .select("role")
    .eq("society_id", event.society_id)
    .eq("user_id", adminUser.id)
    .eq("status", "approved")
    .single();

  const membership = membershipData as { role: string } | null;

  if (!membership || !["admin", "moderator"].includes(membership.role)) {
    return { error: "Not authorized to check in users" };
  }

  // Check if already checked in
  const { data: existingCheckin } = await supabase
    .from("event_checkins")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  if (existingCheckin) {
    return { error: "User already checked in" };
  }

  // Get RSVP if exists
  const { data: rsvpData } = await supabase
    .from("event_rsvps")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  const rsvp = rsvpData as { id: string } | null;

  // Create check-in
  const { error } = await supabase.from("event_checkins").insert({
    event_id: eventId,
    user_id: userId,
    rsvp_id: rsvp?.id || null,
    checked_in_by: adminUser.id,
    check_in_method: method,
    guest_count: guestCount,
    notes,
  } as any);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

/**
 * Check in via QR code
 */
export async function checkInViaQR(eventCode: string, userCode: string) {
  const supabase = await createClient();

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (!adminUser) {
    return { error: "Not authenticated" };
  }

  // Find event by code
  const { data: eventData } = await supabase
    .from("events")
    .select("id, society_id, title, check_in_enabled")
    .eq("event_code", eventCode)
    .single();

  const event = eventData as { id: string; society_id: string; title: string; check_in_enabled: boolean } | null;

  if (!event) {
    return { error: "Invalid event code" };
  }

  if (!event.check_in_enabled) {
    return { error: "Check-in is not enabled for this event" };
  }

  // Parse user code (format: userId or rsvpId)
  const userId = userCode;

  // Verify the user exists
  const { data: userProfileData } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", userId)
    .single();

  const userProfile = userProfileData as Profile | null;

  if (!userProfile) {
    return { error: "Invalid user code" };
  }

  // Check in the user
  const result = await checkInUser(event.id, userId, 0, "qr");

  if (result.error) {
    return result;
  }

  return {
    success: true,
    user: userProfile,
    event: { id: event.id, title: event.title },
  };
}

/**
 * Get check-in status for an event
 */
export async function getEventCheckins(eventId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_checkins")
    .select(
      `
      *,
      user:profiles(*),
      checked_in_by_user:profiles!event_checkins_checked_in_by_fkey(*)
    `
    )
    .eq("event_id", eventId)
    .order("checked_in_at", { ascending: false });

  if (error) {
    return { checkins: [], error: error.message };
  }

  return { checkins: data || [] };
}

/**
 * Undo check-in
 */
export async function undoCheckIn(eventId: string, userId: string) {
  const supabase = await createClient();

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (!adminUser) {
    return { error: "Not authenticated" };
  }

  // Verify admin permissions
  const { data: eventData } = await supabase
    .from("events")
    .select("society_id")
    .eq("id", eventId)
    .single();

  const event = eventData as { society_id: string } | null;

  if (!event) {
    return { error: "Event not found" };
  }

  const { data: membershipData } = await supabase
    .from("society_members")
    .select("role")
    .eq("society_id", event.society_id)
    .eq("user_id", adminUser.id)
    .eq("status", "approved")
    .single();

  const membership = membershipData as { role: string } | null;

  if (!membership || !["admin", "moderator"].includes(membership.role)) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("event_checkins")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

/**
 * Set reminder for an event
 */
export async function setEventReminder(
  eventId: string,
  reminderType: "24h" | "1h" | "custom",
  customTime?: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: eventData } = await supabase
    .from("events")
    .select("start_time")
    .eq("id", eventId)
    .single();

  const event = eventData as { start_time: string } | null;

  if (!event) {
    return { error: "Event not found" };
  }

  const eventTime = new Date(event.start_time);
  let remindAt: Date;

  switch (reminderType) {
    case "24h":
      remindAt = new Date(eventTime.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "1h":
      remindAt = new Date(eventTime.getTime() - 60 * 60 * 1000);
      break;
    case "custom":
      if (!customTime) {
        return { error: "Custom time required" };
      }
      remindAt = new Date(customTime);
      break;
    default:
      return { error: "Invalid reminder type" };
  }

  if (remindAt <= new Date()) {
    return { error: "Reminder time must be in the future" };
  }

  const { error } = await supabase.from("event_reminders").upsert(
    {
      event_id: eventId,
      user_id: user.id,
      remind_at: remindAt.toISOString(),
      reminder_type: reminderType,
    } as any,
    {
      onConflict: "event_id,user_id,reminder_type",
    }
  );

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Remove reminder
 */
export async function removeEventReminder(eventId: string, reminderType: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("event_reminders")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .eq("reminder_type", reminderType);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Helper: Promote users from waitlist when spots open
 */
async function promoteFromWaitlist(eventId: string) {
  const supabase = await createClient();

  const { data: eventData } = await supabase
    .from("events")
    .select("capacity")
    .eq("id", eventId)
    .single();

  const event = eventData as { capacity: number | null } | null;

  if (!event?.capacity) return;

  const { data: rsvpCountsData } = await supabase.rpc("get_event_rsvp_counts", {
    p_event_id: eventId,
  } as any);

  const rsvpCounts = rsvpCountsData as RSVPCounts | null;

  const currentCount =
    (rsvpCounts?.going || 0) + (rsvpCounts?.total_guests || 0);
  const availableSpots = event.capacity - currentCount;

  if (availableSpots <= 0) return;

  // Get waitlisted users in order
  const { data: waitlistData } = await supabase
    .from("event_rsvps")
    .select("id, user_id, guest_count")
    .eq("event_id", eventId)
    .eq("status", "waitlist")
    .order("created_at", { ascending: true })
    .limit(availableSpots);

  const waitlist = waitlistData as Array<{ id: string; user_id: string; guest_count: number }> | null;

  if (!waitlist || waitlist.length === 0) return;

  let spotsUsed = 0;
  for (const rsvp of waitlist) {
    const spotsNeeded = 1 + (rsvp.guest_count || 0);
    if (spotsUsed + spotsNeeded <= availableSpots) {
      await (supabase
        .from("event_rsvps") as any)
        .update({ status: "going" })
        .eq("id", rsvp.id);
      spotsUsed += spotsNeeded;

      // TODO: Send notification to user about promotion from waitlist
    }
  }
}

/**
 * Generate QR code data for a user's RSVP ticket
 */
export async function generateTicketQRData(eventId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get user's RSVP
  const { data: rsvpData } = await supabase
    .from("event_rsvps")
    .select("*, event:events(event_code, title)")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .single();

  const rsvp = rsvpData as (EventRSVP & { event: { event_code: string; title: string } }) | null;

  if (!rsvp) {
    return { error: "No RSVP found" };
  }

  // QR data format: eventCode:userId
  const qrData = `${rsvp.event.event_code}:${user.id}`;

  return {
    qrData,
    eventTitle: rsvp.event.title,
    status: rsvp.status,
  };
}
