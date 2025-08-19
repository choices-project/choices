-- Comprehensive Supabase Security Fix
-- This script addresses all the security issues shown in your dashboard

-- 1. Enable RLS on all public tables
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE bias_detection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_check_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_fetch_logs ENABLE ROW LEVEL SECURITY;

-- 2. Create comprehensive RLS policies for feedback table
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;
DROP POLICY IF EXISTS "Users can update own feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;

-- Allow users to view their own feedback
CREATE POLICY "Users can view own feedback" ON feedback
    FOR SELECT USING (auth.uid() = user_id);

-- Allow anyone to submit feedback (for anonymous feedback)
CREATE POLICY "Anyone can submit feedback" ON feedback
    FOR INSERT WITH CHECK (true);

-- Allow users to update their own feedback
CREATE POLICY "Users can update own feedback" ON feedback
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow admins to view all feedback (you can customize this)
CREATE POLICY "Admins can view all feedback" ON feedback
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles 
            WHERE role = 'admin'
        )
    );

-- 3. Create policies for other tables
-- Bias detection logs (admin only)
CREATE POLICY "Admins can manage bias detection logs" ON bias_detection_logs
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles 
            WHERE role = 'admin'
        )
    );

-- Fact check sources (read-only for authenticated users)
CREATE POLICY "Authenticated users can view fact check sources" ON fact_check_sources
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage fact check sources" ON fact_check_sources
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles 
            WHERE role = 'admin'
        )
    );

-- Media polls (authenticated users can view, admins can manage)
CREATE POLICY "Authenticated users can view media polls" ON media_polls
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage media polls" ON media_polls
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles 
            WHERE role = 'admin'
        )
    );

-- Media sources (read-only for authenticated users)
CREATE POLICY "Authenticated users can view media sources" ON media_sources
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage media sources" ON media_sources
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles 
            WHERE role = 'admin'
        )
    );

-- News fetch logs (admin only)
CREATE POLICY "Admins can manage news fetch logs" ON news_fetch_logs
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles 
            WHERE role = 'admin'
        )
    );

-- 4. Create user_roles table if it doesn't exist (for admin management)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all roles
CREATE POLICY "Admins can manage all roles" ON user_roles
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles 
            WHERE role = 'admin'
        )
    );

-- 5. Performance optimizations (address slow queries)
-- Create indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_type_status ON feedback(type, status);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id_created ON feedback(user_id, created_at DESC);

-- 6. Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- 7. Show security status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'feedback', 
        'bias_detection_logs', 
        'fact_check_sources', 
        'media_polls', 
        'media_sources', 
        'news_fetch_logs'
    )
ORDER BY tablename;

-- 8. Show policy count per table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
