-- Migration 008: Enhanced Onboarding and Privacy Preferences
-- Add comprehensive onboarding tracking and privacy controls
-- Created: 2025-08-26
-- Status: Ready for deployment

-- Step 1: Add onboarding progress tracking to user_profiles
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'welcome',
  ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'medium' CHECK (privacy_level IN ('low', 'medium', 'high', 'maximum')),
  ADD COLUMN IF NOT EXISTS data_sharing_preferences JSONB DEFAULT '{"analytics": true, "research": false, "contact": false, "marketing": false}',
  ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'friends_only', 'anonymous'));

-- Step 2: Create comprehensive privacy preferences table
CREATE TABLE IF NOT EXISTS user_privacy_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'friends_only', 'anonymous')),
  data_sharing_level TEXT DEFAULT 'analytics_only' CHECK (data_sharing_level IN ('none', 'analytics_only', 'research', 'full')),
  allow_contact BOOLEAN DEFAULT FALSE,
  allow_research BOOLEAN DEFAULT FALSE,
  allow_marketing BOOLEAN DEFAULT FALSE,
  allow_analytics BOOLEAN DEFAULT TRUE,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
  data_retention_preference TEXT DEFAULT '90_days' CHECK (data_retention_preference IN ('30_days', '90_days', '1_year', 'indefinite')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create onboarding progress tracking table
CREATE TABLE IF NOT EXISTS onboarding_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step TEXT DEFAULT 'welcome',
  completed_steps TEXT[] DEFAULT '{}',
  step_data JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_time_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create privacy education tracking table
CREATE TABLE IF NOT EXISTS privacy_education_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  education_type TEXT NOT NULL CHECK (education_type IN ('onboarding', 'reminder', 'update', 'feature')),
  topic TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding ON user_profiles (onboarding_completed, onboarding_step);
CREATE INDEX IF NOT EXISTS idx_user_profiles_privacy ON user_profiles (privacy_level, profile_visibility);
CREATE INDEX IF NOT EXISTS idx_privacy_preferences_user ON user_privacy_preferences (user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user ON onboarding_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_step ON onboarding_progress (current_step);
CREATE INDEX IF NOT EXISTS idx_privacy_education_user ON privacy_education_log (user_id, education_type);

-- Step 6: Add RLS policies for privacy preferences
ALTER TABLE user_privacy_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY privacy_preferences_read_own ON user_privacy_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY privacy_preferences_write_own ON user_privacy_preferences
  FOR ALL USING (user_id = auth.uid());

-- Step 7: Add RLS policies for onboarding progress
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY onboarding_progress_read_own ON onboarding_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY onboarding_progress_write_own ON onboarding_progress
  FOR ALL USING (user_id = auth.uid());

-- Step 8: Add RLS policies for privacy education log
ALTER TABLE privacy_education_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY privacy_education_read_own ON privacy_education_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY privacy_education_write_own ON privacy_education_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Step 9: Create functions for onboarding management
CREATE OR REPLACE FUNCTION start_onboarding(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Initialize onboarding progress
  INSERT INTO onboarding_progress (user_id, current_step, started_at)
  VALUES (p_user_id, 'welcome', NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    current_step = 'welcome',
    started_at = NOW(),
    last_activity_at = NOW();
  
  -- Update user profile
  UPDATE user_profiles 
  SET onboarding_started_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_onboarding_step(p_user_id UUID, p_step TEXT, p_data JSONB DEFAULT '{}')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Update onboarding progress
  UPDATE onboarding_progress 
  SET 
    current_step = p_step,
    completed_steps = CASE 
      WHEN NOT (p_step = ANY(completed_steps)) 
      THEN array_append(completed_steps, p_step)
      ELSE completed_steps
    END,
    step_data = step_data || p_data,
    last_activity_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Update user profile
  UPDATE user_profiles 
  SET onboarding_step = p_step
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION complete_onboarding(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
  v_total_minutes INTEGER;
BEGIN
  -- Get start time and calculate total time
  SELECT started_at INTO v_started_at 
  FROM onboarding_progress 
  WHERE user_id = p_user_id;
  
  v_total_minutes := EXTRACT(EPOCH FROM (NOW() - v_started_at)) / 60;
  
  -- Mark onboarding as completed
  UPDATE onboarding_progress 
  SET 
    current_step = 'complete',
    completed_at = NOW(),
    total_time_minutes = v_total_minutes
  WHERE user_id = p_user_id;
  
  -- Update user profile
  UPDATE user_profiles 
  SET 
    onboarding_completed = TRUE,
    onboarding_completed_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_privacy_preferences(
  p_user_id UUID,
  p_profile_visibility TEXT DEFAULT NULL,
  p_data_sharing_level TEXT DEFAULT NULL,
  p_allow_contact BOOLEAN DEFAULT NULL,
  p_allow_research BOOLEAN DEFAULT NULL,
  p_allow_marketing BOOLEAN DEFAULT NULL,
  p_allow_analytics BOOLEAN DEFAULT NULL,
  p_notification_preferences JSONB DEFAULT NULL,
  p_data_retention_preference TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_privacy_preferences (
    user_id,
    profile_visibility,
    data_sharing_level,
    allow_contact,
    allow_research,
    allow_marketing,
    allow_analytics,
    notification_preferences,
    data_retention_preference
  ) VALUES (
    p_user_id,
    COALESCE(p_profile_visibility, 'public'),
    COALESCE(p_data_sharing_level, 'analytics_only'),
    COALESCE(p_allow_contact, FALSE),
    COALESCE(p_allow_research, FALSE),
    COALESCE(p_allow_marketing, FALSE),
    COALESCE(p_allow_analytics, TRUE),
    COALESCE(p_notification_preferences, '{"email": true, "push": true, "sms": false}'),
    COALESCE(p_data_retention_preference, '90_days')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    profile_visibility = COALESCE(p_profile_visibility, user_privacy_preferences.profile_visibility),
    data_sharing_level = COALESCE(p_data_sharing_level, user_privacy_preferences.data_sharing_level),
    allow_contact = COALESCE(p_allow_contact, user_privacy_preferences.allow_contact),
    allow_research = COALESCE(p_allow_research, user_privacy_preferences.allow_research),
    allow_marketing = COALESCE(p_allow_marketing, user_privacy_preferences.allow_marketing),
    allow_analytics = COALESCE(p_allow_analytics, user_privacy_preferences.allow_analytics),
    notification_preferences = COALESCE(p_notification_preferences, user_privacy_preferences.notification_preferences),
    data_retention_preference = COALESCE(p_data_retention_preference, user_privacy_preferences.data_retention_preference),
    updated_at = NOW();
END;
$$;

-- Step 10: Create triggers for automatic updates
CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_onboarding_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

CREATE OR REPLACE FUNCTION update_privacy_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_privacy_preferences_updated_at
  BEFORE UPDATE ON user_privacy_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_privacy_preferences_updated_at();

-- Step 11: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_privacy_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON onboarding_progress TO authenticated;
GRANT SELECT, INSERT ON privacy_education_log TO authenticated;
GRANT SELECT ON user_privacy_preferences TO anon;
GRANT SELECT ON onboarding_progress TO anon;

-- Step 12: Insert sample privacy education content
INSERT INTO privacy_education_log (user_id, education_type, topic, completed) VALUES
  (gen_random_uuid(), 'onboarding', 'privacy_philosophy', true),
  (gen_random_uuid(), 'onboarding', 'data_controls', true),
  (gen_random_uuid(), 'onboarding', 'platform_functionality', true)
ON CONFLICT DO NOTHING;

-- Step 13: Log migration
INSERT INTO migration_log (migration_name, applied_at, status, description)
VALUES (
  '008-enhanced-onboarding',
  NOW(),
  'completed',
  'Enhanced onboarding system with privacy preferences and progress tracking'
);

