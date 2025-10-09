-- ============================================================================
-- IMPLEMENT MISSING DATABASE TABLES
-- ============================================================================
-- 
-- This script implements the 12 missing database tables for existing systems
-- that are already built but missing their database infrastructure.
--
-- Systems Implemented:
-- 1. Analytics System (4 tables)
-- 2. Privacy System (3 tables) 
-- 3. FEC System (3 tables)
-- 4. Data Ingestion System (2 tables)
--
-- Created: January 15, 2025
-- Status: Implementation Ready
-- ============================================================================

-- ============================================================================
-- 1. ANALYTICS SYSTEM TABLES (4 tables)
-- ============================================================================

-- Analytics Events - Core event tracking
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    event_data JSONB,
    session_id VARCHAR(255),
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    country VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Sessions - User session tracking
CREATE TABLE IF NOT EXISTS analytics_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    page_views INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    country VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    landing_page TEXT,
    exit_page TEXT,
    is_bounce BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Page Views - Page view tracking
CREATE TABLE IF NOT EXISTS analytics_page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    page_url TEXT NOT NULL,
    page_title VARCHAR(500),
    page_category VARCHAR(100),
    referrer TEXT,
    time_on_page_seconds INTEGER,
    scroll_depth_percentage INTEGER,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    country VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics User Engagement - User engagement metrics
CREATE TABLE IF NOT EXISTS analytics_user_engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    engagement_date DATE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    total_page_views INTEGER DEFAULT 0,
    total_events INTEGER DEFAULT 0,
    time_on_site_seconds INTEGER DEFAULT 0,
    pages_per_session DECIMAL(5,2) DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    return_visitor BOOLEAN DEFAULT FALSE,
    engagement_score DECIMAL(5,2) DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, engagement_date)
);

-- ============================================================================
-- 2. PRIVACY SYSTEM TABLES (3 tables)
-- ============================================================================

-- Privacy Consent Records - User consent tracking (GDPR/CCPA Compliant)
CREATE TABLE IF NOT EXISTS privacy_consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL,
    consent_status VARCHAR(50) NOT NULL, -- 'granted', 'denied', 'withdrawn'
    consent_version VARCHAR(20) NOT NULL,
    consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    withdrawal_date TIMESTAMP WITH TIME ZONE,
    legal_basis VARCHAR(50) NOT NULL, -- 'consent', 'legitimate_interest', 'contract', 'legal_obligation'
    purpose TEXT NOT NULL,
    data_categories JSONB, -- Array of data categories covered by consent
    processing_activities JSONB, -- Array of processing activities
    retention_period_days INTEGER,
    third_party_sharing BOOLEAN DEFAULT FALSE,
    third_parties JSONB, -- Array of third parties
    consent_method VARCHAR(50), -- 'explicit', 'opt_in', 'opt_out', 'implied'
    consent_source VARCHAR(100), -- 'registration', 'settings', 'popup', 'email'
    ip_address INET,
    user_agent TEXT,
    consent_language VARCHAR(10) DEFAULT 'en',
    -- Legal Compliance Fields
    gdpr_compliant BOOLEAN DEFAULT TRUE,
    ccpa_compliant BOOLEAN DEFAULT TRUE,
    data_protection_officer_notified BOOLEAN DEFAULT FALSE,
    privacy_impact_assessment_id VARCHAR(100),
    legal_review_required BOOLEAN DEFAULT FALSE,
    legal_review_date TIMESTAMP WITH TIME ZONE,
    legal_review_notes TEXT,
    regulatory_requirements JSONB, -- Applicable regulations (GDPR, CCPA, etc.)
    cross_border_transfer_safeguards JSONB, -- SCCs, adequacy decisions, etc.
    data_subject_rights_implemented JSONB, -- Rights available to user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Privacy Data Requests - Data subject requests (GDPR/CCPA)
CREATE TABLE IF NOT EXISTS privacy_data_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL, -- 'access', 'rectification', 'erasure', 'portability', 'restriction'
    request_status VARCHAR(50) NOT NULL, -- 'pending', 'in_progress', 'completed', 'rejected'
    request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_date TIMESTAMP WITH TIME ZONE,
    legal_basis VARCHAR(50) NOT NULL,
    request_description TEXT,
    response_data JSONB, -- Data provided in response
    verification_method VARCHAR(50), -- 'email', 'phone', 'id_document'
    verification_status VARCHAR(50) DEFAULT 'pending',
    verification_date TIMESTAMP WITH TIME ZONE,
    processing_notes TEXT,
    legal_review_required BOOLEAN DEFAULT FALSE,
    legal_review_date TIMESTAMP WITH TIME ZONE,
    legal_review_notes TEXT,
    data_categories JSONB, -- Categories of data requested
    retention_exceptions JSONB, -- Legal exceptions to data deletion
    request_source VARCHAR(100), -- 'user_portal', 'email', 'phone', 'mail'
    assigned_to UUID REFERENCES auth.users(id),
    -- Legal Compliance Fields
    gdpr_article_applicable VARCHAR(20), -- Article 15, 16, 17, 18, 20, 21
    ccpa_section_applicable VARCHAR(20), -- Section 1798.105, 1798.110, etc.
    response_deadline TIMESTAMP WITH TIME ZONE,
    response_sent_date TIMESTAMP WITH TIME ZONE,
    response_method VARCHAR(50), -- 'email', 'portal', 'mail', 'phone'
    identity_verification_method VARCHAR(50), -- 'email', 'phone', 'id_document'
    identity_verification_status VARCHAR(50) DEFAULT 'pending',
    identity_verification_date TIMESTAMP WITH TIME ZONE,
    data_controller_contact VARCHAR(255),
    supervisory_authority_notified BOOLEAN DEFAULT FALSE,
    supervisory_authority_notification_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Privacy Audit Logs - Privacy compliance logs
CREATE TABLE IF NOT EXISTS privacy_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL, -- 'consent', 'data_access', 'data_deletion', 'data_export', 'breach'
    event_description TEXT NOT NULL,
    data_categories JSONB, -- Categories of data involved
    legal_basis VARCHAR(50),
    processing_purpose TEXT,
    data_controller VARCHAR(100) DEFAULT 'Ranked Choice Democracy',
    data_processor VARCHAR(100),
    third_parties JSONB, -- Third parties involved
    retention_period_days INTEGER,
    data_volume INTEGER, -- Number of records affected
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    compliance_status VARCHAR(50) DEFAULT 'compliant', -- 'compliant', 'non_compliant', 'under_review'
    risk_level VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    mitigation_actions JSONB, -- Actions taken to mitigate risks
    regulatory_requirements JSONB, -- Applicable regulations (GDPR, CCPA, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. FEC SYSTEM TABLES (3 tables)
-- ============================================================================

-- FEC Candidates - FEC candidate data (v2 to avoid conflicts with existing tables)
CREATE TABLE IF NOT EXISTS fec_candidates_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    office VARCHAR(50),
    party VARCHAR(100),
    state VARCHAR(2),
    district VARCHAR(10),
    incumbent_challenge_status VARCHAR(50),
    candidate_status VARCHAR(50),
    candidate_inactive VARCHAR(10),
    election_years INTEGER[],
    election_districts VARCHAR(10)[],
    first_file_date DATE,
    last_file_date DATE,
    last_f2_date DATE,
    active_through INTEGER,
    principal_committees VARCHAR(20)[],
    authorized_committees VARCHAR(20)[],
    total_receipts DECIMAL(15,2) DEFAULT 0,
    total_disbursements DECIMAL(15,2) DEFAULT 0,
    cash_on_hand DECIMAL(15,2) DEFAULT 0,
    debt DECIMAL(15,2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_source VARCHAR(50) DEFAULT 'fec_api',
    is_efiling BOOLEAN DEFAULT FALSE,
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FEC Committees - FEC committee data (v2 to avoid conflicts with existing tables)
CREATE TABLE IF NOT EXISTS fec_committees_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id VARCHAR(20) UNIQUE NOT NULL,
    committee_name VARCHAR(500) NOT NULL,
    committee_type VARCHAR(50),
    committee_designation VARCHAR(50),
    committee_organization_type VARCHAR(50),
    committee_party VARCHAR(100),
    committee_state VARCHAR(2),
    committee_district VARCHAR(10),
    treasurer_name VARCHAR(255),
    treasurer_city VARCHAR(100),
    treasurer_state VARCHAR(2),
    treasurer_zip VARCHAR(10),
    custodian_name VARCHAR(255),
    custodian_city VARCHAR(100),
    custodian_state VARCHAR(2),
    custodian_zip VARCHAR(10),
    street_1 VARCHAR(255),
    street_2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    candidate_id VARCHAR(20),
    candidate_name VARCHAR(255),
    candidate_office VARCHAR(50),
    candidate_state VARCHAR(2),
    candidate_district VARCHAR(10),
    candidate_party VARCHAR(100),
    candidate_status VARCHAR(50),
    candidate_incumbent_challenge_status VARCHAR(50),
    first_file_date DATE,
    last_file_date DATE,
    last_f1_date DATE,
    organization_type VARCHAR(50),
    organization_type_full VARCHAR(100),
    designation VARCHAR(50),
    designation_full VARCHAR(100),
    committee_type_full VARCHAR(100),
    party_full VARCHAR(100),
    filing_frequency VARCHAR(10),
    filing_frequency_full VARCHAR(50),
    cycles INTEGER[],
    total_receipts DECIMAL(15,2) DEFAULT 0,
    total_disbursements DECIMAL(15,2) DEFAULT 0,
    cash_on_hand DECIMAL(15,2) DEFAULT 0,
    debt DECIMAL(15,2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_source VARCHAR(50) DEFAULT 'fec_api',
    is_efiling BOOLEAN DEFAULT FALSE,
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FEC Filings - FEC filing records (v2 to avoid conflicts with existing tables)
CREATE TABLE IF NOT EXISTS fec_filings_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filing_id VARCHAR(50) UNIQUE NOT NULL,
    committee_id VARCHAR(20) NOT NULL,
    candidate_id VARCHAR(20),
    filing_type VARCHAR(50) NOT NULL,
    filing_form VARCHAR(20) NOT NULL,
    filing_date DATE NOT NULL,
    coverage_start_date DATE,
    coverage_end_date DATE,
    election_year INTEGER,
    election_cycle INTEGER,
    report_year INTEGER,
    report_type VARCHAR(50),
    report_type_full VARCHAR(100),
    filing_frequency VARCHAR(10),
    filing_frequency_full VARCHAR(50),
    total_receipts DECIMAL(15,2) DEFAULT 0,
    total_disbursements DECIMAL(15,2) DEFAULT 0,
    cash_on_hand DECIMAL(15,2) DEFAULT 0,
    debt DECIMAL(15,2) DEFAULT 0,
    individual_contributions DECIMAL(15,2) DEFAULT 0,
    pac_contributions DECIMAL(15,2) DEFAULT 0,
    party_contributions DECIMAL(15,2) DEFAULT 0,
    self_financing DECIMAL(15,2) DEFAULT 0,
    other_receipts DECIMAL(15,2) DEFAULT 0,
    operating_expenditures DECIMAL(15,2) DEFAULT 0,
    independent_expenditures DECIMAL(15,2) DEFAULT 0,
    coordinated_expenditures DECIMAL(15,2) DEFAULT 0,
    other_disbursements DECIMAL(15,2) DEFAULT 0,
    is_amended BOOLEAN DEFAULT FALSE,
    amendment_chain VARCHAR(50)[],
    original_filing_id VARCHAR(50),
    is_efiling BOOLEAN DEFAULT FALSE,
    is_processed BOOLEAN DEFAULT FALSE,
    processing_status VARCHAR(50) DEFAULT 'pending',
    processing_notes TEXT,
    data_source VARCHAR(50) DEFAULT 'fec_api',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. DATA INGESTION SYSTEM TABLES (2 tables)
-- ============================================================================

-- Ingestion Cursors - API ingestion cursors
CREATE TABLE IF NOT EXISTS ingestion_cursors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL,
    cursor_type VARCHAR(50) NOT NULL,
    cursor_value TEXT NOT NULL,
    cursor_metadata JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source, cursor_type)
);

-- Ingestion Logs - Ingestion process logs
CREATE TABLE IF NOT EXISTS ingestion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL,
    ingestion_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'started', 'in_progress', 'completed', 'failed', 'cancelled'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    records_processed INTEGER DEFAULT 0,
    records_successful INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    records_skipped INTEGER DEFAULT 0,
    error_message TEXT,
    error_details JSONB,
    processing_notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started_at ON analytics_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_user_id ON analytics_page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_session_id ON analytics_page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_created_at ON analytics_page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_user_engagement_user_id ON analytics_user_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_engagement_date ON analytics_user_engagement(engagement_date);

-- Privacy indexes
CREATE INDEX IF NOT EXISTS idx_privacy_consent_records_user_id ON privacy_consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_consent_records_consent_type ON privacy_consent_records(consent_type);
CREATE INDEX IF NOT EXISTS idx_privacy_consent_records_status ON privacy_consent_records(consent_status);
CREATE INDEX IF NOT EXISTS idx_privacy_data_requests_user_id ON privacy_data_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_data_requests_type ON privacy_data_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_privacy_data_requests_status ON privacy_data_requests(request_status);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_logs_user_id ON privacy_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_logs_event_type ON privacy_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_logs_timestamp ON privacy_audit_logs(event_timestamp);

-- FEC indexes (v2 tables)
CREATE INDEX IF NOT EXISTS idx_fec_candidates_v2_candidate_id ON fec_candidates_v2(candidate_id);
CREATE INDEX IF NOT EXISTS idx_fec_candidates_v2_name ON fec_candidates_v2(name);
CREATE INDEX IF NOT EXISTS idx_fec_candidates_v2_office ON fec_candidates_v2(office);
CREATE INDEX IF NOT EXISTS idx_fec_candidates_v2_state ON fec_candidates_v2(state);
CREATE INDEX IF NOT EXISTS idx_fec_committees_v2_committee_id ON fec_committees_v2(committee_id);
CREATE INDEX IF NOT EXISTS idx_fec_committees_v2_name ON fec_committees_v2(committee_name);
CREATE INDEX IF NOT EXISTS idx_fec_committees_v2_type ON fec_committees_v2(committee_type);
CREATE INDEX IF NOT EXISTS idx_fec_committees_v2_state ON fec_committees_v2(state);
CREATE INDEX IF NOT EXISTS idx_fec_filings_v2_filing_id ON fec_filings_v2(filing_id);
CREATE INDEX IF NOT EXISTS idx_fec_filings_v2_committee_id ON fec_filings_v2(committee_id);
CREATE INDEX IF NOT EXISTS idx_fec_filings_v2_candidate_id ON fec_filings_v2(candidate_id);
CREATE INDEX IF NOT EXISTS idx_fec_filings_v2_filing_date ON fec_filings_v2(filing_date);
CREATE INDEX IF NOT EXISTS idx_fec_filings_v2_type ON fec_filings_v2(filing_type);

-- Ingestion indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_cursors_source ON ingestion_cursors(source);
CREATE INDEX IF NOT EXISTS idx_ingestion_cursors_type ON ingestion_cursors(cursor_type);
CREATE INDEX IF NOT EXISTS idx_ingestion_logs_source ON ingestion_logs(source);
CREATE INDEX IF NOT EXISTS idx_ingestion_logs_type ON ingestion_logs(ingestion_type);
CREATE INDEX IF NOT EXISTS idx_ingestion_logs_status ON ingestion_logs(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_logs_started_at ON ingestion_logs(started_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_user_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fec_candidates_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE fec_committees_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE fec_filings_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_logs ENABLE ROW LEVEL SECURITY;

-- Analytics RLS policies
CREATE POLICY "Users can view their own analytics events" ON analytics_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own analytics sessions" ON analytics_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own page views" ON analytics_page_views
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own engagement data" ON analytics_user_engagement
    FOR SELECT USING (auth.uid() = user_id);

-- Privacy RLS policies
CREATE POLICY "Users can view their own consent records" ON privacy_consent_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own data requests" ON privacy_data_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own audit logs" ON privacy_audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- FEC RLS policies (public data) - v2 tables
CREATE POLICY "FEC candidates v2 are publicly readable" ON fec_candidates_v2
    FOR SELECT USING (true);

CREATE POLICY "FEC committees v2 are publicly readable" ON fec_committees_v2
    FOR SELECT USING (true);

CREATE POLICY "FEC filings v2 are publicly readable" ON fec_filings_v2
    FOR SELECT USING (true);

-- Ingestion RLS policies (admin only)
CREATE POLICY "Only admins can access ingestion cursors" ON ingestion_cursors
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can access ingestion logs" ON ingestion_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ SUCCESS: All 12 missing database tables implemented!';
    RAISE NOTICE '📊 Analytics System: 4 tables with indexes and RLS';
    RAISE NOTICE '🔒 Privacy System: 3 tables with comprehensive consent tracking';
    RAISE NOTICE '🗳️ FEC System: 3 tables (v2) with full campaign finance data';
    RAISE NOTICE '📥 Data Ingestion: 2 tables with cursor and logging support';
    RAISE NOTICE '🚀 All systems now have complete database infrastructure!';
END $$;
