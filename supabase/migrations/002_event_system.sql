-- Event System Enhancement Migration
-- Adds RSVP, Check-in, and Reminder functionality

-- ============================================
-- UPDATE EVENTS TABLE
-- ============================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS rsvp_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS allow_guests BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_guests_per_rsvp INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS check_in_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_code TEXT UNIQUE;

-- Generate unique event codes for existing events
UPDATE events SET event_code = UPPER(SUBSTRING(MD5(id::text || NOW()::text) FROM 1 FOR 8)) 
WHERE event_code IS NULL;

-- ============================================
-- EVENT RSVPS TABLE
-- ============================================
CREATE TYPE rsvp_status AS ENUM ('going', 'maybe', 'not_going', 'waitlist');

CREATE TABLE event_rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status rsvp_status NOT NULL DEFAULT 'going',
    guest_count INTEGER DEFAULT 0,
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

-- RSVP policies
CREATE POLICY "Users can view RSVPs for public events" ON event_rsvps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = event_rsvps.event_id 
            AND e.is_public = true
        )
        OR user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM events e
            JOIN society_members sm ON sm.society_id = e.society_id
            WHERE e.id = event_rsvps.event_id
            AND sm.user_id = auth.uid()
            AND sm.role IN ('admin', 'moderator')
            AND sm.status = 'approved'
        )
    );

CREATE POLICY "Authenticated users can RSVP to events" ON event_rsvps
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM events e WHERE e.id = event_id AND e.is_public = true
        )
    );

CREATE POLICY "Users can update their own RSVP" ON event_rsvps
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own RSVP" ON event_rsvps
    FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- EVENT CHECK-INS TABLE
-- ============================================
CREATE TABLE event_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    rsvp_id UUID REFERENCES event_rsvps(id) ON DELETE SET NULL,
    checked_in_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    check_in_method TEXT DEFAULT 'qr', -- 'qr', 'manual', 'self'
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    guest_count INTEGER DEFAULT 0,
    notes TEXT,
    UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE event_checkins ENABLE ROW LEVEL SECURITY;

-- Check-in policies
CREATE POLICY "Society admins can view all check-ins" ON event_checkins
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM events e
            JOIN society_members sm ON sm.society_id = e.society_id
            WHERE e.id = event_checkins.event_id
            AND sm.user_id = auth.uid()
            AND sm.role IN ('admin', 'moderator')
            AND sm.status = 'approved'
        )
    );

CREATE POLICY "Society admins can create check-ins" ON event_checkins
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM events e
            JOIN society_members sm ON sm.society_id = e.society_id
            WHERE e.id = event_id
            AND sm.user_id = auth.uid()
            AND sm.role IN ('admin', 'moderator')
            AND sm.status = 'approved'
        )
    );

-- ============================================
-- EVENT REMINDERS TABLE
-- ============================================
CREATE TABLE event_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reminder_type TEXT DEFAULT '24h', -- '24h', '1h', 'custom'
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id, reminder_type)
);

-- Enable RLS
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;

-- Reminder policies
CREATE POLICY "Users can view their own reminders" ON event_reminders
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own reminders" ON event_reminders
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own reminders" ON event_reminders
    FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX idx_event_rsvps_event ON event_rsvps(event_id);
CREATE INDEX idx_event_rsvps_user ON event_rsvps(user_id);
CREATE INDEX idx_event_rsvps_status ON event_rsvps(event_id, status);
CREATE INDEX idx_event_checkins_event ON event_checkins(event_id);
CREATE INDEX idx_event_checkins_user ON event_checkins(user_id);
CREATE INDEX idx_event_reminders_remind_at ON event_reminders(remind_at) WHERE sent = FALSE;
CREATE INDEX idx_events_code ON events(event_code);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate event code on insert
CREATE OR REPLACE FUNCTION generate_event_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.event_code IS NULL THEN
        NEW.event_code := UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_event_code
    BEFORE INSERT ON events
    FOR EACH ROW EXECUTE FUNCTION generate_event_code();

-- Function to get RSVP counts
CREATE OR REPLACE FUNCTION get_event_rsvp_counts(p_event_id UUID)
RETURNS TABLE(going BIGINT, maybe BIGINT, waitlist BIGINT, total_guests BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE status = 'going') as going,
        COUNT(*) FILTER (WHERE status = 'maybe') as maybe,
        COUNT(*) FILTER (WHERE status = 'waitlist') as waitlist,
        COALESCE(SUM(guest_count) FILTER (WHERE status = 'going'), 0) as total_guests
    FROM event_rsvps
    WHERE event_id = p_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if event is at capacity
CREATE OR REPLACE FUNCTION is_event_at_capacity(p_event_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_capacity INTEGER;
    v_current_count BIGINT;
BEGIN
    SELECT capacity INTO v_capacity FROM events WHERE id = p_event_id;
    
    IF v_capacity IS NULL THEN
        RETURN FALSE; -- No capacity limit
    END IF;
    
    SELECT COUNT(*) + COALESCE(SUM(guest_count), 0)
    INTO v_current_count
    FROM event_rsvps 
    WHERE event_id = p_event_id AND status = 'going';
    
    RETURN v_current_count >= v_capacity;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_event_rsvps_updated_at BEFORE UPDATE ON event_rsvps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE REALTIME for RSVPs
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE event_rsvps;
ALTER PUBLICATION supabase_realtime ADD TABLE event_checkins;
