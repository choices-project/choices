-- Migration: 008-enable-rls-security.sql
-- Purpose: Enable RLS on all tables and implement proper security policies
-- Created: 2025-08-27
-- Status: Critical security fix based on Supabase audit
-- Supabase Security Audit: RLS disabled on 25+ tables

-- Enable RLS on all tables that currently have it disabled
-- This addresses the "RLS Disabled in Public" errors

-- Core user tables
ALTER TABLE public.ia_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_verification_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Poll-related tables
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_polls ENABLE ROW LEVEL SECURITY;

-- Media and content tables
ALTER TABLE public.media_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_check_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bias_detection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_fetch_logs ENABLE ROW LEVEL SECURITY;

-- System and admin tables
ALTER TABLE public.site_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breaking_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_log ENABLE ROW LEVEL SECURITY;

-- Advanced features
ALTER TABLE public.po_merkle_trees ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies

-- 1. User Authentication Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own verification sessions" ON public.ia_verification_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own webauthn credentials" ON public.ia_webauthn_credentials
    FOR ALL USING (auth.uid() = user_id);

-- 2. Poll Access Policies
CREATE POLICY "Public can view published polls" ON public.polls
    FOR SELECT USING (visibility = 'public' OR visibility = 'unlisted');

CREATE POLICY "Users can view own polls" ON public.polls
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create polls" ON public.polls
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own polls" ON public.polls
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own polls" ON public.polls
    FOR DELETE USING (auth.uid() = owner_id);

-- 3. Poll Options Policies
CREATE POLICY "Public can view poll options" ON public.poll_options
    FOR SELECT USING (true);

CREATE POLICY "Users can create poll options for own polls" ON public.poll_options
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE id = poll_id AND owner_id = auth.uid()
        )
    );

-- 4. Voting Policies
CREATE POLICY "Users can view votes on public polls" ON public.votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE id = poll_id AND visibility IN ('public', 'unlisted')
        )
    );

CREATE POLICY "Users can view own votes" ON public.votes
    FOR SELECT USING (voter_id = auth.uid());

CREATE POLICY "Users can vote once per poll" ON public.votes
    FOR INSERT WITH CHECK (
        voter_id = auth.uid() AND
        NOT EXISTS (
            SELECT 1 FROM public.votes 
            WHERE poll_id = votes.poll_id AND voter_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own votes" ON public.votes
    FOR UPDATE USING (voter_id = auth.uid());

-- 5. Media and Content Policies
CREATE POLICY "Public can view media sources" ON public.media_sources
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage media sources" ON public.media_sources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Public can view fact check sources" ON public.fact_check_sources
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage fact check sources" ON public.fact_check_sources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 6. System Tables - Admin Only
CREATE POLICY "Admins can access system configuration" ON public.system_configuration
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can access audit logs" ON public.audit_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can access breaking news" ON public.breaking_news
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 7. Public Read-Only Tables
CREATE POLICY "Public can view site messages" ON public.site_messages
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage site messages" ON public.site_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Public can view trending topics" ON public.trending_topics
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage trending topics" ON public.trending_topics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 8. Generated Content Policies
CREATE POLICY "Public can view generated polls" ON public.generated_polls
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Admins can manage generated polls" ON public.generated_polls
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 9. Analytics and Metrics (Admin Only)
CREATE POLICY "Admins can access quality metrics" ON public.quality_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can access poll generation logs" ON public.poll_generation_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 10. Advanced Features
CREATE POLICY "Users can access own merkle trees" ON public.po_merkle_trees
    FOR ALL USING (user_id = auth.uid());

-- 11. News and Media Policies
CREATE POLICY "Public can view news sources" ON public.news_sources
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage news sources" ON public.news_sources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can access news fetch logs" ON public.news_fetch_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 12. Bias Detection (Admin Only)
CREATE POLICY "Admins can access bias detection logs" ON public.bias_detection_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 13. Migration Log (Admin Only)
CREATE POLICY "Admins can access migration log" ON public.migration_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 14. Data Sources (Admin Only)
CREATE POLICY "Admins can access data sources" ON public.data_sources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create indexes for better performance with RLS
CREATE INDEX IF NOT EXISTS idx_polls_owner_id ON public.polls(owner_id);
CREATE INDEX IF NOT EXISTS idx_polls_visibility ON public.polls(visibility);
CREATE INDEX IF NOT EXISTS idx_votes_voter_id ON public.votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON public.votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Log the security enhancement
INSERT INTO public.audit_logs (
    action,
    table_name,
    user_id,
    details,
    ip_address,
    user_agent,
    created_at
) VALUES (
    'SECURITY_ENHANCEMENT',
    'ALL_TABLES',
    NULL,
    'Enabled RLS on all tables and implemented comprehensive security policies based on Supabase security audit',
    'SYSTEM',
    'MIGRATION_SCRIPT',
    NOW()
);
