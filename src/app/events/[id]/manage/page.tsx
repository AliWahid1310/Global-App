import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSocietyModerator } from "@/lib/auth/roles";
import { AttendeesList } from "@/components/events/AttendeesList";
import { format } from "date-fns";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  Clock,
  Download,
} from "lucide-react";
import type { Event, Society, RSVPWithUser } from "@/types/database";

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

  // Fetch all RSVPs with user info
  const { data: rsvpsData } = await supabase
    .from("event_rsvps")
    .select(`
      *,
      user:profiles(*)
    `)
    .eq("event_id", id)
    .order("created_at", { ascending: true });

  const rsvps = (rsvpsData || []) as RSVPWithUser[];

  // Calculate counts from fetched RSVPs
  const counts = {
    going: rsvps.filter(r => r.status === "going").length,
    maybe: rsvps.filter(r => r.status === "maybe").length,
    waitlist: rsvps.filter(r => r.status === "waitlist").length,
    total_guests: rsvps.reduce((sum, r) => sum + (r.guest_count || 0), 0),
  };

  const eventDate = new Date(event.start_time);

  return (
    <div className="bg-dark-950 min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/events/${id}`}
            className="inline-flex items-center gap-2 text-dark-300 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to event
          </Link>

          <h1 className="text-3xl font-display font-bold text-white mb-2">
            {event.title}
          </h1>
          <p className="text-dark-300">
            {format(eventDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
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

        {/* RSVPs List */}
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
          <AttendeesList attendees={rsvps} showCheckinStatus={false} maxDisplay={100} />
        </div>
      </div>
    </div>
  );
}
