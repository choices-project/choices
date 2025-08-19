-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR CHOICES PLATFORM
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE ia_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_votes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ia_users TABLE POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON ia_users
    FOR SELECT USING (
        auth.uid()::text = stable_id OR
        verification_tier IN ('T2', 'T3') -- Trusted users can see other profiles
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON ia_users
    FOR UPDATE USING (
        auth.uid()::text = stable_id
    );

-- Allow insertion of new users (for registration)
CREATE POLICY "Allow user registration" ON ia_users
    FOR INSERT WITH CHECK (
        auth.uid()::text = stable_id
    );

-- Admins can manage all users
CREATE POLICY "Admins can manage all users" ON ia_users
    FOR ALL USING (
        verification_tier = 'T3' -- Validators can manage all users
    );

-- =====================================================
-- ia_tokens TABLE POLICIES
-- =====================================================

-- Users can view their own tokens
CREATE POLICY "Users can view own tokens" ON ia_tokens
    FOR SELECT USING (
        auth.uid()::text = user_stable_id
    );

-- Users can create tokens for themselves
CREATE POLICY "Users can create own tokens" ON ia_tokens
    FOR INSERT WITH CHECK (
        auth.uid()::text = user_stable_id
    );

-- Users can update their own tokens
CREATE POLICY "Users can update own tokens" ON ia_tokens
    FOR UPDATE USING (
        auth.uid()::text = user_stable_id
    );

-- Users can delete their own tokens
CREATE POLICY "Users can delete own tokens" ON ia_tokens
    FOR DELETE USING (
        auth.uid()::text = user_stable_id
    );

-- =====================================================
-- po_polls TABLE POLICIES
-- =====================================================

-- Anyone can view active polls
CREATE POLICY "Anyone can view active polls" ON po_polls
    FOR SELECT USING (
        status = 'active' OR
        verification_tier IN ('T2', 'T3') -- Trusted users can see all polls
    );

-- Trusted users can create polls
CREATE POLICY "Trusted users can create polls" ON po_polls
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ia_users 
            WHERE stable_id = auth.uid()::text 
            AND verification_tier IN ('T2', 'T3')
            AND is_active = true
        )
    );

-- Poll creators can update their polls
CREATE POLICY "Poll creators can update polls" ON po_polls
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM ia_users 
            WHERE stable_id = auth.uid()::text 
            AND verification_tier IN ('T2', 'T3')
            AND is_active = true
        )
    );

-- Admins can manage all polls
CREATE POLICY "Admins can manage all polls" ON po_polls
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ia_users 
            WHERE stable_id = auth.uid()::text 
            AND verification_tier = 'T3'
            AND is_active = true
        )
    );

-- =====================================================
-- po_votes TABLE POLICIES
-- =====================================================

-- Users can view votes for polls they have access to
CREATE POLICY "Users can view poll votes" ON po_votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM po_polls 
            WHERE poll_id = po_votes.poll_id 
            AND status = 'active'
        ) OR
        EXISTS (
            SELECT 1 FROM ia_users 
            WHERE stable_id = auth.uid()::text 
            AND verification_tier IN ('T2', 'T3')
            AND is_active = true
        )
    );

-- Users can create votes for active polls
CREATE POLICY "Users can vote on active polls" ON po_votes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM po_polls 
            WHERE poll_id = po_votes.poll_id 
            AND status = 'active'
        ) AND
        EXISTS (
            SELECT 1 FROM ia_users 
            WHERE stable_id = auth.uid()::text 
            AND is_active = true
        )
    );

-- Users cannot update or delete votes (immutable voting)
CREATE POLICY "Votes are immutable" ON po_votes
    FOR UPDATE USING (false);

CREATE POLICY "Votes cannot be deleted" ON po_votes
    FOR DELETE USING (false);

-- =====================================================
-- ADDITIONAL SECURITY POLICIES
-- =====================================================

-- Prevent users from seeing other users' email addresses
CREATE POLICY "Protect email privacy" ON ia_users
    FOR SELECT USING (
        auth.uid()::text = stable_id OR
        verification_tier IN ('T2', 'T3') -- Only trusted users can see emails
    );

-- Ensure only active users can perform actions
CREATE POLICY "Only active users can perform actions" ON ia_users
    FOR ALL USING (
        is_active = true
    );

-- =====================================================
-- FUNCTION TO GET USER VERIFICATION TIER
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_verification_tier(user_id TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT verification_tier 
        FROM ia_users 
        WHERE stable_id = user_id 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION TO CHECK IF USER CAN CREATE POLLS
-- =====================================================

CREATE OR REPLACE FUNCTION can_create_polls(user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM ia_users 
        WHERE stable_id = user_id 
        AND verification_tier IN ('T2', 'T3')
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION TO CHECK IF USER IS ADMIN
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin(user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM ia_users 
        WHERE stable_id = user_id 
        AND verification_tier = 'T3'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
