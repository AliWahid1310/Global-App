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
          start_time: string;
          end_time: string | null;
          is_public: boolean;
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
          start_time: string;
          end_time?: string | null;
          is_public?: boolean;
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
          start_time?: string;
          end_time?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      member_status: MemberStatus;
      member_role: MemberRole;
    };
  };
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Society = Database["public"]["Tables"]["societies"]["Row"];
export type SocietyMember = Database["public"]["Tables"]["society_members"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

// Extended types with relations
export type PostWithAuthor = Post & {
  author: Profile | null;
  society: Society;
};

export type EventWithSociety = Event & {
  society: Society;
};

export type SocietyMemberWithProfile = SocietyMember & {
  profile: Profile;
};

export type ChatMessageWithUser = ChatMessage & {
  user: Profile | null;
};
