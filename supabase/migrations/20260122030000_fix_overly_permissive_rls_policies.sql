-- migrate:up
-- Fix Overly Permissive RLS Policies
--
-- This migration addresses security issues flagged in Supabase dashboard:
-- 1. Replace "Authenticated full access" policies with properly scoped policies
-- 2. Ensure analytics tables have appropriate restrictions
-- 3. Fix bot_detection_logs and cache_performance_log policies
-- 4. Review and fix voter_registration_resources_view security
--
-- Security Principle: Least privilege - users should only access what they need

-- ============================================================================
-- 1. Fix analytics_events table policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'analytics_events') THEN
    -- Drop overly permissive "Authenticated full access" policy if it exists
    DROP POLICY IF EXISTS "Authenticated full access" ON public.analytics_events;
    DROP POLICY IF EXISTS "Authenticated full acce" ON public.analytics_events; -- Handle truncated name

    -- Create properly scoped policies
    -- Service role: Full access (for agents and system operations)
    DROP POLICY IF EXISTS analytics_events_service_full ON public.analytics_events;
    CREATE POLICY analytics_events_service_full ON public.analytics_events
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    -- Authenticated users: Can only insert their own events
    DROP POLICY IF EXISTS analytics_events_insert_own ON public.analytics_events;
    CREATE POLICY analytics_events_insert_own ON public.analytics_events
      FOR INSERT
      TO authenticated
      WITH CHECK (
        -- Users can only insert events for themselves
        (user_id IS NULL OR user_id = auth.uid())
        AND
        -- Prevent insertion of sensitive fields by regular users
        (event_type NOT IN ('admin_action', 'system_event', 'security_event') OR false)
      );

    -- Authenticated users: Can only read their own events
    DROP POLICY IF EXISTS analytics_events_select_own ON public.analytics_events;
    CREATE POLICY analytics_events_select_own ON public.analytics_events
      FOR SELECT
      TO authenticated
      USING (
        -- Users can only read their own events
        user_id = auth.uid()
        OR
        -- Admins can read all events
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_profiles.user_id = auth.uid()
          AND user_profiles.is_admin = true
        )
      );

    -- Ensure RLS is enabled
    ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

    -- Grant appropriate permissions
    GRANT ALL ON public.analytics_events TO service_role;
    GRANT INSERT, SELECT ON public.analytics_events TO authenticated;
  END IF;
END $$;

-- ============================================================================
-- 2. Fix analytics_event_data table policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'analytics_event_data') THEN
    -- Drop overly permissive "Authenticated full access" policy if it exists
    DROP POLICY IF EXISTS "Authenticated full access" ON public.analytics_event_data;
    DROP POLICY IF EXISTS "Authenticated full acce" ON public.analytics_event_data; -- Handle truncated name

    -- Service role: Full access (for agents and system operations)
    DROP POLICY IF EXISTS analytics_event_data_service_full ON public.analytics_event_data;
    CREATE POLICY analytics_event_data_service_full ON public.analytics_event_data
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    -- Authenticated users: Can only insert data for their own events
    DROP POLICY IF EXISTS analytics_event_data_insert_own ON public.analytics_event_data;
    CREATE POLICY analytics_event_data_insert_own ON public.analytics_event_data
      FOR INSERT
      TO authenticated
      WITH CHECK (
        -- Verify the event belongs to the user
        EXISTS (
          SELECT 1 FROM public.analytics_events
          WHERE analytics_events.id = analytics_event_data.event_id
          AND analytics_events.user_id = auth.uid()
        )
      );

    -- Authenticated users: Can only read data for their own events
    DROP POLICY IF EXISTS analytics_event_data_select_own ON public.analytics_event_data;
    CREATE POLICY analytics_event_data_select_own ON public.analytics_event_data
      FOR SELECT
      TO authenticated
      USING (
        -- Users can read data for their own events
        EXISTS (
          SELECT 1 FROM public.analytics_events
          WHERE analytics_events.id = analytics_event_data.event_id
          AND analytics_events.user_id = auth.uid()
        )
        OR
        -- Admins can read all event data
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_profiles.user_id = auth.uid()
          AND user_profiles.is_admin = true
        )
      );

    -- Ensure RLS is enabled
    ALTER TABLE public.analytics_event_data ENABLE ROW LEVEL SECURITY;

    -- Grant appropriate permissions
    GRANT ALL ON public.analytics_event_data TO service_role;
    GRANT INSERT, SELECT ON public.analytics_event_data TO authenticated;
  END IF;
END $$;

-- ============================================================================
-- 3. Fix analytics_events_insert policy (if it exists separately)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'analytics_events') THEN
    -- Drop the separate insert policy if it's too permissive
    -- Keep it only if it's properly scoped (we'll recreate it above if needed)
    DROP POLICY IF EXISTS analytics_events_insert ON public.analytics_events;
  END IF;
END $$;

-- ============================================================================
-- 4. Fix bot_detection_logs table policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bot_detection_logs') THEN
    -- Drop overly permissive "Authenticated full access" policy if it exists
    DROP POLICY IF EXISTS "Authenticated full access" ON public.bot_detection_logs;
    DROP POLICY IF EXISTS "Authenticated full acce" ON public.bot_detection_logs; -- Handle truncated name

    -- Service role: Full access (for agents and system operations)
    DROP POLICY IF EXISTS bot_detection_logs_service_full ON public.bot_detection_logs;
    CREATE POLICY bot_detection_logs_service_full ON public.bot_detection_logs
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    -- Authenticated users: No direct access (this is system data)
    -- Only admins can read bot detection logs
    DROP POLICY IF EXISTS bot_detection_logs_admin_read ON public.bot_detection_logs;
    CREATE POLICY bot_detection_logs_admin_read ON public.bot_detection_logs
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_profiles.user_id = auth.uid()
          AND user_profiles.is_admin = true
        )
      );

    -- Ensure RLS is enabled
    ALTER TABLE public.bot_detection_logs ENABLE ROW LEVEL SECURITY;

    -- Grant appropriate permissions
    GRANT ALL ON public.bot_detection_logs TO service_role;
    GRANT SELECT ON public.bot_detection_logs TO authenticated; -- Only for admin policy
  END IF;
END $$;

-- ============================================================================
-- 5. Fix cache_performance_log table policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cache_performance_log') THEN
    -- Drop overly permissive "System can insert" policy if it exists
    DROP POLICY IF EXISTS "System can insert" ON public.cache_performance_log;

    -- Service role: Full access (for system operations)
    DROP POLICY IF EXISTS cache_performance_log_service_full ON public.cache_performance_log;
    CREATE POLICY cache_performance_log_service_full ON public.cache_performance_log
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    -- Authenticated users: No direct access (this is system data)
    -- Only admins can read cache performance logs
    DROP POLICY IF EXISTS cache_performance_log_admin_read ON public.cache_performance_log;
    CREATE POLICY cache_performance_log_admin_read ON public.cache_performance_log
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_profiles.user_id = auth.uid()
          AND user_profiles.is_admin = true
        )
      );

    -- Ensure RLS is enabled
    ALTER TABLE public.cache_performance_log ENABLE ROW LEVEL SECURITY;

    -- Grant appropriate permissions
    GRANT ALL ON public.cache_performance_log TO service_role;
    GRANT SELECT ON public.cache_performance_log TO authenticated; -- Only for admin policy
  END IF;
END $$;

-- ============================================================================
-- 6. Fix voter_registration_resources_view security
-- ============================================================================
DO $$
BEGIN
  -- Check if the view exists
  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public'
    AND table_name = 'voter_registration_resources_view'
  ) THEN
    -- The view should be SECURITY DEFINER or have proper RLS on underlying table
    -- Grant SELECT to appropriate roles
    GRANT SELECT ON public.voter_registration_resources_view TO authenticated, anon, service_role;

    -- Note: If the view is SECURITY DEFINER, ensure the function owner is appropriate
    -- This is typically handled in the view creation migration
  END IF;
END $$;

-- ============================================================================
-- 7. Summary: Verify policies are properly scoped
-- ============================================================================
-- Run this query to verify the fixes:
-- SELECT
--   tablename,
--   policyname,
--   roles,
--   cmd as command,
--   qual as using_expression
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('analytics_events', 'analytics_event_data', 'bot_detection_logs', 'cache_performance_log')
--   AND 'authenticated' = ANY(roles)
-- ORDER BY tablename, policyname;

-- migrate:down
-- Revert to previous policies (if needed for rollback)
-- Note: This is a destructive migration - be careful with rollback

-- Drop new policies
DROP POLICY IF EXISTS analytics_events_service_full ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_insert_own ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_select_own ON public.analytics_events;

DROP POLICY IF EXISTS analytics_event_data_service_full ON public.analytics_event_data;
DROP POLICY IF EXISTS analytics_event_data_insert_own ON public.analytics_event_data;
DROP POLICY IF EXISTS analytics_event_data_select_own ON public.analytics_event_data;

DROP POLICY IF EXISTS bot_detection_logs_service_full ON public.bot_detection_logs;
DROP POLICY IF EXISTS bot_detection_logs_admin_read ON public.bot_detection_logs;

DROP POLICY IF EXISTS cache_performance_log_service_full ON public.cache_performance_log;
DROP POLICY IF EXISTS cache_performance_log_admin_read ON public.cache_performance_log;
