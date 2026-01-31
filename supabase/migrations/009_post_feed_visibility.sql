-- Add show_in_feed column to posts table
-- When true, the post will appear in the university-wide feed
-- When false, it only appears on the society page

ALTER TABLE posts ADD COLUMN IF NOT EXISTS show_in_feed BOOLEAN DEFAULT TRUE;

-- Update existing posts to show in feed by default
UPDATE posts SET show_in_feed = TRUE WHERE show_in_feed IS NULL;
