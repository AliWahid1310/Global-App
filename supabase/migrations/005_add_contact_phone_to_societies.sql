-- ============================================
-- ADD CONTACT PHONE TO SOCIETIES TABLE
-- ============================================
-- This field stores the creator's phone number for verification purposes

ALTER TABLE societies 
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Add comment for documentation
COMMENT ON COLUMN societies.contact_phone IS 'Contact phone number of the society creator for verification purposes';
