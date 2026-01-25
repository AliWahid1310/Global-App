import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSocietyModerator } from "@/lib/auth/roles";
import { QRScanner } from "@/components/events/QRScanner";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle,
  MapPin,
} from "lucide-react";
import type { Event, Society } from "@/types/database";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CheckInPage({ params }: Props) {
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

  // Get check-in stats
  const { count: checkinCount } = await supabase
    .from("event_checkins")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id);

  const { data: rsvpCountsData } = await supabase.rpc("get_event_rsvp_counts", {
    p_event_id: id,
  } as any);

  const rsvpCounts = rsvpCountsData as { going: number; maybe: number; waitlist: number; total_guests: number } | null;
  const goingCount = rsvpCounts?.going || 0;

  return (
    <div className="bg-dark-950 min-h-screen pt-24 pb-12">
      <div className="max-w-lg mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/events/${id}/manage`}
            className="inline-flex items-center gap-2 text-dark-300 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to manage
          </Link>

          <h1 className="text-2xl font-display font-bold text-white mb-2">
            QR Check-in
          </h1>
          <p className="text-dark-300">{event.title}</p>
        </div>

        {/* Event info */}
        <div className="glass rounded-2xl p-4 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-accent-500/20 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-7 h-7 text-accent-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">{event.title}</p>
            <p className="text-sm text-dark-300">
              {format(new Date(event.start_time), "MMM d, h:mm a")}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold text-white">{checkinCount || 0}</span>
            </div>
            <p className="text-sm text-dark-400">Checked In</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="w-5 h-5 text-accent-400" />
              <span className="text-2xl font-bold text-white">{goingCount}</span>
            </div>
            <p className="text-sm text-dark-400">Expected</p>
          </div>
        </div>

        {/* QR Scanner */}
        {event.event_code ? (
          <QRScanner eventCode={event.event_code} />
        ) : (
          <div className="text-center py-12 glass rounded-2xl">
            <p className="text-dark-400">
              Event code not available. Please contact support.
            </p>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 space-y-3">
          <h3 className="text-sm font-medium text-white">Tips</h3>
          <ul className="space-y-2 text-sm text-dark-300">
            <li className="flex items-start gap-2">
              <span className="text-accent-400">•</span>
              Hold the camera steady over the QR code
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-400">•</span>
              Ensure good lighting for better scanning
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-400">•</span>
              Use manual entry if the QR code is damaged
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
