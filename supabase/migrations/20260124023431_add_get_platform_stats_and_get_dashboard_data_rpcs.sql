-- ============================================================================
-- get_platform_stats: SECURITY DEFINER RPC for platform-wide aggregates
-- get_dashboard_data: SECURITY DEFINER RPC for user dashboard (user_id)
-- Bypass RLS so dashboard can use these without permissive SELECT policies.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS TABLE (
  total_users bigint,
  total_polls bigint,
  total_votes bigint,
  active_polls bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
STABLE
AS $$
  SELECT
    (SELECT count(*) FROM public.user_profiles)::bigint,
    (SELECT count(*) FROM public.polls)::bigint,
    (SELECT count(*) FROM public.votes)::bigint,
    (SELECT count(*) FROM public.polls WHERE status = 'active')::bigint;
$$;

COMMENT ON FUNCTION public.get_platform_stats() IS
  'Platform-wide aggregates. SECURITY DEFINER for dashboard; bypasses RLS.';

CREATE OR REPLACE FUNCTION public.get_dashboard_data(p_user_id uuid)
RETURNS TABLE (
  user_email text,
  user_name text,
  total_votes bigint,
  total_polls_created bigint,
  active_polls bigint,
  total_votes_on_user_polls bigint,
  participation_score int,
  votes_last_30_days bigint,
  polls_created_last_30_days bigint,
  show_elected_officials boolean,
  show_quick_actions boolean,
  show_recent_activity boolean,
  show_engagement_score boolean,
  platform_total_polls bigint,
  platform_total_votes bigint,
  platform_active_polls bigint,
  platform_total_users bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
STABLE
AS $$
DECLARE
  v_email text;
  v_display_name text;
  v_username text;
  v_layout jsonb;
  v_total_votes bigint;
  v_total_polls bigint;
  v_active_polls bigint;
  v_votes_on_user_polls bigint;
  v_votes_30 bigint;
  v_polls_30 bigint;
  v_platform_users bigint;
  v_platform_polls bigint;
  v_platform_votes bigint;
  v_platform_active bigint;
  v_score int;
  v_show_officials boolean := true;
  v_show_quick boolean := true;
  v_show_recent boolean := true;
  v_show_engagement boolean := true;
BEGIN
  SELECT up.email, up.display_name, up.username, up.dashboard_layout
    INTO v_email, v_display_name, v_username, v_layout
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id
  LIMIT 1;

  user_name := coalesce(trim(nullif(v_display_name, '')), trim(nullif(v_username, '')), 'User');

  IF v_layout IS NOT NULL THEN
    v_show_officials := coalesce((v_layout->>'show_elected_officials')::boolean, true);
    v_show_quick    := coalesce((v_layout->>'show_quick_actions')::boolean, true);
    v_show_recent   := coalesce((v_layout->>'show_recent_activity')::boolean, true);
    v_show_engagement := coalesce((v_layout->>'show_engagement_score')::boolean, true);
  END IF;

  SELECT count(*) INTO v_total_votes FROM public.votes WHERE user_id = p_user_id;
  SELECT count(*) INTO v_total_polls FROM public.polls WHERE created_by = p_user_id;
  SELECT count(*) INTO v_active_polls FROM public.polls WHERE created_by = p_user_id AND status = 'active';
  SELECT count(*) INTO v_votes_30
    FROM public.votes WHERE user_id = p_user_id AND created_at >= (now() - interval '30 days');
  SELECT count(*) INTO v_polls_30
    FROM public.polls WHERE created_by = p_user_id AND created_at >= (now() - interval '30 days');

  SELECT count(*) INTO v_votes_on_user_polls
    FROM public.votes v
    JOIN public.polls p ON p.id = v.poll_id AND p.created_by = p_user_id;

  v_score := least(100, (coalesce(v_total_votes, 0) + coalesce(v_total_polls, 0)) * 2);

  SELECT count(*) INTO v_platform_users FROM public.user_profiles;
  SELECT count(*) INTO v_platform_polls FROM public.polls;
  SELECT count(*) INTO v_platform_votes FROM public.votes;
  SELECT count(*) INTO v_platform_active FROM public.polls WHERE status = 'active';

  user_email := coalesce(v_email, '');
  total_votes := coalesce(v_total_votes, 0);
  total_polls_created := coalesce(v_total_polls, 0);
  active_polls := coalesce(v_active_polls, 0);
  total_votes_on_user_polls := coalesce(v_votes_on_user_polls, 0);
  participation_score := v_score;
  votes_last_30_days := coalesce(v_votes_30, 0);
  polls_created_last_30_days := coalesce(v_polls_30, 0);
  show_elected_officials := v_show_officials;
  show_quick_actions := v_show_quick;
  show_recent_activity := v_show_recent;
  show_engagement_score := v_show_engagement;
  platform_total_polls := coalesce(v_platform_polls, 0);
  platform_total_votes := coalesce(v_platform_votes, 0);
  platform_active_polls := coalesce(v_platform_active, 0);
  platform_total_users := coalesce(v_platform_users, 0);

  RETURN NEXT;
  RETURN;
END;
$$;

COMMENT ON FUNCTION public.get_dashboard_data(uuid) IS
  'User dashboard aggregates. SECURITY DEFINER for dashboard; bypasses RLS.';

GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_dashboard_data(uuid) TO anon, authenticated, service_role;
