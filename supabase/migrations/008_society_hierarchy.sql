-- Society Hierarchy/Leadership Positions
-- This migration adds support for society leadership structure

-- Create enum for hierarchy levels
CREATE TYPE hierarchy_level AS ENUM ('president', 'vice_president', 'executive', 'director', 'deputy_director');

-- Create society_positions table
CREATE TABLE society_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    position_title TEXT NOT NULL,
    hierarchy_level hierarchy_level NOT NULL,
    display_order INTEGER DEFAULT 0,
    custom_title TEXT, -- Optional custom title (e.g., "Director of Marketing")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(society_id, user_id, hierarchy_level) -- Prevent duplicate positions
);

-- Enable RLS
ALTER TABLE society_positions ENABLE ROW LEVEL SECURITY;

-- Policies for society_positions
CREATE POLICY "Society positions are viewable by everyone" ON society_positions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM societies WHERE id = society_positions.society_id AND is_public = true)
    );

CREATE POLICY "Society admins can manage positions" ON society_positions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM society_members 
            WHERE society_id = society_positions.society_id 
            AND user_id = auth.uid() 
            AND role = 'admin'
            AND status = 'approved'
        )
    );

CREATE POLICY "Society admins can update positions" ON society_positions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM society_members 
            WHERE society_id = society_positions.society_id 
            AND user_id = auth.uid() 
            AND role = 'admin'
            AND status = 'approved'
        )
    );

CREATE POLICY "Society admins can delete positions" ON society_positions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM society_members 
            WHERE society_id = society_positions.society_id 
            AND user_id = auth.uid() 
            AND role = 'admin'
            AND status = 'approved'
        )
    );

-- Create indexes for performance
CREATE INDEX idx_society_positions_society ON society_positions(society_id);
CREATE INDEX idx_society_positions_user ON society_positions(user_id);
CREATE INDEX idx_society_positions_level ON society_positions(hierarchy_level);

-- Apply updated_at trigger
CREATE TRIGGER update_society_positions_updated_at BEFORE UPDATE ON society_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
