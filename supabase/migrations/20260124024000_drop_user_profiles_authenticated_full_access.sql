-- Drop "Authenticated full access" on user_profiles; we have own-data policies.
-- Admin dashboard uses admin client; get_dashboard_data is SECURITY DEFINER.
DROP POLICY IF EXISTS "Authenticated full access" ON public.user_profiles;
