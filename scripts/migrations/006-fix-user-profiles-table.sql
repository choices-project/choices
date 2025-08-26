-- Migration 006: Fix user_profiles table structure
-- Add missing columns for registration functionality
-- Created: 2025-08-26
-- Status: Ready for deployment

-- Step 1: Add missing columns to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS auth_methods JSONB;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Add unique constraint on username
ALTER TABLE user_profiles ADD CONSTRAINT IF NOT EXISTS user_profiles_username_unique UNIQUE (username);

-- Step 3: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles (username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles (email);

-- Step 4: Update RLS policies to include new columns
DROP POLICY IF EXISTS user_profiles_read_own ON user_profiles;
CREATE POLICY user_profiles_read_own ON user_profiles
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS user_profiles_write_own ON user_profiles;
CREATE POLICY user_profiles_write_own ON user_profiles
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- Step 5: Enable RLS if not already enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;
