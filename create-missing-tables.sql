-- Create Missing Tables for Hybrid Approach
-- Primary data in representatives_core, detailed data in separate tables

-- ==============================================
-- 1. REPRESENTATIVE_CONTACTS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS representative_contacts (
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_representative_contacts_rep_id ON representative_contacts(representative_id);
CREATE INDEX IF NOT EXISTS idx_representative_contacts_type ON representative_contacts(type);
CREATE INDEX IF NOT EXISTS idx_representative_contacts_primary ON representative_contacts(is_primary);

-- ==============================================
-- 2. REPRESENTATIVE_SOCIAL_MEDIA TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS representative_social_media (
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_representative_social_rep_id ON representative_social_media(representative_id);
CREATE INDEX IF NOT EXISTS idx_representative_social_platform ON representative_social_media(platform);
CREATE INDEX IF NOT EXISTS idx_representative_social_verified ON representative_social_media(is_verified);

-- ==============================================
-- 3. REPRESENTATIVE_PHOTOS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS representative_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id UUID REFERENCES representatives_core(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  source TEXT NOT NULL, -- 'congress-gov', 'wikipedia', 'google-civic', 'openstates'
  quality TEXT NOT NULL, -- 'high', 'medium', 'low'
  is_primary BOOLEAN DEFAULT false,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_representative_photos_rep_id ON representative_photos(representative_id);
CREATE INDEX IF NOT EXISTS idx_representative_photos_primary ON representative_photos(is_primary);
CREATE INDEX IF NOT EXISTS idx_representative_photos_quality ON representative_photos(quality);

-- ==============================================
-- 4. REPRESENTATIVE_ACTIVITY TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS representative_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id UUID REFERENCES representatives_core(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'vote', 'bill', 'speech', 'committee', 'press_release'
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL, -- 'congress-gov', 'openstates', 'fec', etc.
  url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_representative_activity_rep_id ON representative_activity(representative_id);
CREATE INDEX IF NOT EXISTS idx_representative_activity_type ON representative_activity(type);
CREATE INDEX IF NOT EXISTS idx_representative_activity_date ON representative_activity(date);

-- ==============================================
-- 5. REPRESENTATIVE_COMMITTEES TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS representative_committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id UUID REFERENCES representatives_core(id) ON DELETE CASCADE,
  committee_name TEXT NOT NULL,
  role TEXT, -- 'member', 'chair', 'ranking_member', 'vice_chair'
  start_date DATE,
  end_date DATE,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_representative_committees_rep_id ON representative_committees(representative_id);
CREATE INDEX IF NOT EXISTS idx_representative_committees_name ON representative_committees(committee_name);

-- ==============================================
-- 6. REPRESENTATIVE_BILLS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS representative_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id UUID REFERENCES representatives_core(id) ON DELETE CASCADE,
  bill_number TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT,
  introduced_date DATE,
  last_action_date DATE,
  role TEXT, -- 'sponsor', 'cosponsor', 'supporter'
  source TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_representative_bills_rep_id ON representative_bills(representative_id);
CREATE INDEX IF NOT EXISTS idx_representative_bills_number ON representative_bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_representative_bills_status ON representative_bills(status);

-- ==============================================
-- 7. REPRESENTATIVE_SPEECHES TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS representative_speeches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id UUID REFERENCES representatives_core(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  date TIMESTAMPTZ NOT NULL,
  location TEXT,
  source TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_representative_speeches_rep_id ON representative_speeches(representative_id);
CREATE INDEX IF NOT EXISTS idx_representative_speeches_date ON representative_speeches(date);

-- ==============================================
-- 8. REPRESENTATIVE_ACCOUNTABILITY TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS representative_accountability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id UUID REFERENCES representatives_core(id) ON DELETE CASCADE,
  statement_type TEXT NOT NULL, -- 'campaign_promise', 'floor_speech', 'press_release', 'social_media'
  statement TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,
  url TEXT,
  verification_status TEXT DEFAULT 'unverified', -- 'verified', 'unverified', 'disputed'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_representative_accountability_rep_id ON representative_accountability(representative_id);
CREATE INDEX IF NOT EXISTS idx_representative_accountability_type ON representative_accountability(statement_type);
CREATE INDEX IF NOT EXISTS idx_representative_accountability_date ON representative_accountability(date);

-- ==============================================
-- 9. DATA_QUALITY_METRICS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS data_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id UUID REFERENCES representatives_core(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  threshold_value NUMERIC,
  status TEXT NOT NULL, -- 'pass', 'fail', 'warning'
  last_calculated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_rep_id ON data_quality_metrics(representative_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_name ON data_quality_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_status ON data_quality_metrics(status);

-- ==============================================
-- 10. INGESTION_LOGS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS ingestion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingestion_type TEXT NOT NULL, -- 'comprehensive', 'state-level', 'overnight'
  status TEXT NOT NULL, -- 'started', 'completed', 'failed'
  records_processed INTEGER DEFAULT 0,
  records_successful INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ingestion_logs_type ON ingestion_logs(ingestion_type);
CREATE INDEX IF NOT EXISTS idx_ingestion_logs_status ON ingestion_logs(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_logs_start_time ON ingestion_logs(start_time);

-- ==============================================
-- 11. API_USAGE_TRACKING TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS api_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name TEXT NOT NULL, -- 'openstates', 'congress-gov', 'fec', 'google-civic', 'legiscan'
  date DATE NOT NULL,
  requests_made INTEGER DEFAULT 0,
  requests_successful INTEGER DEFAULT 0,
  requests_failed INTEGER DEFAULT 0,
  rate_limit_remaining INTEGER,
  last_request_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_api_name ON api_usage_tracking(api_name);
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_date ON api_usage_tracking(date);

-- ==============================================
-- 12. VERIFICATION
-- ==============================================

-- Check that all tables were created
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'representative_contacts',
  'representative_social_media', 
  'representative_photos',
  'representative_activity',
  'representative_committees',
  'representative_bills',
  'representative_speeches',
  'representative_accountability',
  'data_quality_metrics',
  'ingestion_logs',
  'api_usage_tracking'
)
ORDER BY tablename;
