import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { isSocietyModerator } from "@/lib/auth/roles";
import { AttendeesList } from "@/components/events/AttendeesList";
import { CheckInActions } from "@/app/events/[id]/manage/CheckInActions";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Download,
  Settings,
  MapPin,
  BarChart3,
} from "lucide-react";
import type { Event, Society, RSVPWithUser, CheckinWithUser } from "@/types/database";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventManagePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch event
  const { data: eventData } = await supabase
    .from("events")
    .select(`
      *,
      society:societies(*)
    `)
    .eq("id", id)
    .single();

  if (!eventData) {
    notFound();
  }

  const event = eventData as Event & { society: Society };

  // Check permissions
  const canManage = await isSocietyModerator(user.id, event.society_id);

  if (!canManage) {
    redirect(`/events/${id}`);
  }

  // Get RSVP counts
  const { data: rsvpCountsData } = await supabase.rpc("get_event_rsvp_counts", {
    p_event_id: id,
  } as any);

  const rsvpCounts = rsvpCountsData as { going: number; maybe: number; waitlist: number; total_guests: number } | null;
  const counts = rsvpCounts || { going: 0, maybe: 0, waitlist: 0, total_guests: 0 };

  // Fetch all RSVPs with user info and checkin status
  const { data: rsvpsData } = await supabase
    .from("event_rsvps")
    .select(`
      *,
      user:profiles(*),
      checkin:event_checkins(*)
    `)
    .eq("event_id", id)
    .order("created_at", { ascending: true });

  const rsvps = (rsvpsData || []) as RSVPWithUser[];

  // Get check-in stats
  const { data: checkinsData } = await supabase
    .from("event_checkins")
    .select(`
      *,
      user:profiles(*)
    `)
    .eq("event_id", id)
    .order("checked_in_at", { ascending: false });

  const checkins = (checkinsData || []) as CheckinWithUser[];
  const totalCheckedIn = checkins.length;
  const checkinRate = counts.going > 0 ? Math.round((totalCheckedIn / counts.going) * 100) : 0;

  const eventDate = new Date(event.start_time);
  const isPast = eventDate < new Date();

  return (
    <div className="bg-dark-950 min-h-screen pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/events/${id}`}
            className="inline-flex items-center gap-2 text-dark-300 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to event
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-2">
                {event.title}
              </h1>
              <p className="text-dark-300">
                {format(eventDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>


          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-sm text-dark-300">Going</span>
            </div>
            <p className="text-3xl font-bold text-white">{counts.going}</p>
            {counts.total_guests > 0 && (
              <p className="text-sm text-dark-400">+{counts.total_guests} guests</p>
            )}
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-sm text-dark-300">Maybe</span>
            </div>
            <p className="text-3xl font-bold text-white">{counts.maybe}</p>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm text-dark-300">Waitlist</span>
            </div>
            <p className="text-3xl font-bold text-white">{counts.waitlist}</p>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-accent-400" />
              </div>
              <span className="text-sm text-dark-300">Checked In</span>
            </div>
            <p className="text-3xl font-bold text-white">{totalCheckedIn}</p>
            <p className="text-sm text-dark-400">{checkinRate}% of going</p>
          </div>
        </div>

        {/* Capacity Progress */}
        {event.capacity && (
          <div className="glass rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Capacity</h3>
              <span className="text-dark-300">
                {counts.going + counts.total_guests} / {event.capacity}
              </span>
            </div>
            <div className="h-4 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-600 to-accent-400 transition-all"
                style={{
                  width: `${Math.min(100, ((counts.going + counts.total_guests) / event.capacity) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Tabs content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* RSVPs */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-accent-400" />
                RSVPs
              </h3>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-dark-300 hover:text-white bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
            <AttendeesList attendees={rsvps} showCheckinStatus={true} maxDisplay={50} />
          </div>

          {/* Check-ins & Actions */}
          <div className="space-y-6">
            {/* Manual check-in */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Manual Check-in
              </h3>
              <CheckInActions eventId={id} rsvps={rsvps} />
            </div>

            {/* Recent check-ins */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Recent Check-ins
              </h3>
              {checkins.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {checkins.slice(0, 10).map((checkin) => (
                    <div
                      key={checkin.id}
                      className="flex items-center justify-between p-3 bg-dark-800/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-dark-700 overflow-hidden">
                          {checkin.user?.avatar_url ? (
                            <Image
                              src={checkin.user.avatar_url}
                              alt={checkin.user.full_name || "User"}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-dark-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {checkin.user?.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-dark-400">
                            {checkin.check_in_method === "qr" ? "QR" : "Manual"}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-dark-400">
                        {format(new Date(checkin.checked_in_at), "h:mm a")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-center py-8">
                  No check-ins yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
