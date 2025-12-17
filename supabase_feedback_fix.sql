-- Fix RLS permissions for feedback table
-- This allows the service role to query the feedback table for diagnostics
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

-- Option 1: Grant select permission to authenticated service role
-- (Recommended - most secure, allows read-only for diagnostics)
CREATE POLICY "Service role can read all feedback"
ON public.feedback
FOR SELECT
TO service_role
USING (true);

-- Option 2: Allow service role full access (if you need insert/update/delete)
-- Uncomment if you need write access from server-side code:
-- CREATE POLICY "Service role can manage all feedback"
-- ON public.feedback
-- FOR ALL
-- TO service_role
-- USING (true)
-- WITH CHECK (true);

-- Option 3: If you want to temporarily disable RLS for testing
-- (NOT recommended for production, but useful for debugging)
-- Uncomment only if you want to test without RLS:
-- ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;

-- Verify RLS policies exist:
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'feedback';

