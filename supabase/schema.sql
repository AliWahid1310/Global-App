-- Student Societies MVP Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase Auth users)
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    university TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- SOCIETIES TABLE
-- ============================================
CREATE TABLE societies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    university TEXT,
    category TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE societies ENABLE ROW LEVEL SECURITY;

-- Societies policies
CREATE POLICY "Public societies are viewable by everyone" ON societies
    FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can create societies" ON societies
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Society admins can update their societies" ON societies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM society_members 
            WHERE society_id = societies.id 
            AND user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================
-- SOCIETY MEMBERS TABLE
-- ============================================
CREATE TYPE member_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE member_role AS ENUM ('member', 'moderator', 'admin');

CREATE TABLE society_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role member_role DEFAULT 'member',
    status member_status DEFAULT 'pending',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(society_id, user_id)
);

-- Enable RLS
ALTER TABLE society_members ENABLE ROW LEVEL SECURITY;

-- Society members policies
CREATE POLICY "Members can view society members" ON society_members
    FOR SELECT USING (
        status = 'approved' OR 
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM society_members sm 
            WHERE sm.society_id = society_members.society_id 
            AND sm.user_id = auth.uid() 
            AND sm.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Users can request to join societies" ON society_members
    FOR INSERT WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can update membership status" ON society_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM society_members sm 
            WHERE sm.society_id = society_members.society_id 
            AND sm.user_id = auth.uid() 
            AND sm.role = 'admin'
        )
    );

CREATE POLICY "Users can leave societies" ON society_members
    FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- POSTS TABLE (Announcements)
-- ============================================
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Public posts are viewable by everyone" ON posts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM societies WHERE id = posts.society_id AND is_public = true)
    );

CREATE POLICY "Society admins/mods can create posts" ON posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM society_members 
            WHERE society_id = posts.society_id 
            AND user_id = auth.uid() 
            AND role IN ('admin', 'moderator')
            AND status = 'approved'
        )
    );

CREATE POLICY "Post authors and admins can update posts" ON posts
    FOR UPDATE USING (
        author_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM society_members 
            WHERE society_id = posts.society_id 
            AND user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Post authors and admins can delete posts" ON posts
    FOR DELETE USING (
        author_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM society_members 
            WHERE society_id = posts.society_id 
            AND user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    location TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Public events are viewable by everyone" ON events
    FOR SELECT USING (
        is_public = true AND
        EXISTS (SELECT 1 FROM societies WHERE id = events.society_id AND is_public = true)
    );

CREATE POLICY "Society admins/mods can create events" ON events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM society_members 
            WHERE society_id = events.society_id 
            AND user_id = auth.uid() 
            AND role IN ('admin', 'moderator')
            AND status = 'approved'
        )
    );

CREATE POLICY "Event creators and admins can update events" ON events
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM society_members 
            WHERE society_id = events.society_id 
            AND user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================
-- CHAT MESSAGES TABLE (Realtime)
-- ============================================
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat messages policies
CREATE POLICY "Society members can view chat messages" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM society_members 
            WHERE society_id = chat_messages.society_id 
            AND user_id = auth.uid() 
            AND status = 'approved'
        )
    );

CREATE POLICY "Society members can send messages" ON chat_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM society_members 
            WHERE society_id = chat_messages.society_id 
            AND user_id = auth.uid() 
            AND status = 'approved'
        )
    );

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX idx_societies_slug ON societies(slug);
CREATE INDEX idx_society_members_society ON society_members(society_id);
CREATE INDEX idx_society_members_user ON society_members(user_id);
CREATE INDEX idx_posts_society ON posts(society_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_events_society ON events(society_id);
CREATE INDEX idx_events_start ON events(start_time);
CREATE INDEX idx_chat_messages_society ON chat_messages(society_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_societies_updated_at BEFORE UPDATE ON societies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_society_members_updated_at BEFORE UPDATE ON society_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE REALTIME for chat_messages
-- ============================================
-- Run this in Supabase Dashboard > Database > Replication
-- Or via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================
-- Uncomment below to add test data

/*
-- Insert a test admin user profile (replace with actual user ID after signup)
-- UPDATE profiles SET is_admin = true WHERE email = 'admin@example.com';

-- Insert sample societies
INSERT INTO societies (name, slug, description, category, university) VALUES
('Computer Science Club', 'cs-club', 'A community for CS enthusiasts to learn, collaborate, and grow together.', 'Technology', 'University of Example'),
('Photography Society', 'photo-society', 'Capture moments, share perspectives, and develop your photography skills.', 'Arts', 'University of Example'),
('Debate Club', 'debate-club', 'Sharpen your argumentation and public speaking skills.', 'Academic', 'University of Example');
*/
