export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MemberStatus = "pending" | "approved" | "rejected";
export type MemberRole = "member" | "moderator" | "admin";
export type SocietyStatus = "pending" | "approved" | "rejected";
export type RSVPStatus = "going" | "maybe" | "not_going" | "waitlist";
export type CheckInMethod = "qr" | "manual" | "self";
export type HierarchyLevel = "president" | "vice_president" | "executive" | "director" | "deputy_director";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          university: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          university?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          university?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      societies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          banner_url: string | null;
          university: string | null;
          category: string | null;
          is_public: boolean;
          status: SocietyStatus;
          contact_phone: string | null;
          is_founding: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          university?: string | null;
          category?: string | null;
          is_public?: boolean;
          status?: SocietyStatus;
          contact_phone?: string | null;
          is_founding?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          university?: string | null;
          category?: string | null;
          is_public?: boolean;
          status?: SocietyStatus;
          is_founding?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      society_members: {
        Row: {
          id: string;
          society_id: string;
          user_id: string;
          role: MemberRole;
          status: MemberStatus;
          joined_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          society_id: string;
          user_id: string;
          role?: MemberRole;
          status?: MemberStatus;
          joined_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          society_id?: string;
          user_id?: string;
          role?: MemberRole;
          status?: MemberStatus;
          joined_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          society_id: string;
          author_id: string | null;
          title: string;
          content: string | null;
          image_url: string | null;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          society_id: string;
          author_id?: string | null;
          title: string;
          content?: string | null;
          image_url?: string | null;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          society_id?: string;
          author_id?: string | null;
          title?: string;
          content?: string | null;
          image_url?: string | null;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          society_id: string;
          created_by: string | null;
          title: string;
          description: string | null;
          image_url: string | null;
          location: string | null;
          venue: string | null;
          start_time: string;
          end_time: string | null;
          is_public: boolean;
          capacity: number | null;
          rsvp_deadline: string | null;
          requires_approval: boolean;
          allow_guests: boolean;
          max_guests_per_rsvp: number;
          check_in_enabled: boolean;
          event_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          society_id: string;
          created_by?: string | null;
          title: string;
          description?: string | null;
          image_url?: string | null;
          location?: string | null;
          venue?: string | null;
          start_time: string;
          end_time?: string | null;
          is_public?: boolean;
          capacity?: number | null;
          rsvp_deadline?: string | null;
          requires_approval?: boolean;
          allow_guests?: boolean;
          max_guests_per_rsvp?: number;
          check_in_enabled?: boolean;
          event_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          society_id?: string;
          created_by?: string | null;
          title?: string;
          description?: string | null;
          image_url?: string | null;
          location?: string | null;
          venue?: string | null;
          start_time?: string;
          end_time?: string | null;
          is_public?: boolean;
          capacity?: number | null;
          rsvp_deadline?: string | null;
          requires_approval?: boolean;
          allow_guests?: boolean;
          max_guests_per_rsvp?: number;
          check_in_enabled?: boolean;
          event_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_rsvps: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          status: RSVPStatus;
          guest_count: number;
          notes: string | null;
          reminder_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          status?: RSVPStatus;
          guest_count?: number;
          notes?: string | null;
          reminder_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          status?: RSVPStatus;
          guest_count?: number;
          notes?: string | null;
          reminder_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_checkins: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          rsvp_id: string | null;
          checked_in_by: string | null;
          check_in_method: CheckInMethod;
          checked_in_at: string;
          guest_count: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          rsvp_id?: string | null;
          checked_in_by?: string | null;
          check_in_method?: CheckInMethod;
          checked_in_at?: string;
          guest_count?: number;
          notes?: string | null;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          rsvp_id?: string | null;
          checked_in_by?: string | null;
          check_in_method?: CheckInMethod;
          checked_in_at?: string;
          guest_count?: number;
          notes?: string | null;
        };
      };
      event_reminders: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          remind_at: string;
          reminder_type: string;
          sent: boolean;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          remind_at: string;
          reminder_type?: string;
          sent?: boolean;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          remind_at?: string;
          reminder_type?: string;
          sent?: boolean;
          sent_at?: string | null;
          created_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          society_id: string;
          user_id: string | null;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          society_id: string;
          user_id?: string | null;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          society_id?: string;
          user_id?: string | null;
          content?: string;
          created_at?: string;
        };
      };
      post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      society_positions: {
        Row: {
          id: string;
          society_id: string;
          user_id: string | null;
          position_title: string;
          hierarchy_level: HierarchyLevel;
          display_order: number;
          custom_title: string | null;
          tenure_start: string | null;
          tenure_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          society_id: string;
          user_id?: string | null;
          position_title: string;
          hierarchy_level: HierarchyLevel;
          display_order?: number;
          custom_title?: string | null;
          tenure_start?: string | null;
          tenure_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          society_id?: string;
          user_id?: string | null;
          position_title?: string;
          hierarchy_level?: HierarchyLevel;
          display_order?: number;
          custom_title?: string | null;
          tenure_start?: string | null;
          tenure_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_event_rsvp_counts: {
        Args: {
          p_event_id: string;
        };
        Returns: {
          going: number;
          maybe: number;
          waitlist: number;
          total_guests: number;
        };
      };
      is_event_at_capacity: {
        Args: {
          p_event_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      member_status: MemberStatus;
      member_role: MemberRole;
      rsvp_status: RSVPStatus;
      check_in_method: CheckInMethod;
    };
  };
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Society = Database["public"]["Tables"]["societies"]["Row"];
export type SocietyMember = Database["public"]["Tables"]["society_members"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventRSVP = Database["public"]["Tables"]["event_rsvps"]["Row"];
export type EventCheckin = Database["public"]["Tables"]["event_checkins"]["Row"];
export type EventReminder = Database["public"]["Tables"]["event_reminders"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
export type PostLike = Database["public"]["Tables"]["post_likes"]["Row"];
export type SocietyPosition = Database["public"]["Tables"]["society_positions"]["Row"];

// Extended types with relations
export type PostWithAuthor = Post & {
  author: Profile | null;
  society: Society;
};

export type EventWithSociety = Event & {
  society: Society;
};

export type EventWithDetails = Event & {
  society: Society;
  rsvp_count?: {
    going: number;
    maybe: number;
    waitlist: number;
    total_guests: number;
  };
  user_rsvp?: EventRSVP | null;
  user_checkin?: EventCheckin | null;
};

export type RSVPWithUser = EventRSVP & {
  user: Profile;
  checkin?: EventCheckin | EventCheckin[] | null;
};

export type CheckinWithUser = EventCheckin & {
  user: Profile;
  checked_in_by_user?: Profile | null;
};

export type SocietyMemberWithProfile = SocietyMember & {
  profile: Profile;
};

export type ChatMessageWithUser = ChatMessage & {
  user: Profile | null;
};

export type SocietyPositionWithUser = SocietyPosition & {
  user: Profile | null;
};

// Feed types
export type FeedItemType = 'event' | 'announcement';

export interface BaseFeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  description: string | null;
  image_url: string | null;
  society_id: string;
  society_name: string;
  society_slug: string;
  society_logo: string | null;
  created_at: string;
}

export interface EventFeedItem extends BaseFeedItem {
  type: 'event';
  start_time: string;
  end_time: string | null;
  location: string | null;
  capacity: number | null;
  rsvp_count: {
    going: number;
    maybe: number;
    total_guests: number;
  };
  user_rsvp_status: RSVPStatus | null;
}

export interface AnnouncementFeedItem extends BaseFeedItem {
  type: 'announcement';
  author_name: string | null;
  author_avatar: string | null;
  is_pinned: boolean;
}

export type FeedItem = EventFeedItem | AnnouncementFeedItem;
