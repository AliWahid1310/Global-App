import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import type { Event, Society } from "@/types/database";
import { Calendar, MapPin, Clock, Users, Check } from "lucide-react";

interface EventCardProps {
  event: Event & {
    society?: Society | null;
  };
  rsvpCount?: {
    going: number;
    maybe: number;
    total_guests: number;
  };
  userRSVPStatus?: string | null;
}

export function EventCard({ event, rsvpCount, userRSVPStatus }: EventCardProps) {
  const startDate = new Date(event.start_time);
  const isPast = startDate < new Date();
  const totalAttending = rsvpCount ? rsvpCount.going + rsvpCount.total_guests : 0;
  const spotsLeft = event.capacity ? event.capacity - totalAttending : null;

  return (
    <Link href={`/events/${event.id}`} className="block">
      <div className={`glass-light rounded-xl overflow-hidden hover:border-accent-500/30 transition-all duration-300 group ${isPast ? 'opacity-70' : ''}`}>
        {event.image_url && (
          <div className="relative h-36 w-full overflow-hidden">
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
            
            {/* Status badges */}
            <div className="absolute top-3 right-3 flex gap-2">
              {userRSVPStatus === "going" && (
                <span className="px-2 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Going
                </span>
              )}
              {isPast && (
                <span className="px-2 py-1 bg-dark-700/90 backdrop-blur-sm text-dark-300 text-xs rounded-full">
                  Ended
                </span>
              )}
            </div>
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex flex-col items-center justify-center bg-accent-500/20 rounded-xl px-3 py-2 min-w-[60px] border border-accent-500/30">
              <span className="text-xs font-medium text-accent-400 uppercase tracking-wider">
                {format(startDate, "MMM")}
              </span>
              <span className="text-2xl font-bold text-white">
                {format(startDate, "d")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white line-clamp-1 group-hover:text-accent-300 transition-colors">
                {event.title}
              </h3>
              {event.society && (
                <span className="text-sm text-accent-400">
                  {event.society.name}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm text-dark-300">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-dark-400" />
              <span>{format(startDate, "h:mm a")}</span>
            </div>
            {event.location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-dark-400" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
          </div>

          {/* RSVP info */}
          {rsvpCount && (
            <div className="mt-4 pt-3 border-t border-dark-700 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm">
                <Users className="w-4 h-4 text-accent-400" />
                <span className="text-white font-medium">{rsvpCount.going}</span>
                <span className="text-green-400 font-semibold">going</span>
                {rsvpCount.maybe > 0 && (
                  <span className="text-dark-500">• {rsvpCount.maybe} maybe</span>
                )}
              </div>
              {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 10 && (
                <span className="text-xs text-amber-400 bg-amber-500/20 px-2 py-1 rounded-full">
                  {spotsLeft} spots left
                </span>
              )}
              {spotsLeft !== null && spotsLeft <= 0 && (
                <span className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded-full">
                  Full
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
