-- migrate:up
-- Agent Access Policies and Audit Table
--
-- This migration:
-- 1. Creates the agent_operations audit table
-- 2. Adds explicit service_role policies for agent-accessible tables
-- 3. Ensures proper RLS configuration for agent operations
--
-- Note: Service role bypasses RLS by default, but explicit policies
-- document intent and provide fallback if RLS enforcement changes.

-- ============================================================================
-- 1. Create agent_operations audit table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  agent_version TEXT,
  operation_type TEXT NOT NULL,
  table_name TEXT,
  function_name TEXT,
  user_context UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_metadata JSONB DEFAULT '{}'::jsonb,
  result_status TEXT NOT NULL,
  error_message TEXT,
  row_count INTEGER,
  duration INTEGER, -- milliseconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_agent_operations_agent_id ON public.agent_operations(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_operations_created_at ON public.agent_operations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_operations_user_context ON public.agent_operations(user_context) WHERE user_context IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_operations_table_name ON public.agent_operations(table_name) WHERE table_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_operations_result_status ON public.agent_operations(result_status);

-- Enable RLS on agent_operations
ALTER TABLE public.agent_operations ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (for audit logging)
CREATE POLICY agent_operations_service_full ON public.agent_operations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated admins can read agent operations
CREATE POLICY agent_operations_admin_read ON public.agent_operations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Grant permissions
GRANT ALL ON public.agent_operations TO service_role;
GRANT SELECT ON public.agent_operations TO authenticated;

-- ============================================================================
-- 2. Service role policies for agent-accessible tables
-- ============================================================================

-- Polls table: Read access for analysis
-- Note: Service role should already have access, but explicit policy documents intent
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'polls') THEN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS polls_service_full ON public.polls;

    -- Create service role policy
    CREATE POLICY polls_service_full ON public.polls
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    -- Ensure service role has permissions
    GRANT ALL ON public.polls TO service_role;
  END IF;
END $$;

-- Votes table: Read access for integrity analysis
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'votes') THEN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS votes_service_full ON public.votes;

    -- Create service role policy
    CREATE POLICY votes_service_full ON public.votes
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    -- Ensure service role has permissions
    GRANT ALL ON public.votes TO service_role;
  END IF;
END $$;

-- Analytics events: Agent write access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'analytics_events') THEN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS analytics_events_service_full ON public.analytics_events;

    -- Create service role policy
    CREATE POLICY analytics_events_service_full ON public.analytics_events
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    -- Ensure service role has permissions
    GRANT ALL ON public.analytics_events TO service_role;
  END IF;
END $$;

-- Analytics event data: Agent write access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'analytics_event_data') THEN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS analytics_event_data_service_full ON public.analytics_event_data;

    -- Create service role policy
    CREATE POLICY analytics_event_data_service_full ON public.analytics_event_data
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    -- Ensure service role has permissions
    GRANT ALL ON public.analytics_event_data TO service_role;
  END IF;
END $$;

-- Bot detection logs: Agent write access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bot_detection_logs') THEN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS bot_detection_logs_service_full ON public.bot_detection_logs;

    -- Create service role policy
    CREATE POLICY bot_detection_logs_service_full ON public.bot_detection_logs
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    -- Ensure service role has permissions
    GRANT ALL ON public.bot_detection_logs TO service_role;
  END IF;
END $$;

-- User profiles: Limited read for context (no PII exposure)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS user_profiles_service_read ON public.user_profiles;

    -- Create service role read-only policy (agents should not modify user profiles)
    CREATE POLICY user_profiles_service_read ON public.user_profiles
      FOR SELECT
      TO service_role
      USING (true);

    -- Ensure service role has SELECT permission
    GRANT SELECT ON public.user_profiles TO service_role;
  END IF;
END $$;

-- Poll options: Read access for analysis
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'poll_options') THEN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS poll_options_service_full ON public.poll_options;

    -- Create service role policy
    CREATE POLICY poll_options_service_full ON public.poll_options
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    -- Ensure service role has permissions
    GRANT ALL ON public.poll_options TO service_role;
  END IF;
END $$;

-- ============================================================================
-- 3. Verify existing service role policies are in place
-- ============================================================================

-- poll_rankings (should already exist from previous migration)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'poll_rankings') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = 'poll_rankings'
      AND policyname = 'poll_rankings_service_full'
    ) THEN
      CREATE POLICY poll_rankings_service_full ON public.poll_rankings
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);

      GRANT ALL ON public.poll_rankings TO service_role;
    END IF;
  END IF;
END $$;

-- vote_integrity_scores (should already exist from previous migration)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vote_integrity_scores') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = 'vote_integrity_scores'
      AND policyname = 'vote_integrity_scores_service_full'
    ) THEN
      CREATE POLICY vote_integrity_scores_service_full ON public.vote_integrity_scores
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);

      GRANT ALL ON public.vote_integrity_scores TO service_role;
    END IF;
  END IF;
END $$;

-- integrity_signals (should already exist from previous migration)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'integrity_signals') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = 'integrity_signals'
      AND policyname = 'integrity_signals_service_full'
    ) THEN
      CREATE POLICY integrity_signals_service_full ON public.integrity_signals
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);

      GRANT ALL ON public.integrity_signals TO service_role;
    END IF;
  END IF;
END $$;

-- migrate:down
-- Drop agent policies and audit table

-- Drop policies
DROP POLICY IF EXISTS agent_operations_admin_read ON public.agent_operations;
DROP POLICY IF EXISTS agent_operations_service_full ON public.agent_operations;
DROP POLICY IF EXISTS polls_service_full ON public.polls;
DROP POLICY IF EXISTS votes_service_full ON public.votes;
DROP POLICY IF EXISTS analytics_events_service_full ON public.analytics_events;
DROP POLICY IF EXISTS analytics_event_data_service_full ON public.analytics_event_data;
DROP POLICY IF EXISTS bot_detection_logs_service_full ON public.bot_detection_logs;
DROP POLICY IF EXISTS user_profiles_service_read ON public.user_profiles;
DROP POLICY IF EXISTS poll_options_service_full ON public.poll_options;

-- Drop indexes
DROP INDEX IF EXISTS idx_agent_operations_agent_id;
DROP INDEX IF EXISTS idx_agent_operations_created_at;
DROP INDEX IF EXISTS idx_agent_operations_user_context;
DROP INDEX IF EXISTS idx_agent_operations_table_name;
DROP INDEX IF EXISTS idx_agent_operations_result_status;

-- Drop table
DROP TABLE IF EXISTS public.agent_operations;
