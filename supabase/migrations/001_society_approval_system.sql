-- ============================================
-- SOCIETY APPROVAL SYSTEM MIGRATION
-- ============================================
-- This migration adds society request/approval functionality
-- using existing role systems (profiles.is_admin, society_members.role)

-- 1️⃣ ADD STATUS COLUMN TO SOCIETIES TABLE
-- ============================================
ALTER TABLE societies 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Ensure created_by column exists (already in schema, but ensure it's there)
-- ALTER TABLE societies ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Update existing societies to 'approved' status (they were created before this system)
UPDATE societies SET status = 'approved' WHERE status IS NULL;

-- 2️⃣ DROP OLD POLICIES AND CREATE NEW ONES
-- ============================================

-- Drop existing policies (if they exist)
DROP POLICY IF EXISTS "Public societies are viewable by everyone" ON societies;
DROP POLICY IF EXISTS "Admins can create societies" ON societies;
DROP POLICY IF EXISTS "Society admins can update their societies" ON societies;

-- 3️⃣ NEW RLS POLICIES FOR SOCIETIES
-- ============================================

-- SELECT: Only approved societies are publicly visible
-- But creators can see their own pending/rejected societies
-- Platform admins can see all societies
CREATE POLICY "View societies based on status and role" ON societies
    FOR SELECT USING (
        -- Approved societies visible to everyone
        status = 'approved'
        OR
        -- Creators can see their own societies (any status)
        created_by = auth.uid()
        OR
        -- Platform admins can see all societies
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- INSERT: Any logged-in user can create a society
-- Platform admins create with status='approved', normal users with status='pending'
CREATE POLICY "Users can create societies" ON societies
    FOR INSERT WITH CHECK (
        -- Must be logged in
        auth.uid() IS NOT NULL
        AND
        -- created_by must be the current user
        created_by = auth.uid()
        AND
        (
            -- Platform admins can create with any status
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
            OR
            -- Normal users can only create with pending status
            status = 'pending'
        )
    );

-- UPDATE: Society admins can update their society EXCEPT status
-- Platform admins can update anything including status
CREATE POLICY "Society and platform admins can update societies" ON societies
    FOR UPDATE USING (
        -- Platform admins can update any society
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
        OR
        -- Society admins can update their society (but RLS doesn't restrict columns)
        EXISTS (
            SELECT 1 FROM society_members 
            WHERE society_id = societies.id 
            AND user_id = auth.uid() 
            AND role = 'admin'
            AND status = 'approved'
        )
    );

-- DELETE: Only platform admins can delete societies
CREATE POLICY "Platform admins can delete societies" ON societies
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- 4️⃣ CREATE INDEX FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_societies_status ON societies(status);
CREATE INDEX IF NOT EXISTS idx_societies_created_by ON societies(created_by);

-- 5️⃣ HELPER FUNCTION: Check if user is platform admin
-- ============================================
CREATE OR REPLACE FUNCTION is_platform_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6️⃣ HELPER FUNCTION: Get user's role in a society
-- ============================================
CREATE OR REPLACE FUNCTION get_society_role(user_id UUID, society_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM society_members
    WHERE society_members.user_id = get_society_role.user_id
    AND society_members.society_id = get_society_role.society_id
    AND society_members.status = 'approved';
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
