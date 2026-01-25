import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventTicket } from "@/components/events/QRCode";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import type { Event, Society, EventRSVP, Profile } from "@/types/database";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TicketPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/events/${id}/ticket`);
  }

  // Get user profile
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as Profile | null;

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

  // Get user's RSVP
  const { data: rsvp } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", id)
    .eq("user_id", user.id)
    .single();

  if (!rsvp) {
    redirect(`/events/${id}`);
  }

  const userRSVP = rsvp as EventRSVP;

  // Generate QR data
  const qrData = `${event.event_code}:${user.id}`;

  return (
    <div className="bg-dark-950 min-h-screen pt-24 pb-12">
      <div className="max-w-lg mx-auto px-6">
        {/* Back button */}
        <Link
          href={`/events/${id}`}
          className="inline-flex items-center gap-2 text-dark-300 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to event
        </Link>

        {/* Ticket */}
        <div className="glass rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-accent-600 to-accent-500 p-6">
            <p className="text-white/80 text-sm font-medium mb-1">
              {event.society.name}
            </p>
            <h1 className="text-2xl font-bold text-white">{event.title}</h1>
          </div>

          {/* Event details */}
          <div className="p-6 border-b border-dark-700 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent-400" />
              </div>
              <div>
                <p className="font-medium text-white">
                  {format(new Date(event.start_time), "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-sm text-dark-300">
                  {format(new Date(event.start_time), "h:mm a")}
                  {event.end_time && ` - ${format(new Date(event.end_time), "h:mm a")}`}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-glow/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-glow" />
                </div>
                <p className="text-white">{event.location}</p>
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="p-8 bg-dark-800 flex flex-col items-center">
            <p className="text-sm text-dark-400 mb-4">
              Show this code at check-in
            </p>
            <EventTicket
              qrData={qrData}
              eventTitle={event.title}
              eventDate={format(new Date(event.start_time), "MMM d, yyyy 'at' h:mm a")}
              userName={profile?.full_name || user.email || "Guest"}
              status={userRSVP.status}
            />
          </div>

          {/* Footer */}
          <div className="p-6 bg-dark-900">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-dark-400">Attendee</p>
                <p className="text-white font-medium">
                  {profile?.full_name || user.email}
                </p>
              </div>
              <div className="text-right">
                <p className="text-dark-400">Status</p>
                <p
                  className={`font-medium capitalize ${
                    userRSVP.status === "going"
                      ? "text-green-400"
                      : userRSVP.status === "waitlist"
                      ? "text-blue-400"
                      : "text-amber-400"
                  }`}
                >
                  {userRSVP.status}
                </p>
              </div>
            </div>
            {userRSVP.guest_count > 0 && (
              <p className="mt-3 text-sm text-dark-300">
                + {userRSVP.guest_count} guest{userRSVP.guest_count > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-dark-800/50 rounded-xl">
          <p className="text-sm text-dark-300">
            💡 <strong className="text-white">Tip:</strong> Screenshot this ticket
            or save it for offline access.
          </p>
        </div>
      </div>
    </div>
  );
}
