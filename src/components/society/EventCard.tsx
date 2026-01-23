import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import type { Event, Society } from "@/types/database";
import { Calendar, MapPin, Clock } from "lucide-react";

interface EventCardProps {
  event: Event & {
    society?: Society | null;
  };
}

export function EventCard({ event }: EventCardProps) {
  const startDate = new Date(event.start_time);

  return (
    <div className="glass-light rounded-xl overflow-hidden hover:border-accent-500/30 transition-all duration-300 group">
      {event.image_url && (
        <div className="relative h-36 w-full overflow-hidden">
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
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
              <Link
                href={`/societies/${event.society.slug}`}
                className="text-sm text-accent-400 hover:text-accent-300 transition-colors"
              >
                {event.society.name}
              </Link>
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
      </div>
    </div>
  );
}
