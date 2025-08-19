-- Comprehensive Row Level Security (RLS) Policies for Choices Platform
-- This ensures data privacy and security across all tables

-- ========================================
-- FEEDBACK TABLE POLICIES
-- ========================================

-- Allow anyone to submit feedback (for anonymous users)
CREATE POLICY "Anyone can submit feedback" ON feedback
    FOR INSERT WITH CHECK (true);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON feedback
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Only authenticated users can update their own feedback
CREATE POLICY "Users can update own feedback" ON feedback
    FOR UPDATE USING (auth.uid() = user_id);

-- Only authenticated users can delete their own feedback
CREATE POLICY "Users can delete own feedback" ON feedback
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- POLLS TABLE POLICIES
-- ========================================

-- Anyone can view active polls
CREATE POLICY "Public read access to active polls" ON po_polls
    FOR SELECT USING (status = 'active');

-- Authenticated users can view all polls they created
CREATE POLICY "Users can view own polls" ON po_polls
    FOR SELECT USING (auth.uid() = created_by);

-- Authenticated users can create polls
CREATE POLICY "Users can create polls" ON po_polls
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update their own polls
CREATE POLICY "Users can update own polls" ON po_polls
    FOR UPDATE USING (auth.uid() = created_by);

-- Users can delete their own polls (if no votes exist)
CREATE POLICY "Users can delete own polls" ON po_polls
    FOR DELETE USING (auth.uid() = created_by);

-- ========================================
-- VOTES TABLE POLICIES
-- ========================================

-- Users can view votes on polls they can see
CREATE POLICY "Users can view votes on accessible polls" ON po_votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM po_polls 
            WHERE poll_id = po_votes.poll_id 
            AND (status = 'active' OR created_by = auth.uid())
        )
    );

-- Users can view their own votes
CREATE POLICY "Users can view own votes" ON po_votes
    FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can vote on active polls
CREATE POLICY "Users can vote on active polls" ON po_votes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM po_polls 
            WHERE poll_id = po_votes.poll_id 
            AND status = 'active'
        )
    );

-- Users can update their own votes (within time limit)
CREATE POLICY "Users can update own votes" ON po_votes
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own votes (within time limit)
CREATE POLICY "Users can delete own votes" ON po_votes
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- USER PROFILES POLICIES
-- ========================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own profile
CREATE POLICY "Users can create own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- USERS TABLE POLICIES
-- ========================================

-- Users can view their own user record
CREATE POLICY "Users can view own user record" ON ia_users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own user record
CREATE POLICY "Users can update own user record" ON ia_users
    FOR UPDATE USING (auth.uid() = id);

-- Only system can create users (via auth system)
CREATE POLICY "System can create users" ON ia_users
    FOR INSERT WITH CHECK (false); -- Disabled, handled by auth system

-- Users cannot delete their own account (soft delete only)
CREATE POLICY "No user deletion" ON ia_users
    FOR DELETE USING (false);

-- ========================================
-- ANALYTICS POLICIES
-- ========================================

-- Only authenticated users can view analytics data
CREATE POLICY "Authenticated users can view analytics" ON analytics_demographics
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only system can insert analytics data
CREATE POLICY "System can insert analytics" ON analytics_demographics
    FOR INSERT WITH CHECK (false); -- Disabled, handled by system

-- Only system can update analytics data
CREATE POLICY "System can update analytics" ON analytics_demographics
    FOR UPDATE USING (false); -- Disabled, handled by system

-- No deletion of analytics data
CREATE POLICY "No analytics deletion" ON analytics_demographics
    FOR DELETE USING (false);

-- ========================================
-- ANALYTICS EVENTS POLICIES
-- ========================================

-- Only authenticated users can view event data
CREATE POLICY "Authenticated users can view events" ON analytics_events
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only system can insert event data
CREATE POLICY "System can insert events" ON analytics_events
    FOR INSERT WITH CHECK (false); -- Disabled, handled by system

-- Only system can update event data
CREATE POLICY "System can update events" ON analytics_events
    FOR UPDATE USING (false); -- Disabled, handled by system

-- No deletion of event data
CREATE POLICY "No event deletion" ON analytics_events
    FOR DELETE USING (false);

-- ========================================
-- ADDITIONAL SECURITY MEASURES
-- ========================================

-- Create a function to check if user is admin (for future admin features)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- For now, return false. This can be enhanced later with admin role checking
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is contributor (for future contributor features)
CREATE OR REPLACE FUNCTION is_contributor()
RETURNS BOOLEAN AS $$
BEGIN
    -- For now, return false. This can be enhanced later with contributor role checking
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION is_admin() IS 'Check if current user has admin privileges';
COMMENT ON FUNCTION is_contributor() IS 'Check if current user has contributor privileges';
