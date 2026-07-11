-- Canva Applications table
-- Stores applications for the Canva Student Community

CREATE TABLE canva_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    university_email TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    department TEXT NOT NULL,
    current_semester TEXT NOT NULL,
    campus TEXT NOT NULL,
    volunteered BOOLEAN NOT NULL,
    member_of_org BOOLEAN NOT NULL,
    org_names TEXT,
    used_canva TEXT NOT NULL,
    roles TEXT[] NOT NULL,
    first_preference TEXT,
    experience TEXT NOT NULL,
    linkedin TEXT,
    motivation_why TEXT NOT NULL,
    motivation_skills TEXT NOT NULL,
    motivation_goals TEXT NOT NULL,
    agreement BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE canva_applications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view applications (admins only in UI)" ON canva_applications
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert their application" ON canva_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their application" ON canva_applications
    FOR DELETE USING (auth.uid() = user_id);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE canva_applications;
