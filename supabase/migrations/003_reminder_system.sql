-- Reminder Processing Function
-- This function is called by a cron job to process pending reminders
-- You can set up a cron job in Supabase Dashboard -> Database -> Extensions -> pg_cron

-- Function to process and send reminders
CREATE OR REPLACE FUNCTION process_event_reminders()
RETURNS INTEGER AS $$
DECLARE
    reminder_record RECORD;
    processed_count INTEGER := 0;
BEGIN
    -- Find all reminders that are due but not yet sent
    FOR reminder_record IN 
        SELECT 
            r.id,
            r.event_id,
            r.user_id,
            r.reminder_type,
            e.title as event_title,
            e.start_time as event_start,
            e.location as event_location,
            p.email as user_email,
            p.full_name as user_name
        FROM event_reminders r
        JOIN events e ON e.id = r.event_id
        JOIN profiles p ON p.id = r.user_id
        WHERE r.sent = FALSE
        AND r.remind_at <= NOW()
        AND e.start_time > NOW()  -- Only for future events
    LOOP
        -- Mark as sent (actual email sending would be done via Edge Function or external service)
        UPDATE event_reminders
        SET sent = TRUE, sent_at = NOW()
        WHERE id = reminder_record.id;
        
        -- You can insert into a notifications queue table here
        -- or trigger an external webhook/email service
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- Example cron job setup (run every 5 minutes)
-- SELECT cron.schedule('process-reminders', '*/5 * * * *', 'SELECT process_event_reminders()');

-- ============================================
-- NOTIFICATION QUEUE TABLE (for async processing)
-- ============================================
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'event_reminder', 'rsvp_confirmation', 'waitlist_promotion'
    title TEXT NOT NULL,
    body TEXT,
    data JSONB,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Only system can insert/update
CREATE POLICY "Users can view their own notifications" ON notification_queue
    FOR SELECT USING (user_id = auth.uid());

-- Index for processing
CREATE INDEX idx_notification_queue_pending ON notification_queue(status, created_at) 
WHERE status = 'pending';

-- Function to queue event reminder notification
CREATE OR REPLACE FUNCTION queue_event_reminder(
    p_user_id UUID,
    p_event_title TEXT,
    p_event_time TIMESTAMP WITH TIME ZONE,
    p_event_location TEXT,
    p_reminder_type TEXT
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
    time_text TEXT;
BEGIN
    -- Format time text based on reminder type
    IF p_reminder_type = '24h' THEN
        time_text := 'tomorrow';
    ELSIF p_reminder_type = '1h' THEN
        time_text := 'in 1 hour';
    ELSE
        time_text := 'soon';
    END IF;
    
    INSERT INTO notification_queue (user_id, type, title, body, data)
    VALUES (
        p_user_id,
        'event_reminder',
        'Event Reminder: ' || p_event_title,
        'Your event "' || p_event_title || '" starts ' || time_text || '!',
        jsonb_build_object(
            'event_title', p_event_title,
            'event_time', p_event_time,
            'event_location', p_event_location,
            'reminder_type', p_reminder_type
        )
    )
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-queue notification when reminder is processed
CREATE OR REPLACE FUNCTION on_reminder_processed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sent = TRUE AND OLD.sent = FALSE THEN
        PERFORM queue_event_reminder(
            NEW.user_id,
            (SELECT title FROM events WHERE id = NEW.event_id),
            (SELECT start_time FROM events WHERE id = NEW.event_id),
            (SELECT location FROM events WHERE id = NEW.event_id),
            NEW.reminder_type
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reminder_processed
    AFTER UPDATE ON event_reminders
    FOR EACH ROW
    WHEN (NEW.sent = TRUE AND OLD.sent = FALSE)
    EXECUTE FUNCTION on_reminder_processed();
