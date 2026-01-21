-- Database Functions for Admin Maintenance Operations
--
-- These PostgreSQL functions need to be created in your Supabase database
-- to enable the refresh-materialized-views and perform-database-maintenance endpoints.
--
-- To install:
-- 1. Open Supabase Dashboard > SQL Editor
-- 2. Run these functions one by one
-- 3. Grant execute permissions to your service role

-- ============================================================================
-- Materialized View Refresh Functions
-- ============================================================================

-- Function to refresh a single materialized view
CREATE OR REPLACE FUNCTION refresh_materialized_view(view_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I', view_name);
END;
$$;

-- Function to refresh all materialized views in public schema
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS TABLE(view_name TEXT, refreshed BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  view_rec RECORD;
BEGIN
  FOR view_rec IN
    SELECT matviewname
    FROM pg_matviews
    WHERE schemaname = 'public'
  LOOP
    BEGIN
      EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I', view_rec.matviewname);
      view_name := view_rec.matviewname;
      refreshed := TRUE;
      error_message := NULL;
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      view_name := view_rec.matviewname;
      refreshed := FALSE;
      error_message := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$;

-- ============================================================================
-- Database Maintenance Functions
-- ============================================================================

-- Function to VACUUM ANALYZE a specific table
CREATE OR REPLACE FUNCTION vacuum_analyze_table(table_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('VACUUM ANALYZE %I', table_name);
END;
$$;

-- Function to analyze the entire database
CREATE OR REPLACE FUNCTION analyze_database()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ANALYZE;
END;
$$;

-- Function to perform comprehensive maintenance on key tables
CREATE OR REPLACE FUNCTION perform_maintenance_on_tables()
RETURNS TABLE(table_name TEXT, operation TEXT, success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_rec RECORD;
  key_tables TEXT[] := ARRAY['polls', 'votes', 'user_profiles', 'analytics_events', 'feedback', 'trending_topics'];
BEGIN
  FOREACH table_rec.table_name IN ARRAY key_tables
  LOOP
    BEGIN
      -- VACUUM ANALYZE
      EXECUTE format('VACUUM ANALYZE %I', table_rec.table_name);
      table_name := table_rec.table_name;
      operation := 'VACUUM ANALYZE';
      success := TRUE;
      error_message := NULL;
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      table_name := table_rec.table_name;
      operation := 'VACUUM ANALYZE';
      success := FALSE;
      error_message := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$;

-- ============================================================================
-- Permissions
-- ============================================================================

-- Grant execute permissions to service role
-- Note: In Supabase, the service role is typically 'service_role' or 'postgres'
-- If you get permission errors, try 'postgres' or 'authenticator' instead
GRANT EXECUTE ON FUNCTION refresh_materialized_view(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION refresh_all_materialized_views() TO service_role;
GRANT EXECUTE ON FUNCTION vacuum_analyze_table(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION analyze_database() TO service_role;
GRANT EXECUTE ON FUNCTION perform_maintenance_on_tables() TO service_role;
