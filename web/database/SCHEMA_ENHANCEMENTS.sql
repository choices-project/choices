-- =====================================================
-- Database Schema Enhancements for Enhanced Profile System
-- =====================================================
-- Created: January 4, 2025
-- Purpose: Add missing fields for enhanced profile functionality
-- Status: READY TO EXECUTE
-- =====================================================

-- =====================================================
-- PHASE 1: CRITICAL SCHEMA ALIGNMENT (REQUIRED)
-- =====================================================
-- These fields are required for the enhanced profile system to work properly

-- Add missing core profile fields
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "profile_visibility": "public",
  "show_email": false,
  "show_activity": true,
  "allow_messages": true,
  "share_demographics": false,
  "allow_analytics": true
}';

-- Add performance indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_trust_tier ON user_profiles(trust_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

-- =====================================================
-- PHASE 2: OPTIONAL EXTENDED FEATURES (FUTURE)
-- =====================================================
-- These fields can be added later for enhanced functionality

-- Add extended profile fields for enhanced functionality
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS primary_concerns TEXT[],
ADD COLUMN IF NOT EXISTS community_focus TEXT[],
ADD COLUMN IF NOT EXISTS participation_style TEXT DEFAULT 'observer',
ADD COLUMN IF NOT EXISTS demographics JSONB DEFAULT '{}';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these after executing the schema changes to verify success

-- Check that all new columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('display_name', 'preferences', 'privacy_settings', 'primary_concerns', 'community_focus', 'participation_style', 'demographics')
ORDER BY column_name;

-- Check that indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'user_profiles' 
AND indexname LIKE 'idx_user_profiles_%'
ORDER BY indexname;

-- =====================================================
-- ROLLBACK QUERIES (IF NEEDED)
-- =====================================================
-- Uncomment these if you need to rollback the changes

-- DROP INDEX IF EXISTS idx_user_profiles_display_name;
-- DROP INDEX IF EXISTS idx_user_profiles_trust_tier;
-- DROP INDEX IF EXISTS idx_user_profiles_is_active;

-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS display_name;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS preferences;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS privacy_settings;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS primary_concerns;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS community_focus;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS participation_style;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS demographics;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. All changes use ADD COLUMN IF NOT EXISTS for safety
-- 2. Default values are provided for all new columns
-- 3. No data migration is required
-- 4. Existing functionality will not be affected
-- 5. Changes are backward compatible
-- 6. Can be executed incrementally (Phase 1 first, Phase 2 later)
