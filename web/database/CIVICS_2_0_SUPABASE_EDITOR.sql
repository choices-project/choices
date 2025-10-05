-- Civics 2.0 Clean Migration for Supabase Editor
-- Drop existing civics tables and create optimized schema
-- KEEPS: id_crosswalk, canonical ID system, and all good infrastructure
-- Created: January 5, 2025

-- Drop existing civics tables (in dependency order)
-- KEEPING: id_crosswalk, all other non-civics tables
DROP TABLE IF EXISTS civics_voting_behavior CASCADE;
DROP TABLE IF EXISTS civics_votes_minimal CASCADE;
DROP TABLE IF EXISTS civics_votes CASCADE;
DROP TABLE IF EXISTS civics_social_engagement CASCADE;
DROP TABLE IF EXISTS civics_representatives CASCADE;
DROP TABLE IF EXISTS civics_policy_positions CASCADE;
DROP TABLE IF EXISTS civics_person_xref CASCADE;
DROP TABLE IF EXISTS civics_fec_minimal CASCADE;
DROP TABLE IF EXISTS civics_expected_counts CASCADE;
DROP TABLE IF EXISTS civics_divisions CASCADE;
DROP TABLE IF EXISTS civics_contact_info CASCADE;
DROP TABLE IF EXISTS civics_campaign_finance CASCADE;
DROP TABLE IF EXISTS civics_addresses CASCADE;
DROP TABLE IF EXISTS civics_source_precedence CASCADE;
DROP TABLE IF EXISTS civics_quality_thresholds CASCADE;

-- Drop any related sequences
DROP SEQUENCE IF EXISTS civics_expected_counts_id_seq CASCADE;
DROP SEQUENCE IF EXISTS civics_fec_minimal_id_seq CASCADE;
DROP SEQUENCE IF EXISTS civics_votes_minimal_id_seq CASCADE;
DROP SEQUENCE IF EXISTS civics_quality_thresholds_id_seq CASCADE;

-- Create new optimized Civics 2.0 schema
-- Core representatives table (optimized for fast queries)
CREATE TABLE representatives_core (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  party TEXT,
  office TEXT NOT NULL,
  level TEXT NOT NULL, -- 'federal', 'state', 'local'
  state TEXT NOT NULL,
  district TEXT,
  
  -- Primary identifiers from FREE APIs
  bioguide_id TEXT UNIQUE, -- Congress.gov
  openstates_id TEXT UNIQUE, -- OpenStates
  fec_id TEXT UNIQUE, -- FEC
  google_civic_id TEXT, -- Google Civic
  
  -- Primary contact (most common queries)
  primary_email TEXT,
  primary_phone TEXT,
  primary_website TEXT,
  primary_photo_url TEXT,
  
  -- Status and quality
  active BOOLEAN DEFAULT true,
  data_quality_score INTEGER DEFAULT 0, -- 0-100
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Metadata
  data_sources TEXT[] DEFAULT '{}', -- Which APIs provided data
  last_verified TIMESTAMPTZ,
  verification_status TEXT DEFAULT 'unverified' -- 'verified', 'unverified', 'pending'
);

-- Rich contact data (multiple per representative)
CREATE TABLE representative_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id UUID REFERENCES representatives_core(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'email', 'phone', 'website', 'fax', 'address'
  value TEXT NOT NULL,
  label TEXT, -- 'DC Office', 'District Office', 'Campaign', 'Personal'
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  source TEXT, -- Which API provided this contact
  last_verified TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Social media presence
CREATE TABLE representative_social_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id UUID REFERENCES representatives_core(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'twitter', 'facebook', 'instagram', 'youtube', 'linkedin'
  handle TEXT NOT NULL,
  url TEXT,
  followers_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  source TEXT, -- Which API provided this social media
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Multiple photos per representative
CREATE TABLE representative_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id UUID REFERENCES representatives_core(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  source TEXT NOT NULL, -- 'congress-gov', 'wikipedia', 'google-civic', 'openstates'
  quality TEXT NOT NULL, -- 'high', 'medium', 'low'
  is_primary BOOLEAN DEFAULT false,
  license TEXT,
  attribution TEXT,
  width INTEGER,
  height INTEGER,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Recent activity for feed
CREATE TABLE representative_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id UUID REFERENCES representatives_core(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'vote', 'bill', 'statement', 'social_media', 'photo_update'
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  date TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}',
  source TEXT, -- Which API provided this activity
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Campaign finance data (FEC)
CREATE TABLE representative_campaign_finance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id UUID REFERENCES representatives_core(id) ON DELETE CASCADE,
  election_cycle TEXT NOT NULL, -- '2024', '2022', etc.
  total_receipts DECIMAL(15,2) DEFAULT 0,
  total_disbursements DECIMAL(15,2) DEFAULT 0,
  cash_on_hand DECIMAL(15,2) DEFAULT 0,
  debt DECIMAL(15,2) DEFAULT 0,
  individual_contributions DECIMAL(15,2) DEFAULT 0,
  pac_contributions DECIMAL(15,2) DEFAULT 0,
  party_contributions DECIMAL(15,2) DEFAULT 0,
  self_financing DECIMAL(15,2) DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Voting records
CREATE TABLE representative_voting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id UUID REFERENCES representatives_core(id) ON DELETE CASCADE,
  vote_id TEXT NOT NULL,
  bill_title TEXT,
  bill_number TEXT,
  vote_position TEXT NOT NULL, -- 'yes', 'no', 'abstain', 'not_voting'
  vote_date TIMESTAMPTZ NOT NULL,
  chamber TEXT, -- 'house', 'senate'
  session TEXT, -- '118th', '117th', etc.
  result TEXT, -- 'passed', 'failed', 'tabled'
  metadata JSONB DEFAULT '{}',
  source TEXT, -- Which API provided this vote
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User preferences for feed
CREATE TABLE user_civics_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- References auth.users
  state TEXT,
  district TEXT,
  interests TEXT[], -- User's political interests
  followed_representatives UUID[], -- Representatives user follows
  feed_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Feed items for social feed
CREATE TABLE civics_feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id UUID REFERENCES representatives_core(id) ON DELETE CASCADE,
  user_id UUID, -- NULL for public feed items
  content_type TEXT NOT NULL, -- 'vote', 'bill', 'statement', 'social_media', 'photo'
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  url TEXT,
  date TIMESTAMPTZ NOT NULL,
  engagement_metrics JSONB DEFAULT '{}', -- likes, shares, comments
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Essential indexes for performance
CREATE INDEX idx_representatives_core_state_level ON representatives_core(state, level, active);
CREATE INDEX idx_representatives_core_bioguide ON representatives_core(bioguide_id);
CREATE INDEX idx_representatives_core_openstates ON representatives_core(openstates_id);
CREATE INDEX idx_representatives_core_fec ON representatives_core(fec_id);
CREATE INDEX idx_representatives_core_name_gin ON representatives_core USING gin(to_tsvector('english', name));

-- Contact indexes
CREATE INDEX idx_representative_contacts_rep_type ON representative_contacts(representative_id, type);
CREATE INDEX idx_representative_contacts_rep_primary ON representative_contacts(representative_id, is_primary);

-- Social media indexes
CREATE INDEX idx_representative_social_rep_platform ON representative_social_media(representative_id, platform);
CREATE INDEX idx_representative_social_platform_followers ON representative_social_media(platform, followers_count);

-- Photo indexes
CREATE INDEX idx_representative_photos_rep_primary ON representative_photos(representative_id, is_primary);
CREATE INDEX idx_representative_photos_rep_source ON representative_photos(representative_id, source);

-- Activity indexes (for feed)
CREATE INDEX idx_representative_activity_rep_date ON representative_activity(representative_id, date DESC);
CREATE INDEX idx_representative_activity_type_date ON representative_activity(activity_type, date DESC);

-- Campaign finance indexes
CREATE INDEX idx_campaign_finance_rep_cycle ON representative_campaign_finance(representative_id, election_cycle);

-- Voting records indexes
CREATE INDEX idx_voting_records_rep_date ON representative_voting_records(representative_id, vote_date DESC);
CREATE INDEX idx_voting_records_position ON representative_voting_records(vote_position);

-- User preferences indexes
CREATE INDEX idx_user_preferences_user_id ON user_civics_preferences(user_id);
CREATE INDEX idx_user_preferences_state ON user_civics_preferences(state);

-- Feed items indexes
CREATE INDEX idx_feed_items_rep_date ON civics_feed_items(representative_id, date DESC);
CREATE INDEX idx_feed_items_user_public ON civics_feed_items(user_id, is_public, date DESC);
CREATE INDEX idx_feed_items_type_date ON civics_feed_items(content_type, date DESC);

-- Functions for data quality scoring
CREATE OR REPLACE FUNCTION calculate_data_quality_score(rep_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  contact_count INTEGER;
  social_count INTEGER;
  photo_count INTEGER;
  activity_count INTEGER;
BEGIN
  -- Count contacts
  SELECT COUNT(*) INTO contact_count
  FROM representative_contacts
  WHERE representative_id = rep_id AND is_verified = true;
  
  -- Count social media
  SELECT COUNT(*) INTO social_count
  FROM representative_social_media
  WHERE representative_id = rep_id;
  
  -- Count photos
  SELECT COUNT(*) INTO photo_count
  FROM representative_photos
  WHERE representative_id = rep_id;
  
  -- Count recent activity
  SELECT COUNT(*) INTO activity_count
  FROM representative_activity
  WHERE representative_id = rep_id AND date > NOW() - INTERVAL '30 days';
  
  -- Calculate score (0-100)
  score := LEAST(100, 
    (contact_count * 20) + 
    (social_count * 15) + 
    (photo_count * 25) + 
    (activity_count * 5)
  );
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function to get representative with all data
CREATE OR REPLACE FUNCTION get_representative_full_data(rep_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'representative', row_to_json(rc),
    'contacts', (
      SELECT json_agg(row_to_json(contacts))
      FROM representative_contacts contacts
      WHERE contacts.representative_id = rep_id
    ),
    'social_media', (
      SELECT json_agg(row_to_json(social))
      FROM representative_social_media social
      WHERE social.representative_id = rep_id
    ),
    'photos', (
      SELECT json_agg(row_to_json(photos))
      FROM representative_photos photos
      WHERE photos.representative_id = rep_id
    ),
    'recent_activity', (
      SELECT json_agg(row_to_json(activity))
      FROM representative_activity activity
      WHERE activity.representative_id = rep_id
      ORDER BY activity.date DESC
      LIMIT 10
    )
  ) INTO result
  FROM representatives_core rc
  WHERE rc.id = rep_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate user feed
CREATE OR REPLACE FUNCTION generate_user_feed(user_uuid UUID, limit_count INTEGER DEFAULT 20)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(feed_items))
  INTO result
  FROM (
    SELECT 
      cfi.*,
      rc.name as representative_name,
      rc.party,
      rc.office,
      rc.primary_photo_url
    FROM civics_feed_items cfi
    JOIN representatives_core rc ON cfi.representative_id = rc.id
    WHERE cfi.is_public = true
    ORDER BY cfi.date DESC
    LIMIT limit_count
  ) feed_items;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE representatives_core IS 'Core representatives table with essential data from FREE APIs';
COMMENT ON TABLE representative_contacts IS 'Multiple contact methods per representative';
COMMENT ON TABLE representative_social_media IS 'Social media presence for representatives';
COMMENT ON TABLE representative_photos IS 'Multiple photos per representative from various sources';
COMMENT ON TABLE representative_activity IS 'Recent activity for feed generation';
COMMENT ON TABLE representative_campaign_finance IS 'Campaign finance data from FEC API';
COMMENT ON TABLE representative_voting_records IS 'Voting records from Congress.gov and OpenStates';
COMMENT ON TABLE user_civics_preferences IS 'User preferences for personalized feed';
COMMENT ON TABLE civics_feed_items IS 'Social feed items for civic engagement';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Civics 2.0 schema migration completed successfully!';
  RAISE NOTICE 'All existing civics tables have been dropped and replaced with optimized schema.';
  RAISE NOTICE 'KEPT: id_crosswalk, canonical ID system, and all good infrastructure.';
  RAISE NOTICE 'Ready for FREE APIs data ingestion!';
END $$;

