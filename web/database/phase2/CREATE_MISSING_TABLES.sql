-- Phase 2: Create Missing Tables for Candidate Cards
-- This script creates the missing tables needed for candidate cards functionality

-- Contact Information Table
CREATE TABLE IF NOT EXISTS civics_contact_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    representative_id UUID NOT NULL REFERENCES civics_representatives(id) ON DELETE CASCADE,
    official_email TEXT,
    official_phone TEXT,
    official_fax TEXT,
    official_website TEXT,
    office_addresses JSONB DEFAULT '[]',
    preferred_contact_method TEXT DEFAULT 'email',
    response_time_expectation TEXT DEFAULT 'within_week',
    data_quality_score INTEGER DEFAULT 0,
    last_verified TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social Media Engagement Table
CREATE TABLE IF NOT EXISTS civics_social_engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    representative_id UUID NOT NULL REFERENCES civics_representatives(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    handle TEXT NOT NULL,
    followers_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    last_updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voting Behavior Table
CREATE TABLE IF NOT EXISTS civics_voting_behavior (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    representative_id UUID NOT NULL REFERENCES civics_representatives(id) ON DELETE CASCADE,
    analysis_period TEXT NOT NULL,
    total_votes INTEGER DEFAULT 0,
    party_line_votes INTEGER DEFAULT 0,
    bipartisan_votes INTEGER DEFAULT 0,
    missed_votes INTEGER DEFAULT 0,
    attendance_rate DECIMAL(5,2) DEFAULT 0.00,
    party_loyalty_score DECIMAL(5,2) DEFAULT 0.00,
    bipartisanship_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy Positions Table
CREATE TABLE IF NOT EXISTS civics_policy_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    representative_id UUID NOT NULL REFERENCES civics_representatives(id) ON DELETE CASCADE,
    issue TEXT NOT NULL,
    position TEXT NOT NULL,
    confidence_score DECIMAL(5,2) DEFAULT 0.00,
    source TEXT,
    source_url TEXT,
    last_updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_civics_contact_info_representative_id ON civics_contact_info(representative_id);
CREATE INDEX IF NOT EXISTS idx_civics_social_engagement_representative_id ON civics_social_engagement(representative_id);
CREATE INDEX IF NOT EXISTS idx_civics_social_engagement_platform ON civics_social_engagement(platform);
CREATE INDEX IF NOT EXISTS idx_civics_voting_behavior_representative_id ON civics_voting_behavior(representative_id);
CREATE INDEX IF NOT EXISTS idx_civics_voting_behavior_period ON civics_voting_behavior(analysis_period);
CREATE INDEX IF NOT EXISTS idx_civics_policy_positions_representative_id ON civics_policy_positions(representative_id);
CREATE INDEX IF NOT EXISTS idx_civics_policy_positions_issue ON civics_policy_positions(issue);

-- Enable RLS on all tables
ALTER TABLE civics_contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE civics_social_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE civics_voting_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE civics_policy_positions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow read access to all, write access to authenticated users)
CREATE POLICY "Allow read access to civics_contact_info" ON civics_contact_info FOR SELECT USING (true);
CREATE POLICY "Allow read access to civics_social_engagement" ON civics_social_engagement FOR SELECT USING (true);
CREATE POLICY "Allow read access to civics_voting_behavior" ON civics_voting_behavior FOR SELECT USING (true);
CREATE POLICY "Allow read access to civics_policy_positions" ON civics_policy_positions FOR SELECT USING (true);

CREATE POLICY "Allow write access to civics_contact_info" ON civics_contact_info FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow write access to civics_social_engagement" ON civics_social_engagement FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow write access to civics_voting_behavior" ON civics_voting_behavior FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow write access to civics_policy_positions" ON civics_policy_positions FOR ALL USING (auth.role() = 'authenticated');

COMMIT;
