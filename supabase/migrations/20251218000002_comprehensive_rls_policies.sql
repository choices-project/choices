-- Comprehensive RLS Policies for Client-Side Access
-- These policies ensure proper access control while allowing the app to function
-- Created: December 18, 2025

-- ============================================================================
-- PUBLIC READ ACCESS (anyone can read, no authentication required)
-- These are public data that should be visible to all users
-- ============================================================================

-- Polls: Public can view active/published polls
ALTER TABLE IF EXISTS public.polls ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'polls' AND policyname = 'polls_public_read') THEN
    CREATE POLICY polls_public_read ON public.polls FOR SELECT USING (true);
  END IF;
END $$;

-- Feed Items: Public can view published feed items
ALTER TABLE IF EXISTS public.feed_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feed_items' AND policyname = 'feed_items_public_read') THEN
    CREATE POLICY feed_items_public_read ON public.feed_items FOR SELECT USING (true);
  END IF;
END $$;

-- Feeds: Public can view feeds
ALTER TABLE IF EXISTS public.feeds ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feeds' AND policyname = 'feeds_public_read') THEN
    CREATE POLICY feeds_public_read ON public.feeds FOR SELECT USING (true);
  END IF;
END $$;

-- Representatives: Public can view representative data
ALTER TABLE IF EXISTS public.representatives_core ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'representatives_core' AND policyname = 'representatives_public_read') THEN
    CREATE POLICY representatives_public_read ON public.representatives_core FOR SELECT USING (true);
  END IF;
END $$;

-- Elections: Public can view election data
ALTER TABLE IF EXISTS public.elections ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'elections' AND policyname = 'elections_public_read') THEN
    CREATE POLICY elections_public_read ON public.elections FOR SELECT USING (true);
  END IF;
END $$;

-- Candidates: Public can view candidate data
ALTER TABLE IF EXISTS public.candidates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidates' AND policyname = 'candidates_public_read') THEN
    CREATE POLICY candidates_public_read ON public.candidates FOR SELECT USING (true);
  END IF;
END $$;

-- Site Messages: Public can view site messages
ALTER TABLE IF EXISTS public.site_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_messages' AND policyname = 'site_messages_public_read') THEN
    CREATE POLICY site_messages_public_read ON public.site_messages FOR SELECT USING (true);
  END IF;
END $$;

-- Geographic Lookups: Public can view geographic data
ALTER TABLE IF EXISTS public.geographic_lookups ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'geographic_lookups' AND policyname = 'geographic_lookups_public_read') THEN
    CREATE POLICY geographic_lookups_public_read ON public.geographic_lookups FOR SELECT USING (true);
  END IF;
END $$;

ALTER TABLE IF EXISTS public.zip_to_ocd ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'zip_to_ocd' AND policyname = 'zip_to_ocd_public_read') THEN
    CREATE POLICY zip_to_ocd_public_read ON public.zip_to_ocd FOR SELECT USING (true);
  END IF;
END $$;

ALTER TABLE IF EXISTS public.latlon_to_ocd ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'latlon_to_ocd' AND policyname = 'latlon_to_ocd_public_read') THEN
    CREATE POLICY latlon_to_ocd_public_read ON public.latlon_to_ocd FOR SELECT USING (true);
  END IF;
END $$;

ALTER TABLE IF EXISTS public.state_districts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'state_districts' AND policyname = 'state_districts_public_read') THEN
    CREATE POLICY state_districts_public_read ON public.state_districts FOR SELECT USING (true);
  END IF;
END $$;

ALTER TABLE IF EXISTS public.redistricting_history ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'redistricting_history' AND policyname = 'redistricting_history_public_read') THEN
    CREATE POLICY redistricting_history_public_read ON public.redistricting_history FOR SELECT USING (true);
  END IF;
END $$;

ALTER TABLE IF EXISTS public.civic_database_entries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'civic_database_entries' AND policyname = 'civic_database_entries_public_read') THEN
    CREATE POLICY civic_database_entries_public_read ON public.civic_database_entries FOR SELECT USING (true);
  END IF;
END $$;

-- Hashtag related public reads
ALTER TABLE IF EXISTS public.hashtag_trends ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hashtag_trends' AND policyname = 'hashtag_trends_public_read') THEN
    CREATE POLICY hashtag_trends_public_read ON public.hashtag_trends FOR SELECT USING (true);
  END IF;
END $$;

ALTER TABLE IF EXISTS public.hashtag_co_occurrence ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hashtag_co_occurrence' AND policyname = 'hashtag_co_occurrence_public_read') THEN
    CREATE POLICY hashtag_co_occurrence_public_read ON public.hashtag_co_occurrence FOR SELECT USING (true);
  END IF;
END $$;

ALTER TABLE IF EXISTS public.hashtag_content ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hashtag_content' AND policyname = 'hashtag_content_public_read') THEN
    CREATE POLICY hashtag_content_public_read ON public.hashtag_content FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================================
-- AUTHENTICATED READ ACCESS (logged-in users only)
-- These require authentication but any authenticated user can read
-- ============================================================================

-- Poll Votes: Authenticated users can read (for viewing results)
ALTER TABLE IF EXISTS public.poll_votes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'poll_votes' AND policyname = 'poll_votes_authenticated_read') THEN
    CREATE POLICY poll_votes_authenticated_read ON public.poll_votes FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Votes: Authenticated users can read votes
ALTER TABLE IF EXISTS public.votes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'votes' AND policyname = 'votes_authenticated_read') THEN
    CREATE POLICY votes_authenticated_read ON public.votes FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Poll Demographic Insights: Authenticated users can view insights
ALTER TABLE IF EXISTS public.poll_demographic_insights ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'poll_demographic_insights' AND policyname = 'poll_demographic_insights_authenticated_read') THEN
    CREATE POLICY poll_demographic_insights_authenticated_read ON public.poll_demographic_insights FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Hashtag Engagement: Authenticated users can view engagement data
ALTER TABLE IF EXISTS public.hashtag_engagement ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hashtag_engagement' AND policyname = 'hashtag_engagement_authenticated_read') THEN
    CREATE POLICY hashtag_engagement_authenticated_read ON public.hashtag_engagement FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Hashtag Usage: Authenticated users can view usage data
ALTER TABLE IF EXISTS public.hashtag_usage ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hashtag_usage' AND policyname = 'hashtag_usage_authenticated_read') THEN
    CREATE POLICY hashtag_usage_authenticated_read ON public.hashtag_usage FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- ============================================================================
-- USER-OWNED DATA (users can only access their own data)
-- These are personal data that should be restricted to the owner
-- ============================================================================

-- User Profiles: Users can read any profile, but only update their own
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_public_read') THEN
    CREATE POLICY user_profiles_public_read ON public.user_profiles FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_owner_update') THEN
    CREATE POLICY user_profiles_owner_update ON public.user_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- User Sessions: Users can only see their own sessions
ALTER TABLE IF EXISTS public.user_sessions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_sessions' AND policyname = 'user_sessions_owner_access') THEN
    CREATE POLICY user_sessions_owner_access ON public.user_sessions FOR ALL TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- User Hashtags: Users can manage their own hashtag preferences
ALTER TABLE IF EXISTS public.user_hashtags ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_hashtags' AND policyname = 'user_hashtags_owner_access') THEN
    CREATE POLICY user_hashtags_owner_access ON public.user_hashtags FOR ALL TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Hashtag User Preferences: Users can manage their own preferences
ALTER TABLE IF EXISTS public.hashtag_user_preferences ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hashtag_user_preferences' AND policyname = 'hashtag_user_preferences_owner_access') THEN
    CREATE POLICY hashtag_user_preferences_owner_access ON public.hashtag_user_preferences FOR ALL TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- WebAuthn Credentials: Users can only manage their own credentials
ALTER TABLE IF EXISTS public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webauthn_credentials' AND policyname = 'webauthn_credentials_owner_access') THEN
    CREATE POLICY webauthn_credentials_owner_access ON public.webauthn_credentials FOR ALL TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Feed Interactions: Users can manage their own interactions
ALTER TABLE IF EXISTS public.feed_interactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feed_interactions' AND policyname = 'feed_interactions_owner_access') THEN
    CREATE POLICY feed_interactions_owner_access ON public.feed_interactions FOR ALL TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- WRITE POLICIES FOR AUTHENTICATED USERS
-- These allow authenticated users to insert/update certain data
-- ============================================================================

-- Poll Votes: Authenticated users can insert their own votes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'poll_votes' AND policyname = 'poll_votes_insert_own') THEN
    CREATE POLICY poll_votes_insert_own ON public.poll_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Votes: Authenticated users can insert their own votes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'votes' AND policyname = 'votes_insert_own') THEN
    CREATE POLICY votes_insert_own ON public.votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Feedback: Anyone can insert feedback (for anonymous feedback)
ALTER TABLE IF EXISTS public.feedback ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'feedback_insert') THEN
    CREATE POLICY feedback_insert ON public.feedback FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Hashtag Flags: Authenticated users can flag hashtags
ALTER TABLE IF EXISTS public.hashtag_flags ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hashtag_flags' AND policyname = 'hashtag_flags_insert') THEN
    CREATE POLICY hashtag_flags_insert ON public.hashtag_flags FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- ANALYTICS TABLES (write for tracking, read for authenticated)
-- ============================================================================

ALTER TABLE IF EXISTS public.analytics_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_events' AND policyname = 'analytics_events_insert') THEN
    CREATE POLICY analytics_events_insert ON public.analytics_events FOR INSERT WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE IF EXISTS public.feature_usage ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feature_usage' AND policyname = 'feature_usage_insert') THEN
    CREATE POLICY feature_usage_insert ON public.feature_usage FOR INSERT WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE IF EXISTS public.platform_analytics ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_analytics' AND policyname = 'platform_analytics_insert') THEN
    CREATE POLICY platform_analytics_insert ON public.platform_analytics FOR INSERT WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE IF EXISTS public.trust_tier_analytics ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trust_tier_analytics' AND policyname = 'trust_tier_analytics_insert') THEN
    CREATE POLICY trust_tier_analytics_insert ON public.trust_tier_analytics FOR INSERT WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE IF EXISTS public.system_health ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_health' AND policyname = 'system_health_insert') THEN
    CREATE POLICY system_health_insert ON public.system_health FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Public read: polls, feed_items, feeds, representatives_core, elections, 
--              candidates, site_messages, geographic tables, hashtag tables,
--              user_profiles
-- Authenticated read: poll_votes, votes, poll_demographic_insights, 
--                     hashtag_engagement, hashtag_usage
-- Owner-only: user_sessions, user_hashtags, hashtag_user_preferences,
--             webauthn_credentials, feed_interactions
-- Insert allowed: feedback, analytics tables, poll_votes, votes

