-- Add this to schema.sql for development only
CREATE POLICY bypass_policy_tasks ON tasks FOR SELECT USING (true);
