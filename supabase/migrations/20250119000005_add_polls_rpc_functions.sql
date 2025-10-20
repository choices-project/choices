-- Add missing RPC functions for polls service
-- These functions are required for the polls-hashtag integration

-- Function to refresh poll statistics materialized view
CREATE OR REPLACE FUNCTION public.refresh_poll_statistics_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create or refresh materialized view
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.poll_statistics_view;
  EXCEPTION
    WHEN OTHERS THEN
      -- If materialized view doesn't exist, create a simple view
      CREATE OR REPLACE VIEW public.poll_statistics_view AS
      SELECT 
        p.id,
        p.title,
        p.total_votes,
        p.participation,
        p.status,
        p.created_at,
        p.updated_at,
        COUNT(v.id) as vote_count,
        AVG(CASE WHEN v.created_at > NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END) as recent_activity
      FROM public.polls p
      LEFT JOIN public.votes v ON p.id = v.poll_id
      GROUP BY p.id, p.title, p.total_votes, p.participation, p.status, p.created_at, p.updated_at;
  END;
END;
$$;

-- Function to refresh poll analytics materialized view
CREATE OR REPLACE FUNCTION public.refresh_poll_analytics_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create or refresh materialized view
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.poll_analytics_view;
  EXCEPTION
    WHEN OTHERS THEN
      -- If materialized view doesn't exist, create a simple view
      CREATE OR REPLACE VIEW public.poll_analytics_view AS
      SELECT 
        p.id as poll_id,
        p.title,
        p.category,
        p.status,
        p.total_votes,
        p.participation,
        p.created_at,
        COUNT(v.id) as total_votes_count,
        COUNT(DISTINCT v.user_id) as unique_voters,
        AVG(CASE WHEN v.created_at > NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as weekly_activity,
        AVG(CASE WHEN v.created_at > NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END) as daily_activity
      FROM public.polls p
      LEFT JOIN public.votes v ON p.id = v.poll_id
      GROUP BY p.id, p.title, p.category, p.status, p.total_votes, p.participation, p.created_at;
  END;
END;
$$;

-- Function to analyze polls table performance
CREATE OR REPLACE FUNCTION public.analyze_polls_table()
RETURNS TABLE(
  table_name text,
  row_count bigint,
  table_size text,
  index_size text,
  last_analyzed timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'polls'::text as table_name,
    (SELECT COUNT(*) FROM public.polls) as row_count,
    pg_size_pretty(pg_total_relation_size('public.polls')) as table_size,
    pg_size_pretty(pg_indexes_size('public.polls')) as index_size,
    NOW() as last_analyzed;
END;
$$;

-- Function to rebuild poll indexes
CREATE OR REPLACE FUNCTION public.rebuild_poll_indexes()
RETURNS TABLE(
  index_name text,
  status text,
  rebuild_time interval
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_time timestamptz;
  end_time timestamptz;
BEGIN
  start_time := NOW();
  
  -- Rebuild indexes on polls table
  BEGIN
    REINDEX TABLE CONCURRENTLY public.polls;
  EXCEPTION
    WHEN OTHERS THEN
      -- If CONCURRENTLY fails, try without it
      REINDEX TABLE public.polls;
  END;
  
  end_time := NOW();
  
  RETURN QUERY
  SELECT 
    'polls_table'::text as index_name,
    'completed'::text as status,
    end_time - start_time as rebuild_time;
END;
$$;

-- Function to update poll statistics
CREATE OR REPLACE FUNCTION public.update_poll_statistics(poll_id_param text)
RETURNS TABLE(
  poll_id text,
  total_votes bigint,
  participation_rate numeric,
  last_updated timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vote_count bigint;
  participation numeric;
BEGIN
  -- Get vote count for the poll
  SELECT COUNT(*) INTO vote_count
  FROM public.votes 
  WHERE poll_id = poll_id_param;
  
  -- Calculate participation rate
  participation := CASE 
    WHEN (SELECT COUNT(*) FROM public.polls WHERE id = poll_id_param) > 0 
    THEN (vote_count::numeric / NULLIF((SELECT COUNT(*) FROM public.user_profiles), 0)) * 100
    ELSE 0
  END;
  
  -- Update poll with new statistics
  UPDATE public.polls 
  SET 
    total_votes = vote_count,
    participation = participation,
    updated_at = NOW()
  WHERE id = poll_id_param;
  
  RETURN QUERY
  SELECT 
    poll_id_param as poll_id,
    vote_count as total_votes,
    participation as participation_rate,
    NOW() as last_updated;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.refresh_poll_statistics_view() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_poll_analytics_view() TO authenticated;
GRANT EXECUTE ON FUNCTION public.analyze_polls_table() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rebuild_poll_indexes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_poll_statistics(text) TO authenticated;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION public.refresh_poll_statistics_view() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_poll_analytics_view() TO service_role;
GRANT EXECUTE ON FUNCTION public.analyze_polls_table() TO service_role;
GRANT EXECUTE ON FUNCTION public.rebuild_poll_indexes() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_poll_statistics(text) TO service_role;
