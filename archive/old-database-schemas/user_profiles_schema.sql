-- User Profiles Table Schema
-- This table stores user profile information collected during onboarding

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    primary_concerns TEXT[] DEFAULT '{}',
    community_focus TEXT[] DEFAULT '{}',
    participation_style TEXT CHECK (participation_style IN ('observer', 'contributor', 'leader')),
    demographics JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_primary_concerns ON user_profiles USING GIN(primary_concerns);
CREATE INDEX IF NOT EXISTS idx_user_profiles_community_focus ON user_profiles USING GIN(community_focus);

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'Stores user profile information collected during onboarding';
COMMENT ON COLUMN user_profiles.primary_concerns IS 'Array of primary concerns/values selected by user';
COMMENT ON COLUMN user_profiles.community_focus IS 'Array of community focus areas (local, regional, national, global)';
COMMENT ON COLUMN user_profiles.participation_style IS 'How the user prefers to participate (observer, contributor, leader)';
COMMENT ON COLUMN user_profiles.demographics IS 'Optional demographic information as JSONB';
COMMENT ON COLUMN user_profiles.privacy_settings IS 'Privacy preferences as JSONB';
