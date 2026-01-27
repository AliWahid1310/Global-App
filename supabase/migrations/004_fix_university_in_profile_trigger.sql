-- ============================================
-- FIX: Include university field in profile creation trigger
-- ============================================
-- This migration updates the handle_new_user function to also save
-- the university field from registration metadata to the profile.

-- Update the function to include university
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, university)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'university'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Update existing users who have university in their metadata but not in profile
-- This backfills university for users who registered before this fix
UPDATE profiles p
SET university = (
    SELECT raw_user_meta_data->>'university' 
    FROM auth.users u 
    WHERE u.id = p.id
)
WHERE p.university IS NULL 
AND EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = p.id 
    AND u.raw_user_meta_data->>'university' IS NOT NULL
    AND u.raw_user_meta_data->>'university' != ''
);
