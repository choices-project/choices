-- Migration: Setup RLS policies for representative data
-- This migration enables public read access to representative data tables

-- Enable RLS on representative tables if not already enabled
ALTER TABLE representatives_core ENABLE ROW LEVEL SECURITY;
ALTER TABLE representative_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE representative_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE representative_social_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE representative_activity ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to representatives_core" ON representatives_core;
DROP POLICY IF EXISTS "Allow public read access to representative_contacts" ON representative_contacts;
DROP POLICY IF EXISTS "Allow public read access to representative_photos" ON representative_photos;
DROP POLICY IF EXISTS "Allow public read access to representative_social_media" ON representative_social_media;
DROP POLICY IF EXISTS "Allow public read access to representative_activity" ON representative_activity;

-- Create policies for public read access
CREATE POLICY "Allow public read access to representatives_core" 
ON representatives_core 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public read access to representative_contacts" 
ON representative_contacts 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public read access to representative_photos" 
ON representative_photos 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public read access to representative_social_media" 
ON representative_social_media 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public read access to representative_activity" 
ON representative_activity 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Grant necessary permissions
GRANT SELECT ON representatives_core TO anon, authenticated;
GRANT SELECT ON representative_contacts TO anon, authenticated;
GRANT SELECT ON representative_photos TO anon, authenticated;
GRANT SELECT ON representative_social_media TO anon, authenticated;
GRANT SELECT ON representative_activity TO anon, authenticated;

-- Also ensure polls and user_profiles have proper policies for the polls API
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to polls" ON polls;
DROP POLICY IF EXISTS "Allow public read access to user_profiles" ON user_profiles;

CREATE POLICY "Allow public read access to polls" 
ON polls 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public read access to user_profiles" 
ON user_profiles 
FOR SELECT 
TO anon, authenticated 
USING (true);

GRANT SELECT ON polls TO anon, authenticated;
GRANT SELECT ON user_profiles TO anon, authenticated;
