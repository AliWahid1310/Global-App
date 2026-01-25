-- Add venue field to events table for specific location within university
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue text;

-- Add comment for clarity
COMMENT ON COLUMN events.venue IS 'Specific venue within the location (e.g., Main Auditorium, Hall 1)';
