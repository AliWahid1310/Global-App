-- Add DELETE policy for events
-- Allows event creators and society admins to delete events

CREATE POLICY "Event creators and admins can delete events" ON events
    FOR DELETE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM society_members 
            WHERE society_id = events.society_id 
            AND user_id = auth.uid() 
            AND role = 'admin'
            AND status = 'approved'
        )
    );
