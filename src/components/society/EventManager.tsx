"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { ImageUpload } from "@/components/ui/ImageUpload";
import type { Event } from "@/types/database";
import { Plus, Loader2, Trash2, X, Calendar, MapPin, Users, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

interface EventManagerProps {
  societyId: string;
  events: Event[];
}

export function EventManager({ societyId, events }: EventManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  // New RSVP fields
  const [capacity, setCapacity] = useState<string>("");
  const [rsvpDeadline, setRsvpDeadline] = useState("");
  const [allowGuests, setAllowGuests] = useState(false);
  const [maxGuestsPerRsvp, setMaxGuestsPerRsvp] = useState("2");
  const [checkInEnabled, setCheckInEnabled] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [optimisticEvents, setOptimisticEvents] = useState<Event[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const router = useRouter();
  const supabase = createClient();

  // Combine real events with optimistic ones, excluding deleted
  const displayEvents = [...optimisticEvents, ...events.filter(e => !deletedIds.includes(e.id))];

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setStartTime("");
    setEndTime("");
    setImageFile(null);
    setCapacity("");
    setRsvpDeadline("");
    setAllowGuests(false);
    setMaxGuestsPerRsvp("2");
    setCheckInEnabled(true);
    setShowAdvanced(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      let imageUrl: string | null = null;

      if (imageFile) {
        const result = await uploadToCloudinary(imageFile, "events");
        imageUrl = result.secure_url;
      }

      const eventData = {
        society_id: societyId,
        created_by: user.id,
        title,
        description,
        location,
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : null,
        image_url: imageUrl,
        is_public: true,
        capacity: capacity ? parseInt(capacity) : null,
        rsvp_deadline: rsvpDeadline ? new Date(rsvpDeadline).toISOString() : null,
        allow_guests: allowGuests,
        max_guests_per_rsvp: allowGuests ? parseInt(maxGuestsPerRsvp) : 0,
        check_in_enabled: checkInEnabled,
      };

      // Create optimistic event
      const optimisticEvent: Event = {
        id: `temp-${Date.now()}`,
        society_id: societyId,
        created_by: user.id,
        title,
        description,
        location,
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : null,
        image_url: imageUrl,
        is_public: true,
        capacity: capacity ? parseInt(capacity) : null,
        rsvp_deadline: rsvpDeadline ? new Date(rsvpDeadline).toISOString() : null,
        requires_approval: false,
        allow_guests: allowGuests,
        max_guests_per_rsvp: allowGuests ? parseInt(maxGuestsPerRsvp) : 0,
        check_in_enabled: checkInEnabled,
        event_code: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Show optimistic update immediately
      setOptimisticEvents(prev => [optimisticEvent, ...prev]);
      resetForm();
      setShowForm(false);

      const { error } = await (supabase.from("events") as any).insert(eventData);

      if (error) {
        // Revert optimistic update on error
        setOptimisticEvents(prev => prev.filter(e => e.id !== optimisticEvent.id));
        throw error;
      }

      // Clear optimistic events after refresh brings real data
      router.refresh();
      setTimeout(() => setOptimisticEvents([]), 1000);
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    // Optimistic delete - hide immediately
    setDeletedIds(prev => [...prev, eventId]);
    
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) {
        // Revert on error
        setDeletedIds(prev => prev.filter(id => id !== eventId));
        throw error;
      }
      router.refresh();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const now = new Date();
  const upcomingEvents = displayEvents.filter(
    (e) => new Date(e.start_time) >= now
  );
  const pastEvents = displayEvents.filter((e) => new Date(e.start_time) < now);

  return (
    <div>
      {/* Create Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-dark-600 rounded-xl text-dark-300 hover:border-accent-500 hover:text-accent-400 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Event
        </button>
      )}

      {/* Create Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-5 border border-dark-700 rounded-xl bg-dark-800/50"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-white">New Event</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-dark-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-dark-900 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm"
                placeholder="Event name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-dark-900 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm resize-none"
                placeholder="Event details..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 bg-dark-900 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm"
                placeholder="Where is it happening?"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  Start *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-900 border border-dark-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  End
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-900 border border-dark-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm [color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Event Image
              </label>
              <ImageUpload onFileSelect={setImageFile} aspectRatio="banner" />
            </div>

            {/* Advanced Options */}
            <div className="border-t border-dark-700 pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-dark-300 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
                RSVP & Check-in Options
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 p-4 bg-dark-900/50 rounded-xl">
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <div>
                      <label className="block text-sm font-medium text-dark-200 mb-1.5">
                        Capacity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        className="w-full px-4 py-2.5 bg-dark-900 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm"
                        placeholder="No limit"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-200 mb-1.5">
                        RSVP Deadline
                      </label>
                      <input
                        type="datetime-local"
                        value={rsvpDeadline}
                        onChange={(e) => setRsvpDeadline(e.target.value)}
                        className="w-full px-4 py-2.5 bg-dark-900 border border-dark-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-dark-200">Allow Guests</p>
                      <p className="text-xs text-dark-400">Let attendees bring +1s</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAllowGuests(!allowGuests)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        allowGuests ? "bg-accent-500" : "bg-dark-600"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          allowGuests ? "left-7" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  {allowGuests && (
                    <div>
                      <label className="block text-sm font-medium text-dark-200 mb-1">
                        Max Guests per RSVP
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={maxGuestsPerRsvp}
                        onChange={(e) => setMaxGuestsPerRsvp(e.target.value)}
                        className="w-24 px-4 py-2.5 bg-dark-900 border border-dark-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 text-dark-300 hover:text-white hover:bg-dark-700 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title || !startTime}
                className="px-5 py-2.5 bg-accent-500 text-white rounded-xl hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Event"
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Events List */}
      <div className="mt-4 space-y-4">
        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-dark-400 mb-2">Upcoming</h4>
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 bg-dark-800/50 border border-dark-700 rounded-xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-white text-sm truncate">
                        {event.title}
                      </h5>
                      <div className="flex items-center gap-2 mt-1 text-xs text-dark-300">
                        <Calendar className="h-3 w-3 text-accent-400" />
                        {format(new Date(event.start_time), "MMM d, h:mm a")}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-dark-400">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      {event.capacity && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-dark-400">
                          <Users className="h-3 w-3" />
                          <span>Capacity: {event.capacity}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!event.id.startsWith('temp-') && (
                        <Link
                          href={`/events/${event.id}/manage`}
                          className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-600 rounded-lg transition-colors"
                          title="Manage"
                        >
                          <Settings className="h-4 w-4" />
                        </Link>
                      )}
                      {loadingId === event.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-dark-400" />
                      ) : (
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-dark-500 mb-2">Past</h4>
            <div className="space-y-2">
              {pastEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="p-3 bg-dark-800/30 border border-dark-700/50 rounded-xl opacity-60"
                >
                  <h5 className="font-medium text-dark-300 text-sm truncate">
                    {event.title}
                  </h5>
                  <p className="text-xs text-dark-500 mt-1">
                    {format(new Date(event.start_time), "MMM d, yyyy")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {displayEvents.length === 0 && !showForm && (
          <p className="text-dark-400 text-sm text-center py-6">
            No events yet. Create your first one!
          </p>
        )}
      </div>
    </div>
  );
}
