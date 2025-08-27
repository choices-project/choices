-- Migration 009: Fix IA/PO Onboarding Support
-- Add missing onboarding columns to IA/PO user_profiles table
-- Created: 2025-08-27
-- Status: Ready for deployment

-- Step 1: Add onboarding progress tracking to IA/PO user_profiles table
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'welcome',
  ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Step 2: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_ia ON user_profiles (onboarding_completed, onboarding_step);

-- Step 3: Update RLS policies if needed
-- (RLS policies should already be in place for IA/PO system)

