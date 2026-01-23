import { createClient } from "@/lib/supabase/server";
import { EventCard } from "@/components/society/EventCard";
import { Calendar, Sparkles } from "lucide-react";
import type { Event, Society } from "@/types/database";

type EventWithSociety = Event & { society: Society | null };

export const revalidate = 60;

export default async function EventsPage() {
  const supabase = await createClient();

  // Fetch upcoming events
  const { data: upcomingEventsData } = await supabase
    .from("events")
    .select(
      `
      *,
      society:societies(*)
    `
    )
    .eq("is_public", true)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  const upcomingEvents = (upcomingEventsData || []) as EventWithSociety[];

  // Fetch past events (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: pastEventsData } = await supabase
    .from("events")
    .select(
      `
      *,
      society:societies(*)
    `
    )
    .eq("is_public", true)
    .lt("start_time", new Date().toISOString())
    .gte("start_time", thirtyDaysAgo.toISOString())
    .order("start_time", { ascending: false })
    .limit(12);

  const pastEvents = (pastEventsData || []) as EventWithSociety[];

  return (
    <div className="bg-dark-950 min-h-screen relative pt-24">
      <div className="absolute inset-0 bg-gradient-radial from-accent-900/10 via-transparent to-transparent" />
      <div className="noise-overlay" />

      {/* Header */}
      <div className="relative z-10 glass-light border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent-500/20 flex items-center justify-center">
              <Calendar className="h-7 w-7 text-accent-400" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-white">Events</h1>
              <p className="mt-1 text-dark-200">
                Discover upcoming events from communities on Circl
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Upcoming Events */}
        <section className="mb-12">
          <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent-400" />
            Upcoming Events
          </h2>
          {upcomingEvents.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event, index) => (
                <div 
                  key={event.id} 
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass-light rounded-2xl">
              <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-dark-400" />
              </div>
              <p className="text-dark-200 text-lg">No upcoming events</p>
              <p className="text-dark-400 text-sm mt-1">
                Check back later for new events!
              </p>
            </div>
          )}
        </section>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <section>
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              Recent Past Events
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
