import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSocietyModerator } from "@/lib/auth/roles";
import { RSVPSection } from "@/components/events/RSVPSection";
import { AttendeesList, AttendeesPreview } from "@/components/events/AttendeesList";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  Settings,
  CheckCircle,
} from "lucide-react";
import type { Event, Society, EventRSVP, Profile, RSVPWithUser } from "@/types/database";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch event with society
  const { data: eventData, error } = await supabase
    .from("events")
    .select(`
      *,
      society:societies(*)
    `)
    .eq("id", id)
    .single();

  if (error || !eventData) {
    notFound();
  }

  const event = eventData as Event & { society: Society };

  // Check if user can manage this event
  const canManage = user
    ? await isSocietyModerator(user.id, event.society_id)
    : false;

  // Fetch all RSVPs to calculate counts
  const { data: allRsvps } = await supabase
    .from("event_rsvps")
    .select("status, guest_count")
    .eq("event_id", id);

  const rsvpList = (allRsvps || []) as { status: string; guest_count: number | null }[];
  const counts = {
    going: rsvpList.filter(r => r.status === "going").length,
    maybe: rsvpList.filter(r => r.status === "maybe").length,
    waitlist: rsvpList.filter(r => r.status === "waitlist").length,
    total_guests: rsvpList.reduce((sum, r) => sum + (r.guest_count || 0), 0),
  };

  // Get user's RSVP
  let userRSVP: EventRSVP | null = null;
  let userCheckin = null;
  if (user) {
    const { data: rsvp } = await supabase
      .from("event_rsvps")
      .select("*")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .single();
    userRSVP = rsvp as EventRSVP | null;

    // Check if user has checked in
    const { data: checkin } = await supabase
      .from("event_checkins")
      .select("*")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .single();
    userCheckin = checkin;
  }

  // Fetch attendees (limited for preview)
  const { data: attendeesData } = await supabase
    .from("event_rsvps")
    .select(`
      *,
      user:profiles(*),
      checkin:event_checkins(*)
    `)
    .eq("event_id", id)
    .in("status", ["going", "maybe"])
    .order("created_at", { ascending: true })
    .limit(20);

  const attendees = (attendeesData || []) as RSVPWithUser[];

  // Event timing
  const eventDate = new Date(event.start_time);
  const isUpcoming = eventDate > new Date();
  const isPast = eventDate < new Date();
  const isToday = eventDate.toDateString() === new Date().toDateString();

  // Capacity info
  const totalAttending = counts.going + counts.total_guests;
  const isAtCapacity = event.capacity && totalAttending >= event.capacity;

  return (
    <div className="bg-dark-950 min-h-screen pt-24">
      {/* Hero / Banner */}
      <div className="relative h-64 md:h-80">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent-600 via-accent-700 to-dark-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-transparent" />

        {/* Back button */}
        <div className="absolute top-6 left-6 z-10">
          <Link
            href={`/societies/${event.society.slug}`}
            className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {event.society.name}
          </Link>
        </div>

        {/* Admin actions */}
        {canManage && (
          <div className="absolute top-6 right-6 z-10">
            <Link
              href={`/events/${id}/manage`}
              className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-white hover:bg-white/10 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Manage
            </Link>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-20 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event info card */}
            <div className="glass rounded-3xl p-8">
              {/* Status badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {isPast && (
                  <span className="px-3 py-1 bg-dark-700 text-dark-300 text-sm rounded-full">
                    Event Ended
                  </span>
                )}
                {isToday && isUpcoming && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Today
                  </span>
                )}
                {isAtCapacity && (
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full">
                    At Capacity
                  </span>
                )}
                {userCheckin && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Checked In
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                {event.title}
              </h1>

              {/* Society link */}
              <Link
                href={`/societies/${event.society.slug}`}
                className="inline-flex items-center gap-2 text-accent-400 hover:text-accent-300 mb-6 transition-colors"
              >
                {event.society.logo_url && (
                  <Image
                    src={event.society.logo_url}
                    alt={event.society.name}
                    width={24}
                    height={24}
                    className="rounded-lg"
                  />
                )}
                <span className="font-medium">{event.society.name}</span>
              </Link>

              {/* Date & Time */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-accent-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {format(eventDate, "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-dark-300">
                      {format(eventDate, "h:mm a")}
                      {event.end_time && ` - ${format(new Date(event.end_time), "h:mm a")}`}
                    </p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-glow/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-glow" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{event.location}</p>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-400 hover:text-accent-300 text-sm transition-colors"
                      >
                        View on map →
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-lg font-semibold text-white mb-3">About this event</h3>
                  <p className="text-dark-200 whitespace-pre-wrap">{event.description}</p>
                </div>
              )}
            </div>

            {/* Attendees section */}
            <div className="glass rounded-3xl p-8">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-accent-400" />
                Attendees
              </h3>
              <AttendeesList attendees={attendees} showCheckinStatus={canManage} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* RSVP Card - Now a single client component */}
            <RSVPSection
              event={event}
              userRSVP={userRSVP}
              rsvpCount={counts}
              isLoggedIn={!!user}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
