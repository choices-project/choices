-- ============================================================================
-- ADD IS_ADMIN COLUMN TO USER_PROFILES
-- ============================================================================
-- This migration adds the is_admin column to the user_profiles table
-- to support admin authentication in the application.
-- 
-- Created: 2025-01-17
-- ============================================================================

-- Add is_admin column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for is_admin column for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);

-- Update the is_admin function to use the column
CREATE OR REPLACE FUNCTION public.is_admin(p_user uuid default auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT up.is_admin FROM public.user_profiles up WHERE up.user_id = p_user),
    false
  );
$$;
