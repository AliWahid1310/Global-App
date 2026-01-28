-- Founding Society Badge
-- Only platform admins can set this badge

-- Add is_founding column to societies table
ALTER TABLE societies ADD COLUMN IF NOT EXISTS is_founding BOOLEAN DEFAULT FALSE;

-- Update RLS policy to only allow platform admins to update is_founding
-- (The existing update policy already restricts to society admins, 
-- but platform admins need to be able to set this field via direct DB access)
