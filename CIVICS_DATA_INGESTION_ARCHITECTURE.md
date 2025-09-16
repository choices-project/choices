# 🏛️ Civics Data Ingestion Architecture - Comprehensive AI Assessment

> **Date**: January 15, 2025  
> **Status**: 🚀 **MULTI-SOURCE DATA INTEGRATION SYSTEM**  
> **Vision**: Comprehensive government data ingestion for democratic equalizer platform
> **Project**: Choices Platform - Democratic Equalizer  
> **Mission**: "Citizens United broke democracy. We're fixing it."

---

## 🎯 **Executive Summary**

The Choices Platform is building a **democratic equalizer** that revolutionizes how elections work in the United States. This comprehensive civics data ingestion system is the **foundation** for breaking the duopoly through ranked choice voting, exposing "bought off" politicians, and creating true accountability in our democracy.

### **The Democratic Revolution We're Powering**

This system integrates data from multiple sources to provide:

1. **Complete candidate information** for ranked choice polls and equal platform access
2. **Campaign finance transparency** with "bought off" indicators and independence scoring
3. **Geographic electoral feeds** based on jurisdiction IDs for informed voting
4. **Real-time election data** for viral content generation and social discovery
5. **Multi-source validation** for data quality and accuracy in democratic accountability
6. **"Walk the Talk" analysis** tracking campaign promises vs. actual actions
7. **Equal representation space** where all candidates get equal voice regardless of funding

### **The Problem We're Solving**

- **Citizens United's Impact**: Unlimited corporate spending, duopoly dominance, independent candidates can't compete
- **The Democratic Crisis**: Money determines voice, corporate influence overrides constituent interests
- **Our Solution**: Equal platform access, financial transparency, accountability tracking, privacy protection

This document provides a comprehensive overview of the data ingestion architecture for AI assessment and refinement, incorporating the complete project context, existing implementations, and revolutionary vision.

---

## 🏗️ **Current Project Status & Existing Implementations**

### **✅ What's Already Built and Working**

The Choices Platform has already implemented a comprehensive foundation for the democratic equalizer:

#### **1. Complete Multi-Source Data Integration System**
- **6 API Clients** with comprehensive government data coverage
- **Congress.gov** (5,000 requests/day) - Official federal legislative data
- **Open States** (10,000 requests/day) - State legislature data  
- **FEC** (1,000 requests/hour) - Federal campaign finance data
- **OpenSecrets** (1,000 requests/day) - Enhanced financial analysis and lobbying data
- **GovTrack.us** (unlimited) - Congressional tracking and voting records
- **Google Civic** (25,000 requests/day) - Local officials and elections

#### **2. Advanced Rate Limiting & API Management**
- **Production-ready rate limiting system** respecting all API quotas
- **Intelligent caching** for API responses with configurable TTL
- **Comprehensive error handling** with retry logic and exponential backoff
- **API usage monitoring** with quota warnings and alerts
- **Good API citizenship** with proper backoff strategies

#### **3. Unified Data Orchestration**
- **UnifiedDataOrchestrator** class managing multiple data sources
- **Data quality scoring** and conflict resolution across sources
- **Source prioritization** system (Congress.gov: 100, FEC: 100, Open States: 95, etc.)
- **Comprehensive data merging** with quality metrics and completeness scoring

#### **4. Database Architecture (Supabase PostgreSQL)**
- **Complete schema** with polls, votes, webauthn_credentials, user_profiles
- **Row Level Security (RLS)** policies for privacy protection
- **WebAuthn authentication** for passwordless security
- **Trust tier system** (T0-T3) for user verification levels
- **Privacy-first design** with client-side encryption capabilities

#### **5. Campaign Finance Transparency System**
- **Real-time financial data** integration from FEC and OpenSecrets
- **"Bought off" indicators** showing corporate influence
- **Independence scoring** (0-100%) for all candidates
- **Corporate influence mapping** and industry connections
- **Revolving door tracking** and conflict of interest analysis

#### **6. Geographic Electoral Feeds**
- **Location-based feeds** showing all candidates for user's area
- **Current officials** and upcoming races
- **Complete electoral landscape** for informed voting
- **Privacy-protected** location data with client-side encryption
- **Engagement opportunities** for direct candidate interaction

### **🚧 What's Ready for Implementation**

The platform is ready to commit to comprehensive data ingestion with:

- **Production-ready API clients** with proper error handling
- **Comprehensive rate limiting** respecting all quotas
- **Unified data models** for candidates, elections, finances, voting records
- **Data quality management** with scoring and validation
- **Conflict resolution** for multi-source data merging
- **Monitoring and alerting** for system health

### **🎯 The Next Phase: Full Data Ingestion**

We're now ready to implement the comprehensive data ingestion pipeline that will:

1. **Populate the database** with complete candidate and election data
2. **Enable ranked choice voting** with comprehensive candidate profiles
3. **Power the democratic equalizer** with transparent financial data
4. **Create viral content** through social discovery and engagement
5. **Build accountability** through "walk the talk" analysis

---

## 🏗️ **System Architecture Overview**

### **Data Sources Integrated**
- ✅ **Google Civic Information API** - Representatives, elections, voting info
- ✅ **Congress.gov API** - Federal legislative data (5,000 requests/day)
- ✅ **Open States API** - State legislative data (10,000 requests/day)
- ✅ **FEC API** - Federal campaign finance data (1,000 requests/hour)
- ✅ **OpenSecrets API** - Enhanced campaign finance and lobbying (1,000 requests/day)
- ✅ **GovTrack.us API** - Congressional voting records and bills

### **Data Processing Pipeline**
- ✅ **Rate limiting system** respecting all API quotas
- ✅ **Intelligent caching** for API responses
- ✅ **Data transformation** and normalization
- ✅ **Quality validation** and conflict resolution
- ✅ **Unified data architecture** for multi-source integration
- ✅ **Monitoring and alerting** for system health

### **Database Architecture**
- ✅ **Supabase PostgreSQL** with Row Level Security
- ✅ **Unified data models** for candidates, elections, finances
- ✅ **Geographic jurisdiction** mapping
- ✅ **Campaign finance** transparency tables
- ✅ **Data quality scoring** and audit trails

---

## 📊 **Data Sources Deep Dive**

### **1. Google Civic Information API**
```typescript
interface GoogleCivicData {
  representatives: {
    officials: Official[];
    offices: Office[];
  };
  elections: {
    id: string;
    name: string;
    electionDay: string;
    ocdDivisionId: string;
  }[];
  voterInfo: {
    pollingLocations: PollingLocation[];
    contests: Contest[];
    state: StateInfo[];
  };
}

interface Official {
  name: string;
  address: Address[];
  party: string;
  phones: string[];
  urls: string[];
  photoUrl: string;
  emails: string[];
  channels: SocialChannel[];
}

interface Contest {
  type: string;
  office: string;
  candidates: Candidate[];
  level: string[];
  roles: string[];
  district: District;
}
```

**Rate Limits**: 60 requests/minute, 10,000 requests/day  
**Key Data**: Representatives, elections, voting locations, contests  
**Use Case**: Geographic electoral feeds, candidate discovery

### **2. Congress.gov API**
```typescript
interface CongressGovData {
  bills: {
    congress: number;
    billType: string;
    billNumber: number;
    title: string;
    shortTitle: string;
    introducedDate: string;
    sponsor: Sponsor;
    cosponsors: Cosponsor[];
    subjects: string[];
    summary: string;
    actions: Action[];
    votes: Vote[];
  }[];
  members: {
    bioguideId: string;
    firstName: string;
    lastName: string;
    party: string;
    state: string;
    district: string;
    chamber: string;
    terms: Term[];
    votes: VoteRecord[];
  }[];
}

interface VoteRecord {
  rollCall: string;
  question: string;
  description: string;
  vote: 'Yea' | 'Nay' | 'Present' | 'Not Voting';
  date: string;
  bill: BillReference;
}
```

**Rate Limits**: 5,000 requests/day  
**Key Data**: Federal legislation, voting records, member profiles  
**Use Case**: "Walk the Talk" analysis, voting record transparency

### **3. Open States API**
```typescript
interface OpenStatesData {
  legislators: {
    id: string;
    name: string;
    party: string;
    chamber: string;
    district: string;
    state: string;
    photoUrl: string;
    email: string;
    offices: Office[];
    sources: Source[];
    roles: Role[];
  }[];
  bills: {
    id: string;
    title: string;
    subject: string[];
    sponsors: Sponsor[];
    actions: Action[];
    votes: Vote[];
    documents: Document[];
  }[];
  committees: {
    id: string;
    name: string;
    chamber: string;
    members: CommitteeMember[];
  }[];
}
```

**Rate Limits**: 10,000 requests/day  
**Key Data**: State legislators, state bills, committee memberships  
**Use Case**: State-level candidate profiles, local election data

### **4. FEC API (Federal Election Commission)**
```typescript
interface FECData {
  candidates: {
    candidate_id: string;
    name: string;
    party: string;
    state: string;
    district: string;
    office: string;
    principal_committees: Committee[];
    total_receipts: number;
    total_disbursements: number;
    cash_on_hand: number;
  }[];
  committees: {
    committee_id: string;
    name: string;
    committee_type: string;
    designation: string;
    party: string;
    treasurer_name: string;
    total_receipts: number;
    total_disbursements: number;
    cash_on_hand: number;
  }[];
  contributions: {
    contributor_name: string;
    contributor_employer: string;
    contributor_occupation: string;
    contribution_receipt_amount: number;
    contribution_receipt_date: string;
    committee_id: string;
  }[];
}
```

**Rate Limits**: 1,000 requests/hour  
**Key Data**: Campaign finance, contributions, committee data  
**Use Case**: "Bought off" indicators, financial transparency

### **5. OpenSecrets API**
```typescript
interface OpenSecretsData {
  candidates: {
    cid: string;
    firstlast: string;
    party: string;
    office: string;
    lastname: string;
    partyid: string;
    officeid: string;
    crpico: string;
    feccandid: string;
    total: number;
    spent: number;
    cash_on_hand: number;
    debt: number;
    origin: string;
    source: string;
    last_updated: string;
  }[];
  contributions: {
    contributor: string;
    amount: number;
    date: string;
    candidate: string;
    committee: string;
    sector: string;
    industry: string;
  }[];
  lobbying: {
    client: string;
    lobbyist: string;
    amount: number;
    year: number;
    issue: string;
  }[];
}
```

**Rate Limits**: 1,000 requests/day  
**Key Data**: Enhanced campaign finance, lobbying data, industry contributions  
**Use Case**: Deep financial analysis, industry influence tracking

---

## 🏗️ **Database Architecture**

### **Current Database Schema (Supabase PostgreSQL)**

The Choices Platform already has a comprehensive database schema that supports the democratic equalizer vision:

#### **Existing Core Tables**
```sql
-- Polls table supporting ranked choice voting
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL,
  voting_method TEXT NOT NULL CHECK (voting_method IN ('single', 'multiple', 'ranked', 'approval', 'range', 'quadratic')),
  privacy_level TEXT NOT NULL DEFAULT 'public',
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'active',
  total_votes INTEGER DEFAULT 0,
  participation INTEGER DEFAULT 0,
  sponsors TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  is_mock BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}',
  
  -- Lifecycle Control
  baseline_at TIMESTAMPTZ,
  allow_post_close BOOLEAN DEFAULT false,
  locked_at TIMESTAMPTZ
);

-- Votes table with flexible vote_data JSONB
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  vote_data JSONB NOT NULL, -- Flexible for all voting methods
  verification_token VARCHAR(255),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- WebAuthn credentials for passwordless auth
CREATE TABLE webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  credential_id BYTEA NOT NULL,
  public_key BYTEA NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  transports TEXT[],
  name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- User profiles with trust tier system
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  display_name VARCHAR(255),
  bio TEXT,
  trust_tier INTEGER DEFAULT 0 CHECK (trust_tier >= 0 AND trust_tier <= 3),
  verification_status VARCHAR(50) DEFAULT 'unverified',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Civics Data Tables to Add**

The following tables need to be added to support comprehensive civics data ingestion:

### **Core Civics Tables**

#### **1. Candidates Table**
```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(100) UNIQUE NOT NULL, -- Bioguide ID, Open States ID, etc.
  name VARCHAR(255) NOT NULL,
  party VARCHAR(50),
  office VARCHAR(100) NOT NULL,
  chamber VARCHAR(50), -- 'house', 'senate', 'state_house', 'state_senate'
  state VARCHAR(2) NOT NULL,
  district VARCHAR(10),
  level VARCHAR(20) NOT NULL, -- 'federal', 'state', 'local'
  
  -- Contact Information
  email VARCHAR(255),
  phone VARCHAR(20),
  website VARCHAR(255),
  photo_url VARCHAR(500),
  
  -- Social Media
  social_media JSONB DEFAULT '{}',
  
  -- Geographic Data
  ocd_division_id VARCHAR(100),
  jurisdiction_ids TEXT[],
  
  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verification_method VARCHAR(50),
  verification_date TIMESTAMPTZ,
  
  -- Data Quality
  data_sources TEXT[] NOT NULL,
  quality_score DECIMAL(3,2) DEFAULT 0.0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_candidates_state_district (state, district),
  INDEX idx_candidates_office_level (office, level),
  INDEX idx_candidates_external_id (external_id),
  INDEX idx_candidates_verified (verified)
);
```

#### **2. Elections Table**
```sql
CREATE TABLE elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'general', 'primary', 'special', 'runoff'
  level VARCHAR(20) NOT NULL, -- 'federal', 'state', 'local'
  state VARCHAR(2) NOT NULL,
  district VARCHAR(10),
  
  -- Dates
  election_date DATE NOT NULL,
  registration_deadline DATE,
  early_voting_start DATE,
  early_voting_end DATE,
  
  -- Geographic
  ocd_division_id VARCHAR(100),
  jurisdiction_ids TEXT[],
  
  -- Status
  status VARCHAR(20) DEFAULT 'upcoming', -- 'upcoming', 'active', 'completed'
  results_available BOOLEAN DEFAULT FALSE,
  
  -- Data Quality
  data_sources TEXT[] NOT NULL,
  quality_score DECIMAL(3,2) DEFAULT 0.0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_elections_date (election_date),
  INDEX idx_elections_state_type (state, type),
  INDEX idx_elections_status (status)
);
```

#### **3. Campaign Finance Table**
```sql
CREATE TABLE campaign_finance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id),
  committee_id VARCHAR(100),
  committee_name VARCHAR(255),
  
  -- Financial Totals
  total_receipts DECIMAL(15,2) DEFAULT 0.0,
  total_disbursements DECIMAL(15,2) DEFAULT 0.0,
  cash_on_hand DECIMAL(15,2) DEFAULT 0.0,
  debt DECIMAL(15,2) DEFAULT 0.0,
  
  -- Contribution Breakdown
  individual_contributions DECIMAL(15,2) DEFAULT 0.0,
  pac_contributions DECIMAL(15,2) DEFAULT 0.0,
  party_contributions DECIMAL(15,2) DEFAULT 0.0,
  self_financing DECIMAL(15,2) DEFAULT 0.0,
  
  -- Independence Metrics
  independence_score DECIMAL(3,2) DEFAULT 0.0, -- 0-100% (higher = less "bought off")
  top_donor_percentage DECIMAL(5,2) DEFAULT 0.0, -- % from top 10 donors
  corporate_donor_percentage DECIMAL(5,2) DEFAULT 0.0,
  
  -- Data Quality
  data_sources TEXT[] NOT NULL,
  quality_score DECIMAL(3,2) DEFAULT 0.0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_campaign_finance_candidate (candidate_id),
  INDEX idx_campaign_finance_independence (independence_score),
  INDEX idx_campaign_finance_total_receipts (total_receipts)
);
```

#### **4. Contributions Table**
```sql
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id),
  committee_id VARCHAR(100),
  
  -- Contributor Information
  contributor_name VARCHAR(255) NOT NULL,
  contributor_employer VARCHAR(255),
  contributor_occupation VARCHAR(255),
  contributor_city VARCHAR(100),
  contributor_state VARCHAR(2),
  contributor_zip VARCHAR(10),
  
  -- Contribution Details
  amount DECIMAL(15,2) NOT NULL,
  contribution_date DATE NOT NULL,
  contribution_type VARCHAR(50), -- 'individual', 'pac', 'party', 'self'
  
  -- Industry Classification
  sector VARCHAR(100),
  industry VARCHAR(100),
  
  -- Data Quality
  data_sources TEXT[] NOT NULL,
  quality_score DECIMAL(3,2) DEFAULT 0.0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_contributions_candidate (candidate_id),
  INDEX idx_contributions_contributor (contributor_name),
  INDEX idx_contributions_amount (amount),
  INDEX idx_contributions_date (contribution_date),
  INDEX idx_contributions_sector (sector)
);
```

#### **5. Voting Records Table**
```sql
CREATE TABLE voting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id),
  
  -- Vote Information
  bill_id VARCHAR(100),
  bill_title VARCHAR(500),
  bill_subject VARCHAR(255),
  vote VARCHAR(20) NOT NULL, -- 'yea', 'nay', 'present', 'not_voting'
  vote_date DATE NOT NULL,
  chamber VARCHAR(50),
  
  -- Bill Details
  bill_type VARCHAR(20), -- 'house', 'senate', 'concurrent'
  bill_number VARCHAR(20),
  congress_number INTEGER,
  
  -- Context
  vote_description TEXT,
  vote_question TEXT,
  
  -- Data Quality
  data_sources TEXT[] NOT NULL,
  quality_score DECIMAL(3,2) DEFAULT 0.0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_voting_records_candidate (candidate_id),
  INDEX idx_voting_records_bill (bill_id),
  INDEX idx_voting_records_date (vote_date),
  INDEX idx_voting_records_vote (vote)
);
```

#### **6. Data Quality Audit Table**
```sql
CREATE TABLE data_quality_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  
  -- Quality Metrics
  completeness_score DECIMAL(3,2) DEFAULT 0.0,
  accuracy_score DECIMAL(3,2) DEFAULT 0.0,
  consistency_score DECIMAL(3,2) DEFAULT 0.0,
  timeliness_score DECIMAL(3,2) DEFAULT 0.0,
  overall_score DECIMAL(3,2) DEFAULT 0.0,
  
  -- Data Sources
  primary_source VARCHAR(100),
  secondary_sources TEXT[],
  conflict_resolution VARCHAR(100),
  
  -- Audit Trail
  last_validation TIMESTAMPTZ DEFAULT NOW(),
  validation_method VARCHAR(100),
  issues_found TEXT[],
  resolved_issues TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_data_quality_table (table_name),
  INDEX idx_data_quality_record (record_id),
  INDEX idx_data_quality_score (overall_score)
);
```

---

## 🚀 **Production-Ready Hardening & Compatibility**

### **Critical Last-Mile Upgrades**

Based on comprehensive AI assessment, here are the essential upgrades to make our civics ingestion system production-ready and fully compatible with our democratic equalizer platform:

#### **1. Canonical IDs & Crosswalks (Avoid Mismatched Joins)**

**Problem**: Different APIs use different IDs for the same entities, causing join failures and data inconsistencies.

**Solution**: Implement a single "golden key" system with dense crosswalks:

```sql
-- Canonical ID mapping for all entities
CREATE TABLE id_crosswalk (
  entity_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT CHECK (entity_type IN ('person','committee','bill','jurisdiction','election')),
  canonical_id TEXT NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  attrs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source, source_id)
);

CREATE INDEX ON id_crosswalk (entity_type, canonical_id);

-- Example canonical IDs:
-- Person: bioguide_id, fec_candidate_id, opensecrets_cid, govtrack_id, openstates_person_id
-- Committee: fec_committee_id, opensecrets_cmte, ein (if known)
-- Bill: normalized bill_id = "{congress}-{type}-{number}" (e.g., 118-hr-1234)
-- Geography: OCD Division ID as canonical
-- Election: {vip/election_id || source_id}+date+ocd_division_id
```

#### **2. Temporal Modeling & Redistricting (Future-Proof Joins)**

**Problem**: 2020/2030 redistricting breaks historical data joins.

**Solution**: Make districts and offices bitemporal:

```sql
-- Bitemporal office terms (redistricting-safe)
CREATE TABLE office_terms (
  person_uuid UUID REFERENCES people(uuid),
  office_uuid UUID REFERENCES offices(uuid),
  ocd_division_id TEXT,
  valid_from DATE NOT NULL,
  valid_to DATE, -- null = current
  census_cycle INT, -- e.g., 2020
  PRIMARY KEY (person_uuid, office_uuid, valid_from)
);

-- SCD-2 snapshotting for candidates (redistricting-safe)
CREATE TABLE candidates_dim (
  candidate_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  party TEXT,
  level TEXT,
  -- SCD fields
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  is_current BOOLEAN GENERATED ALWAYS AS (valid_to IS NULL) STORED
);
```

#### **3. Raw Data + Provenance (Replay Forever)**

**Problem**: Need to preserve original API data and track transformations.

**Solution**: Store verbatim payloads with full provenance:

```sql
-- Raw staging tables for each source
CREATE TABLE staging.congress_gov_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retrieved_at TIMESTAMPTZ NOT NULL,
  request_url TEXT NOT NULL,
  api_version TEXT,
  etag TEXT,
  payload JSONB NOT NULL,
  md5_hash TEXT
);

-- Provenance on every curated row
ALTER TABLE candidates ADD COLUMN provenance JSONB DEFAULT '{}';
-- Example: {"source_names": ["congress-gov", "fec"], "source_urls": [...], "retrieved_at": [...], "transform_version": "1.2.3"}
```

#### **4. FEC-Specific Hardening**

**Problem**: FEC data has unique complexities that break naive implementations.

**Solution**: Handle FEC specifics properly:

```sql
-- FEC candidate-committee relationships
CREATE TABLE fec_candidate_committee (
  fec_candidate_id TEXT,
  fec_committee_id TEXT,
  designation TEXT, -- P/A (principal/authorized)
  cycle INT,
  PRIMARY KEY (fec_candidate_id, fec_committee_id, cycle)
);

-- Ingestion cursor state (resumable jobs)
CREATE TABLE ingest_cursors (
  source TEXT PRIMARY KEY,
  cursor JSONB NOT NULL, -- e.g., {"last_index":123456, "cycle":2024}
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Normalized bill IDs (keeps Congress.gov/GovTrack aligned)
CREATE OR REPLACE FUNCTION norm_bill_id(congress INT, bill_type TEXT, number INT)
RETURNS TEXT LANGUAGE SQL IMMUTABLE AS $$
  SELECT LOWER(congress||'-'||REPLACE(bill_type,'.','')||'-'||number::TEXT)
$$;
```

#### **5. Donor/Entity Resolution (Finance Features)**

**Problem**: Same donor appears with different names/addresses across sources.

**Solution**: Pipeline: standardize → block → fuzzy match:

```sql
-- Donor entity resolution
CREATE TABLE donor_entities (
  cluster_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,
  canonical_address TEXT,
  canonical_employer TEXT,
  confidence_score DECIMAL(3,2),
  is_experimental BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link contributions to resolved entities
CREATE TABLE contributions_resolved (
  contribution_id UUID REFERENCES contributions(id),
  donor_cluster_id UUID REFERENCES donor_entities(cluster_id),
  original_name TEXT NOT NULL, -- Keep original for audit
  match_confidence DECIMAL(3,2)
);
```

#### **6. Geography You Can Join in One Line**

**Problem**: Complex geographic lookups slow down queries.

**Solution**: Precompute and index geographic relationships:

```sql
-- PostGIS + OCD/FIPS bridge
CREATE TABLE geographic_lookups (
  ocd_division_id TEXT PRIMARY KEY,
  fips_state_code TEXT,
  fips_county_code TEXT,
  geoid TEXT,
  census_cycle INT,
  congress_number INT,
  geometry GEOMETRY(POLYGON, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Precomputed lookups
CREATE TABLE zip_to_ocd (
  zip5 TEXT PRIMARY KEY,
  ocd_division_id TEXT NOT NULL,
  confidence DECIMAL(3,2)
);

CREATE TABLE latlon_to_ocd (
  lat DECIMAL(10,8),
  lon DECIMAL(11,8),
  ocd_division_id TEXT NOT NULL,
  PRIMARY KEY (lat, lon)
);

-- GIST index for fast spatial queries
CREATE INDEX ON geographic_lookups USING GIST (geometry);
```

#### **7. Data Contracts & Tests (Stop Bad Rows at the Gate)**

**Problem**: Bad data breaks downstream systems.

**Solution**: Comprehensive validation and testing:

```sql
-- Data contracts with constraints
ALTER TABLE candidates ADD CONSTRAINT valid_party 
  CHECK (party IN ('D','R','I','L','G','N','U'));

ALTER TABLE contributions ADD CONSTRAINT valid_amount 
  CHECK (amount > 0);

-- Row-level validators
CREATE OR REPLACE FUNCTION validate_state_code(state_code TEXT)
RETURNS BOOLEAN AS $$
  SELECT state_code IN ('AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC');
$$ LANGUAGE SQL IMMUTABLE;
```

#### **8. Versioning: Facts vs Snapshots**

**Problem**: Need both append-only facts and reproducible snapshots.

**Solution**: Separate fact tables from snapshot tables:

```sql
-- Facts: append-only
CREATE TABLE vote_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL,
  bill_id TEXT NOT NULL,
  vote TEXT NOT NULL,
  vote_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Snapshots: materialized rollups
CREATE TABLE candidate_finance_snapshots (
  candidate_id UUID NOT NULL,
  cycle INT NOT NULL,
  taken_at TIMESTAMPTZ NOT NULL,
  total_raised DECIMAL(15,2),
  total_spent DECIMAL(15,2),
  independence_score DECIMAL(3,2),
  checksum TEXT, -- For reproducibility
  PRIMARY KEY (candidate_id, cycle, taken_at)
);
```

#### **9. Licensing/ToS Hygiene**

**Problem**: Need to track attribution and usage restrictions.

**Solution**: License tracking system:

```sql
CREATE TABLE data_licenses (
  license_key TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  attribution_text TEXT NOT NULL,
  display_requirements TEXT,
  cache_ttl_seconds INT,
  usage_restrictions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link every row to its license
ALTER TABLE candidates ADD COLUMN license_key TEXT REFERENCES data_licenses(license_key);
```

#### **10. PII Minimization & Display Policy**

**Problem**: Balance useful data with privacy protection.

**Solution**: Hash sensitive data, display safe data:

```sql
-- Hash sensitive PII, keep useful geographic data
CREATE TABLE contributions_private (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL,
  donor_name_hash TEXT, -- Hashed for privacy
  donor_city TEXT, -- Safe to display
  donor_state TEXT, -- Safe to display
  donor_zip5 TEXT, -- Safe to display
  amount DECIMAL(15,2) NOT NULL,
  contribution_date DATE NOT NULL,
  retention_until DATE -- Auto-delete after period
);
```

#### **11. Scheduling/Rate-Limit Strategy That Scales**

**Problem**: Need efficient, resumable data ingestion.

**Solution**: Queue-based system with proper rate limiting:

```typescript
// Queue engine with idempotent tasks
interface IngestTask {
  id: string;
  source: string;
  params: Record<string, any>;
  window: string; // e.g., "2024-01-01:2024-01-31"
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
  maxRetries: number;
}

// Cold backfill: big batches off-hours
// Warm updates: incremental with jittered spacing
// Respect ETag/If-Modified-Since to save quota
```

#### **12. Observability You'll Actually Use**

**Problem**: Need actionable monitoring, not just metrics.

**Solution**: Focus on data health and system reliability:

```sql
-- Data health monitoring
CREATE VIEW data_health_dashboard AS
SELECT 
  'candidates' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE quality_score >= 0.8) as high_quality,
  COUNT(*) FILTER (WHERE last_updated < NOW() - INTERVAL '7 days') as stale,
  AVG(quality_score) as avg_quality
FROM candidates
UNION ALL
SELECT 
  'contributions' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE amount > 0) as valid_amounts,
  COUNT(*) FILTER (WHERE contribution_date < CURRENT_DATE - INTERVAL '30 days') as recent,
  AVG(amount) as avg_amount
FROM contributions;

-- Per-source monitoring
CREATE TABLE source_health_metrics (
  source TEXT NOT NULL,
  metric_date DATE NOT NULL,
  success_rate DECIMAL(5,2),
  p95_latency_ms INT,
  quota_used_percent DECIMAL(5,2),
  stale_records_count INT,
  schema_drift_alerts INT,
  PRIMARY KEY (source, metric_date)
);
```

### **"Bought-Off" Score Compatibility**

**Critical**: Publish the exact formula and data sources:

```sql
-- Transparent "bought-off" scoring
CREATE TABLE independence_score_methodology (
  version TEXT PRIMARY KEY,
  formula TEXT NOT NULL, -- Exact calculation
  data_sources TEXT[] NOT NULL,
  confidence_interval DECIMAL(3,2),
  experimental BOOLEAN DEFAULT TRUE,
  methodology_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example formula documentation:
-- independence_score = 100 - (pac_percentage * 0.4 + top10_donor_percentage * 0.3 + corporate_percentage * 0.3)
-- Data sources: FEC Schedule A, OpenSecrets industry codes, manual verification
-- Confidence: ±5% for candidates with >$100k raised
```

---

## 🔧 **Existing Integration Implementations**

### **Production-Ready API Clients**

The platform has already implemented comprehensive API clients with proper error handling, rate limiting, and data transformation:

#### **1. Congress.gov API Client** (`/web/lib/integrations/congress-gov/`)
```typescript
// Complete implementation with:
- CongressGovClient class with full API coverage
- Comprehensive TypeScript interfaces for all data types
- Rate limiting (5,000 requests/day)
- Error handling with retry logic
- Data transformation and validation
- Usage metrics and monitoring

// Key Features:
- Member data retrieval (bioguideId, fullName, party, state, district)
- Bill information (congress, billId, title, sponsor, subjects)
- Voting records (rollCall, question, result, date)
- Pagination support with proper API response handling
```

#### **2. Google Civic Information API Client** (`/web/lib/integrations/google-civic/`)
```typescript
// Production-ready implementation with:
- GoogleCivicClient class with comprehensive coverage
- Address lookup and representative discovery
- Election information and polling locations
- Rate limiting (25,000 requests/day)
- Proper error handling and validation
- Data transformation for unified format

// Key Features:
- Representative lookup by address
- Office and division mapping
- Contact information (phones, emails, websites)
- Social media channels integration
- Photo URLs and official verification
```

#### **3. Unified Data Orchestrator** (`/web/lib/integrations/unified-orchestrator.ts`)
```typescript
// Advanced orchestration system with:
- UnifiedDataOrchestrator class managing all sources
- Data quality scoring and conflict resolution
- Source prioritization (Congress.gov: 100, FEC: 100, etc.)
- Comprehensive data merging with quality metrics
- API usage monitoring across all sources

// Key Features:
- UnifiedRepresentative interface for consistent data
- UnifiedVote interface for voting records
- UnifiedCampaignFinance interface for financial data
- Data quality calculation and scoring
- Multi-source data merging with conflict resolution
```

#### **4. Advanced Rate Limiting System** (`/web/lib/integrations/rate-limiting.ts`)
```typescript
// Comprehensive rate limiting with:
- RateLimiter class with configurable limits
- Per-API rate limit configurations
- Usage monitoring and quota warnings
- Exponential backoff for rate limit errors
- Good API citizenship practices

// Rate Limits Implemented:
- Google Civic: 25,000/day, 1,000/hour, 60/minute
- Congress.gov: 5,000/day, 1,800/hour, 30/minute
- Open States: 10,000/day, 3,000/hour, 50/minute
- ProPublica: 1,000/hour, 15/minute
```

#### **5. Caching and Monitoring** (`/web/lib/integrations/`)
```typescript
// Production-ready infrastructure:
- ApiResponseCache with configurable TTL
- IntegrationMonitor with health checks
- Comprehensive error handling and logging
- API usage metrics and alerting
- Cache statistics and performance monitoring
```

### **Integration Status Summary**

| API Source | Status | Rate Limits | Coverage | Quality |
|------------|--------|-------------|----------|---------|
| Congress.gov | ✅ Production Ready | 5,000/day | Federal legislative data | High |
| Google Civic | ✅ Production Ready | 25,000/day | Representatives, elections | High |
| Open States | ✅ Production Ready | 10,000/day | State legislative data | High |
| FEC | ✅ Production Ready | 1,000/hour | Campaign finance | High |
| OpenSecrets | ✅ Production Ready | 1,000/day | Enhanced financial data | High |
| GovTrack | ✅ Production Ready | Unlimited | Congressional tracking | High |

### **Data Quality & Validation**

The existing system includes comprehensive data quality management:

- **Quality Scoring**: 0-100% completeness and accuracy metrics
- **Source Prioritization**: Hierarchical data source reliability
- **Conflict Resolution**: Multi-source data merging with quality-based decisions
- **Validation Rules**: Comprehensive field validation and data integrity checks
- **Audit Trails**: Complete tracking of data sources and quality metrics

---

## 🔄 **Data Ingestion Pipeline**

### **1. Rate Limiting System**
```typescript
interface RateLimiter {
  apiName: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  currentUsage: {
    requestsThisMinute: number;
    requestsThisHour: number;
    requestsToday: number;
    nextResetTime: Date;
  };
}

class ApiUsageMonitor {
  private rateLimiters: Map<string, RateLimiter> = new Map();
  
  constructor() {
    this.rateLimiters.set('google-civic', {
      apiName: 'google-civic',
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      requestsPerDay: 10000,
      currentUsage: { /* ... */ }
    });
    
    this.rateLimiters.set('congress-gov', {
      apiName: 'congress-gov',
      requestsPerMinute: 100,
      requestsPerHour: 6000,
      requestsPerDay: 5000,
      currentUsage: { /* ... */ }
    });
    
    // ... other APIs
  }
  
  async checkRateLimit(apiName: string): Promise<boolean> {
    const limiter = this.rateLimiters.get(apiName);
    if (!limiter) return false;
    
    const now = new Date();
    const usage = limiter.currentUsage;
    
    // Check minute limit
    if (usage.requestsThisMinute >= limiter.requestsPerMinute) {
      return false;
    }
    
    // Check hour limit
    if (usage.requestsThisHour >= limiter.requestsPerHour) {
      return false;
    }
    
    // Check day limit
    if (usage.requestsToday >= limiter.requestsPerDay) {
      return false;
    }
    
    return true;
  }
}
```

### **2. Data Transformation Pipeline**
```typescript
interface DataTransformer {
  transformCandidates(rawData: any[], source: string): Candidate[];
  transformElections(rawData: any[], source: string): Election[];
  transformCampaignFinance(rawData: any[], source: string): CampaignFinance[];
  transformVotingRecords(rawData: any[], source: string): VotingRecord[];
}

class UnifiedDataTransformer implements DataTransformer {
  transformCandidates(rawData: any[], source: string): Candidate[] {
    switch (source) {
      case 'google-civic':
        return this.transformGoogleCivicCandidates(rawData);
      case 'congress-gov':
        return this.transformCongressGovCandidates(rawData);
      case 'open-states':
        return this.transformOpenStatesCandidates(rawData);
      default:
        throw new Error(`Unknown source: ${source}`);
    }
  }
  
  private transformGoogleCivicCandidates(data: any[]): Candidate[] {
    return data.map(official => ({
      external_id: official.id || `google-civic-${official.name}`,
      name: official.name,
      party: official.party,
      office: official.office,
      chamber: this.determineChamber(official.office),
      state: this.extractState(official.address),
      district: this.extractDistrict(official.office),
      level: this.determineLevel(official.office),
      email: official.emails?.[0],
      phone: official.phones?.[0],
      website: official.urls?.[0],
      photo_url: official.photoUrl,
      social_media: this.extractSocialMedia(official.channels),
      ocd_division_id: official.ocdDivisionId,
      data_sources: ['google-civic'],
      quality_score: this.calculateQualityScore(official)
    }));
  }
}
```

### **3. Data Validation System**
```typescript
interface DataValidator {
  validateCandidate(candidate: Candidate): ValidationResult;
  validateElection(election: Election): ValidationResult;
  validateCampaignFinance(finance: CampaignFinance): ValidationResult;
}

interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  suggestions: string[];
}

interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestedFix?: string;
}

class ComprehensiveValidator implements DataValidator {
  validateCandidate(candidate: Candidate): ValidationResult {
    const issues: ValidationIssue[] = [];
    let score = 100;
    
    // Required fields
    if (!candidate.name) {
      issues.push({
        field: 'name',
        severity: 'error',
        message: 'Candidate name is required'
      });
      score -= 30;
    }
    
    // Email validation
    if (candidate.email && !this.isValidEmail(candidate.email)) {
      issues.push({
        field: 'email',
        severity: 'warning',
        message: 'Invalid email format',
        suggestedFix: 'Verify email address format'
      });
      score -= 5;
    }
    
    // Phone validation
    if (candidate.phone && !this.isValidPhone(candidate.phone)) {
      issues.push({
        field: 'phone',
        severity: 'warning',
        message: 'Invalid phone format',
        suggestedFix: 'Verify phone number format'
      });
      score -= 5;
    }
    
    // Website validation
    if (candidate.website && !this.isValidUrl(candidate.website)) {
      issues.push({
        field: 'website',
        severity: 'warning',
        message: 'Invalid website URL',
        suggestedFix: 'Verify website URL format'
      });
      score -= 5;
    }
    
    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      score: Math.max(0, score),
      issues,
      suggestions: this.generateSuggestions(issues)
    };
  }
}
```

### **4. Conflict Resolution System**
```typescript
interface ConflictResolution {
  resolveCandidateConflicts(candidates: Candidate[]): Candidate;
  resolveElectionConflicts(elections: Election[]): Election;
  resolveCampaignFinanceConflicts(finances: CampaignFinance[]): CampaignFinance;
}

class DataConflictResolver implements ConflictResolution {
  resolveCandidateConflicts(candidates: Candidate[]): Candidate {
    if (candidates.length === 1) return candidates[0];
    
    // Sort by data quality score
    const sorted = candidates.sort((a, b) => b.quality_score - a.quality_score);
    const primary = sorted[0];
    
    // Merge data from other sources
    const merged = { ...primary };
    
    for (let i = 1; i < sorted.length; i++) {
      const candidate = sorted[i];
      
      // Fill in missing data
      if (!merged.email && candidate.email) {
        merged.email = candidate.email;
      }
      if (!merged.phone && candidate.phone) {
        merged.phone = candidate.phone;
      }
      if (!merged.website && candidate.website) {
        merged.website = candidate.website;
      }
      if (!merged.photo_url && candidate.photo_url) {
        merged.photo_url = candidate.photo_url;
      }
      
      // Merge social media
      merged.social_media = { ...merged.social_media, ...candidate.social_media };
      
      // Add data source
      merged.data_sources = [...new Set([...merged.data_sources, ...candidate.data_sources])];
    }
    
    // Recalculate quality score
    merged.quality_score = this.calculateMergedQualityScore(merged);
    
    return merged;
  }
}
```

---

## 🚀 **Ingestion Orchestration**

### **1. Scheduled Ingestion Jobs**
```typescript
interface IngestionJob {
  id: string;
  name: string;
  schedule: string; // Cron expression
  dataSource: string;
  priority: 'high' | 'medium' | 'low';
  lastRun: Date;
  nextRun: Date;
  status: 'active' | 'paused' | 'error';
}

class IngestionOrchestrator {
  private jobs: Map<string, IngestionJob> = new Map();
  
  constructor() {
    this.initializeJobs();
  }
  
  private initializeJobs() {
    // High priority - Real-time data
    this.jobs.set('google-civic-reps', {
      id: 'google-civic-reps',
      name: 'Google Civic Representatives',
      schedule: '0 */6 * * *', // Every 6 hours
      dataSource: 'google-civic',
      priority: 'high',
      lastRun: new Date(),
      nextRun: new Date(Date.now() + 6 * 60 * 60 * 1000),
      status: 'active'
    });
    
    // Medium priority - Legislative data
    this.jobs.set('congress-gov-members', {
      id: 'congress-gov-members',
      name: 'Congress.gov Members',
      schedule: '0 2 * * *', // Daily at 2 AM
      dataSource: 'congress-gov',
      priority: 'medium',
      lastRun: new Date(),
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'active'
    });
    
    // Low priority - Historical data
    this.jobs.set('fec-finance', {
      id: 'fec-finance',
      name: 'FEC Campaign Finance',
      schedule: '0 3 * * 0', // Weekly on Sunday at 3 AM
      dataSource: 'fec',
      priority: 'low',
      lastRun: new Date(),
      nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'active'
    });
  }
  
  async runJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);
    
    try {
      job.status = 'active';
      job.lastRun = new Date();
      
      await this.executeIngestion(job);
      
      // Schedule next run
      job.nextRun = this.calculateNextRun(job.schedule);
      job.status = 'active';
      
    } catch (error) {
      job.status = 'error';
      console.error(`Job ${jobId} failed:`, error);
    }
  }
}
```

### **2. Real-time Data Updates**
```typescript
interface RealTimeUpdate {
  type: 'candidate' | 'election' | 'finance' | 'vote';
  action: 'create' | 'update' | 'delete';
  data: any;
  source: string;
  timestamp: Date;
}

class RealTimeDataProcessor {
  private subscribers: Map<string, (update: RealTimeUpdate) => void> = new Map();
  
  async processUpdate(update: RealTimeUpdate): Promise<void> {
    // Validate update
    const validation = await this.validateUpdate(update);
    if (!validation.isValid) {
      console.error('Invalid update:', validation.errors);
      return;
    }
    
    // Process update
    switch (update.type) {
      case 'candidate':
        await this.processCandidateUpdate(update);
        break;
      case 'election':
        await this.processElectionUpdate(update);
        break;
      case 'finance':
        await this.processFinanceUpdate(update);
        break;
      case 'vote':
        await this.processVoteUpdate(update);
        break;
    }
    
    // Notify subscribers
    this.notifySubscribers(update);
  }
  
  private async processCandidateUpdate(update: RealTimeUpdate): Promise<void> {
    const candidate = update.data as Candidate;
    
    // Check if candidate exists
    const existing = await this.findCandidate(candidate.external_id);
    
    if (existing) {
      // Update existing candidate
      await this.updateCandidate(existing.id, candidate);
    } else {
      // Create new candidate
      await this.createCandidate(candidate);
    }
  }
}
```

---

## 📊 **Data Quality Management**

### **1. Quality Scoring System**
```typescript
interface QualityMetrics {
  completeness: number; // 0-100
  accuracy: number; // 0-100
  consistency: number; // 0-100
  timeliness: number; // 0-100
  overall: number; // 0-100
}

class QualityScorer {
  calculateCompleteness(data: any, requiredFields: string[]): number {
    const presentFields = requiredFields.filter(field => 
      data[field] !== null && data[field] !== undefined && data[field] !== ''
    );
    return (presentFields.length / requiredFields.length) * 100;
  }
  
  calculateAccuracy(data: any, validationRules: ValidationRule[]): number {
    let correctFields = 0;
    let totalFields = validationRules.length;
    
    for (const rule of validationRules) {
      if (this.validateField(data[rule.field], rule)) {
        correctFields++;
      }
    }
    
    return (correctFields / totalFields) * 100;
  }
  
  calculateConsistency(data: any, crossReferences: CrossReference[]): number {
    let consistentFields = 0;
    let totalFields = crossReferences.length;
    
    for (const ref of crossReferences) {
      if (this.checkConsistency(data, ref)) {
        consistentFields++;
      }
    }
    
    return (consistentFields / totalFields) * 100;
  }
  
  calculateTimeliness(data: any, maxAge: number): number {
    const age = Date.now() - new Date(data.last_updated).getTime();
    const ageInDays = age / (1000 * 60 * 60 * 24);
    
    if (ageInDays <= maxAge) {
      return 100;
    } else {
      return Math.max(0, 100 - (ageInDays - maxAge) * 10);
    }
  }
}
```

### **2. Data Monitoring Dashboard**
```typescript
interface DataMonitoringMetrics {
  totalRecords: number;
  qualityDistribution: {
    excellent: number; // 90-100
    good: number; // 70-89
    fair: number; // 50-69
    poor: number; // 0-49
  };
  sourceReliability: Record<string, number>;
  lastUpdateTimes: Record<string, Date>;
  errorRates: Record<string, number>;
}

class DataMonitoringDashboard {
  async getMetrics(): Promise<DataMonitoringMetrics> {
    const [
      totalRecords,
      qualityDistribution,
      sourceReliability,
      lastUpdateTimes,
      errorRates
    ] = await Promise.all([
      this.getTotalRecords(),
      this.getQualityDistribution(),
      this.getSourceReliability(),
      this.getLastUpdateTimes(),
      this.getErrorRates()
    ]);
    
    return {
      totalRecords,
      qualityDistribution,
      sourceReliability,
      lastUpdateTimes,
      errorRates
    };
  }
  
  private async getQualityDistribution(): Promise<any> {
    const query = `
      SELECT 
        CASE 
          WHEN overall_score >= 90 THEN 'excellent'
          WHEN overall_score >= 70 THEN 'good'
          WHEN overall_score >= 50 THEN 'fair'
          ELSE 'poor'
        END as quality_level,
        COUNT(*) as count
      FROM data_quality_audit
      GROUP BY quality_level
    `;
    
    const result = await this.db.query(query);
    return result.rows.reduce((acc, row) => {
      acc[row.quality_level] = parseInt(row.count);
      return acc;
    }, {});
  }
}
```

---

## 🎯 **Integration with Ranked Choice System**

### **1. Candidate Profile Generation**
```typescript
interface CandidateProfile {
  id: string;
  name: string;
  party: string;
  office: string;
  level: string;
  
  // Basic Information
  bio: string;
  photo_url: string;
  website: string;
  social_media: Record<string, string>;
  
  // Policy Positions (derived from voting records)
  policy_positions: PolicyPosition[];
  
  // Campaign Finance
  campaign_finance: {
    total_raised: number;
    independence_score: number;
    top_donors: string[];
    industry_breakdown: Record<string, number>;
  };
  
  // Voting Record
  voting_record: {
    total_votes: number;
    party_line_votes: number;
    bipartisan_votes: number;
    key_votes: KeyVote[];
  };
  
  // Verification
  verified: boolean;
  verification_method: string;
}

class CandidateProfileGenerator {
  async generateProfile(candidateId: string): Promise<CandidateProfile> {
    const [
      candidate,
      campaignFinance,
      votingRecords,
      contributions
    ] = await Promise.all([
      this.getCandidate(candidateId),
      this.getCampaignFinance(candidateId),
      this.getVotingRecords(candidateId),
      this.getContributions(candidateId)
    ]);
    
    return {
      id: candidate.id,
      name: candidate.name,
      party: candidate.party,
      office: candidate.office,
      level: candidate.level,
      bio: this.generateBio(candidate, votingRecords),
      photo_url: candidate.photo_url,
      website: candidate.website,
      social_media: candidate.social_media,
      policy_positions: this.derivePolicyPositions(votingRecords),
      campaign_finance: {
        total_raised: campaignFinance.total_receipts,
        independence_score: campaignFinance.independence_score,
        top_donors: this.getTopDonors(contributions),
        industry_breakdown: this.getIndustryBreakdown(contributions)
      },
      voting_record: {
        total_votes: votingRecords.length,
        party_line_votes: this.calculatePartyLineVotes(votingRecords),
        bipartisan_votes: this.calculateBipartisanVotes(votingRecords),
        key_votes: this.identifyKeyVotes(votingRecords)
      },
      verified: candidate.verified,
      verification_method: candidate.verification_method
    };
  }
}
```

### **2. Election Data Integration**
```typescript
interface ElectionData {
  id: string;
  name: string;
  type: string;
  date: Date;
  level: string;
  state: string;
  district?: string;
  
  // Candidates
  candidates: CandidateProfile[];
  
  // Voting Information
  voting_info: {
    registration_deadline: Date;
    early_voting_start: Date;
    early_voting_end: Date;
    polling_locations: PollingLocation[];
  };
  
  // Ranked Choice Configuration
  ranked_choice: {
    enabled: boolean;
    max_rankings: number;
    elimination_rounds: number;
  };
}

class ElectionDataIntegrator {
  async getElectionData(electionId: string): Promise<ElectionData> {
    const [
      election,
      candidates,
      votingInfo
    ] = await Promise.all([
      this.getElection(electionId),
      this.getElectionCandidates(electionId),
      this.getVotingInfo(electionId)
    ]);
    
    // Generate candidate profiles
    const candidateProfiles = await Promise.all(
      candidates.map(candidate => 
        this.candidateProfileGenerator.generateProfile(candidate.id)
      )
    );
    
    return {
      id: election.id,
      name: election.name,
      type: election.type,
      date: election.election_date,
      level: election.level,
      state: election.state,
      district: election.district,
      candidates: candidateProfiles,
      voting_info: votingInfo,
      ranked_choice: {
        enabled: this.isRankedChoiceEnabled(election),
        max_rankings: this.getMaxRankings(election),
        elimination_rounds: this.getEliminationRounds(election)
      }
    };
  }
}
```

---

## 🚀 **Implementation Roadmap**

### **Next 5 High-Impact, Low-Friction Tickets**

Based on the AI assessment, here are the immediate next steps to make our civics ingestion system production-ready:

#### **Ticket 1: Add ID Crosswalk + Backfill for All Existing Entities**
**Priority**: Critical | **Effort**: Medium | **Impact**: High

```sql
-- Implementation steps:
1. Create id_crosswalk table with proper constraints
2. Backfill existing people/committees/bills with canonical IDs
3. Update all existing queries to use canonical IDs
4. Add crosswalk maintenance procedures

-- Success criteria:
- All entities have canonical IDs
- Zero join failures due to ID mismatches
- Crosswalk table populated for all existing data
```

#### **Ticket 2: PostGIS + OCD/FIPS Bridge with Redistricting-Aware Lookups**
**Priority**: High | **Effort**: Medium | **Impact**: High

```sql
-- Implementation steps:
1. Enable PostGIS extension in Supabase
2. Create geographic_lookups table with geometry
3. Populate zip_to_ocd and latlon_to_ocd lookup tables
4. Add GIST indexes for fast spatial queries
5. Create redistricting-aware district resolution functions

-- Success criteria:
- Geographic lookups complete in <100ms
- Redistricting data preserved historically
- Spatial queries optimized with proper indexes
```

#### **Ticket 3: FEC Pipeline v1 - Cycles, Cursors, E-file vs Processed Labeling**
**Priority**: High | **Effort**: High | **Impact**: High

```typescript
// Implementation steps:
1. Implement FEC cycle-based partitioning
2. Add last_index cursor tracking for resumable ingestion
3. Distinguish e-filing (preliminary) vs processed (final) data
4. Create FEC candidate-committee relationship mapping
5. Add FEC-specific error handling and retry logic

// Success criteria:
- FEC data ingestion is resumable and reliable
- E-filing vs processed data clearly labeled in UI
- Candidate-committee relationships properly mapped
```

#### **Ticket 4: dbt Tests - Uniqueness, Accepted Values, Freshness SLAs**
**Priority**: Medium | **Effort**: Low | **Impact**: High

```yaml
# Implementation steps:
1. Create dbt project structure
2. Add uniqueness tests for all primary keys
3. Add accepted values tests for enums (party, vote, etc.)
4. Add freshness SLAs (FEC ≤7 days, Congress votes ≤24h)
5. Add foreign key existence tests
6. Set up dbt Cloud or GitHub Actions for CI/CD

# Success criteria:
- All data quality issues caught at ingestion time
- Automated testing prevents bad data from reaching production
- Freshness SLAs monitored and alerted
```

#### **Ticket 5: Provenance Columns + Raw Landing Tables + Checksums**
**Priority**: Medium | **Effort**: Medium | **Impact**: Medium

```sql
-- Implementation steps:
1. Create staging schema with raw tables for each source
2. Add provenance JSONB columns to all curated tables
3. Implement checksum generation for data integrity
4. Add ETag/If-Modified-Since support for API efficiency
5. Create data lineage tracking system

-- Success criteria:
- All API responses preserved in raw format
- Complete data lineage from source to curated table
- Data integrity verified with checksums
```

### **Phase 1: Core Data Ingestion (Weeks 1-4)**
- [ ] **Set up database schema** with all core tables and hardening features
- [ ] **Implement rate limiting system** for all APIs with proper backoff
- [ ] **Build data transformation pipeline** for each source with validation
- [ ] **Create data validation system** with quality scoring and constraints
- [ ] **Set up monitoring and alerting** for system health and data quality

### **Phase 2: Data Quality & Conflict Resolution (Weeks 5-8)**
- [ ] **Implement conflict resolution** for multi-source data with canonical IDs
- [ ] **Build quality scoring system** with comprehensive metrics and thresholds
- [ ] **Create data monitoring dashboard** for admin oversight and health checks
- [ ] **Set up automated data cleaning** and validation with dbt tests
- [ ] **Implement data audit trails** for compliance and reproducibility

### **Phase 3: Real-time Updates (Weeks 9-12)**
- [ ] **Build real-time data processor** for live updates with queue management
- [ ] **Implement WebSocket notifications** for data changes and alerts
- [ ] **Create scheduled ingestion jobs** with cron scheduling and cursor tracking
- [ ] **Set up data synchronization** between sources with conflict resolution
- [ ] **Build data backup and recovery** systems with point-in-time recovery

### **Phase 4: Integration with Ranked Choice (Weeks 13-16)**
- [ ] **Generate candidate profiles** from ingested data with quality scoring
- [ ] **Integrate election data** with ranked choice polls and geographic feeds
- [ ] **Build policy position analysis** from voting records and statements
- [ ] **Create campaign finance transparency** features with "bought off" indicators
- [ ] **Implement data-driven insights** for viral content and social discovery

---

## 📋 **Implementation Summary & Next Steps**

### **What We Have Built**
✅ **Complete multi-source data integration** with 6 production-ready API clients  
✅ **Advanced rate limiting and caching** systems respecting all API quotas  
✅ **Unified data orchestration** with quality scoring and conflict resolution  
✅ **Privacy-first database architecture** with WebAuthn authentication and RLS  
✅ **Comprehensive error handling** and monitoring across all integrations  

### **What We're Ready to Implement**
🚀 **Production-ready civics data ingestion** with the 12 critical hardening features  
🚀 **Canonical ID system** preventing join failures and data inconsistencies  
🚀 **Temporal modeling** future-proofing against redistricting changes  
🚀 **FEC-specific pipeline** handling cycles, cursors, and e-filing vs processed data  
🚀 **Geographic optimization** with PostGIS and precomputed lookups  

### **The Democratic Revolution We're Powering**
🗳️ **Equal platform access** for all candidates regardless of funding  
💰 **Campaign finance transparency** exposing "bought off" politicians  
📊 **"Walk the Talk" accountability** tracking promises vs. actions  
🌍 **Geographic electoral feeds** providing complete candidate landscape  
🔒 **Privacy protection** while enabling democratic participation  

### **Ready for Production Deployment**
The platform is now ready to commit to comprehensive civics data ingestion that will:

1. **Populate the database** with complete candidate and election data
2. **Enable ranked choice voting** with comprehensive candidate profiles  
3. **Power the democratic equalizer** with transparent financial data
4. **Create viral content** through social discovery and engagement
5. **Build accountability** through "walk the talk" analysis
6. **Break the duopoly** through equal platform access and ranked choice voting

---

## 📈 **Success Metrics**

### **1. Data Quality Metrics**
- **Completeness rate** - % of records with all required fields
- **Accuracy rate** - % of records passing validation rules
- **Consistency rate** - % of records consistent across sources
- **Timeliness rate** - % of records updated within SLA

### **2. System Performance Metrics**
- **Ingestion throughput** - Records processed per hour
- **API utilization** - % of rate limits used
- **Error rates** - % of failed ingestion attempts
- **Data freshness** - Average age of data by source

### **3. Business Impact Metrics**
- **Candidate coverage** - % of elections with complete candidate data
- **Financial transparency** - % of candidates with campaign finance data
- **Voting record coverage** - % of candidates with voting records
- **User engagement** - % of users interacting with candidate profiles

---

## 🎯 **Key Questions for AI Assessment**

### **1. Database Architecture**
- Is the database schema optimized for the ranked choice voting system?
- How can we improve query performance for large datasets?
- What are the best practices for data partitioning and indexing?
- How should we handle data versioning and historical records?

### **2. Data Ingestion Pipeline**
- Is the rate limiting system robust enough for production scale?
- How can we optimize the data transformation pipeline for performance?
- What are the best practices for handling API failures and retries?
- How should we implement data deduplication across sources?

### **3. Data Quality Management**
- Is the quality scoring system comprehensive enough?
- How can we improve conflict resolution for complex data conflicts?
- What are the best practices for data validation and cleaning?
- How should we handle data quality issues in real-time?

### **4. Integration with Ranked Choice**
- How can we optimize candidate profile generation for performance?
- What are the best practices for policy position analysis?
- How should we handle missing or incomplete data in profiles?
- What are the security considerations for sensitive financial data?

### **5. Scalability and Performance**
- How can we scale the system to handle millions of records?
- What are the best practices for real-time data processing?
- How should we implement caching for frequently accessed data?
- What are the monitoring and alerting best practices?

---

## 🚨 **Potential Challenges & Solutions**

### **1. Data Quality Challenges**
- **Challenge**: Inconsistent data formats across sources
- **Solution**: Robust transformation pipeline with validation rules

- **Challenge**: Missing or incomplete data
- **Solution**: Multi-source data merging with quality scoring

- **Challenge**: Data conflicts between sources
- **Solution**: Conflict resolution system with source prioritization

### **2. Performance Challenges**
- **Challenge**: Large datasets affecting query performance
- **Solution**: Database partitioning and optimized indexing

- **Challenge**: Real-time updates causing system load
- **Solution**: Asynchronous processing with queue management

- **Challenge**: API rate limits slowing ingestion
- **Solution**: Intelligent scheduling and request optimization

### **3. Integration Challenges**
- **Challenge**: Complex data relationships
- **Solution**: Normalized database design with proper foreign keys

- **Challenge**: Real-time synchronization across sources
- **Solution**: Event-driven architecture with WebSocket notifications

- **Challenge**: Data privacy and security
- **Solution**: Row-level security and data encryption

---

## 🎉 **Vision for Impact**

### **Short-term (6 months)**
- **Complete data ingestion** for all major elections
- **High-quality candidate profiles** with comprehensive information
- **Real-time updates** for election data and campaign finance
- **Data-driven insights** for ranked choice polls

### **Medium-term (1-2 years)**
- **National coverage** for all federal and state elections
- **Advanced analytics** for policy position analysis
- **Predictive modeling** for election outcomes
- **API access** for third-party applications

### **Long-term (3-5 years)**
- **Global expansion** to other democracies
- **Machine learning** for data quality improvement
- **Real-time fact-checking** integration
- **Blockchain verification** for campaign finance data

---

## 💡 **Additional Features to Consider**

### **1. Advanced Analytics**
- **Predictive modeling** - Who will win based on current data?
- **Sentiment analysis** - How do people feel about each candidate?
- **Trend analysis** - How are preferences changing over time?
- **Comparative analysis** - How do results compare across regions?

### **2. Data Visualization**
- **Interactive dashboards** - Real-time data visualization
- **Geographic mapping** - Election data by location
- **Timeline views** - Historical data trends
- **Network graphs** - Candidate and donor relationships

### **3. API Access**
- **Public API** - Access to aggregated data
- **Developer tools** - SDKs and documentation
- **Rate limiting** - Fair usage policies
- **Authentication** - Secure access controls

### **4. Data Export**
- **CSV/JSON export** - Bulk data downloads
- **Real-time feeds** - Live data streams
- **Custom reports** - Tailored data exports
- **Data licensing** - Commercial use agreements

---

## 🔒 **Security, Privacy & Compliance Considerations**

### **Privacy-First Architecture**

The Choices Platform is built with privacy-first principles that extend to the civics data ingestion system:

#### **1. Data Protection & Encryption**
- **Client-side encryption** for sensitive user data
- **Zero-knowledge analytics** protecting user privacy
- **Row Level Security (RLS)** policies in Supabase
- **End-to-end encryption** for sensitive communications
- **Data minimization** - only collect what's necessary

#### **2. User Privacy Protection**
- **No tracking** of individual user political preferences
- **Aggregated analytics** only for system improvement
- **User consent** for any data sharing
- **Right to deletion** with complete data removal
- **Anonymous participation** options for sensitive topics

#### **3. Government Data Handling**
- **Public data only** - no classified or sensitive government information
- **Transparent sourcing** - all data sources clearly documented
- **No data modification** - preserve original government data integrity
- **Attribution requirements** - proper credit to data sources
- **Rate limit compliance** - respect all API terms of service

### **Security Measures**

#### **1. API Security**
- **API key management** with secure storage and rotation
- **Rate limiting** to prevent abuse and ensure good citizenship
- **Request validation** and sanitization
- **Error handling** that doesn't expose sensitive information
- **Monitoring and alerting** for suspicious activity

#### **2. Database Security**
- **Supabase RLS policies** for data access control
- **WebAuthn authentication** for passwordless security
- **Trust tier system** for user verification levels
- **Audit logging** for all data access and modifications
- **Backup and recovery** with encrypted storage

#### **3. Infrastructure Security**
- **HTTPS everywhere** with proper SSL/TLS configuration
- **CORS policies** restricting cross-origin requests
- **Input validation** preventing injection attacks
- **Dependency scanning** for known vulnerabilities
- **Regular security updates** and patches

### **Compliance & Legal Considerations**

#### **1. Data Source Compliance**
- **Terms of Service** compliance for all APIs
- **Rate limit respect** for all external services
- **Attribution requirements** for government data
- **Fair use policies** for public data
- **No commercial use** restrictions compliance

#### **2. User Data Compliance**
- **GDPR compliance** for European users
- **CCPA compliance** for California users
- **Data retention policies** with automatic cleanup
- **User rights** including access, correction, and deletion
- **Consent management** with clear opt-in/opt-out

#### **3. Political Data Compliance**
- **Non-partisan approach** - equal treatment of all candidates
- **Transparency** in data sources and methodology
- **Accuracy** in data representation and analysis
- **No manipulation** of political information
- **Public interest** focus on democratic accountability

### **Risk Mitigation**

#### **1. Technical Risks**
- **API failures** - graceful degradation and fallback sources
- **Data corruption** - validation and integrity checks
- **Rate limit violations** - comprehensive monitoring and alerts
- **System overload** - proper scaling and load balancing
- **Data loss** - regular backups and recovery procedures

#### **2. Legal Risks**
- **Copyright issues** - proper attribution and fair use
- **Privacy violations** - comprehensive privacy protection
- **Political bias** - transparent, non-partisan approach
- **Misinformation** - data validation and source verification
- **Regulatory changes** - flexible architecture for compliance

#### **3. Operational Risks**
- **Data quality** - comprehensive validation and monitoring
- **System reliability** - redundancy and failover systems
- **User trust** - transparent operations and data handling
- **Scalability** - proper architecture for growth
- **Maintenance** - automated monitoring and alerting

---

## 🎯 **Conclusion**

The civics data ingestion architecture is the **foundation** for the ranked choice democracy revolution. By providing comprehensive, high-quality data about candidates, elections, and campaign finance, we enable:

1. **Informed voting decisions** through complete candidate profiles
2. **Transparent democracy** through campaign finance visibility
3. **Data-driven insights** for viral content generation
4. **Equal platform access** for all candidates regardless of funding
5. **Real-time updates** for election information and results
6. **"Walk the Talk" accountability** through promise tracking and voting analysis
7. **Democratic equalizer** breaking the duopoly through ranked choice voting

### **The Revolutionary Impact**

This system has the potential to **genuinely transform how elections work** by:

- **Breaking the duopoly** through ranked choice voting and equal platform access
- **Exposing "bought off" politicians** through transparent campaign finance data
- **Creating viral content** that drives engagement and awareness
- **Building networks** of like-minded voters through social discovery
- **Enabling accountability** through "walk the talk" analysis
- **Protecting privacy** while enabling democratic participation

### **Technical Excellence**

The technical implementation is **production-ready** with:

- **6 comprehensive API clients** with proper error handling and rate limiting
- **Advanced data orchestration** with quality scoring and conflict resolution
- **Privacy-first architecture** with zero-knowledge analytics
- **Comprehensive security** with WebAuthn authentication and RLS policies
- **Scalable infrastructure** ready for millions of users and records

---

## 🤖 **Critical Questions for AI Assessment**

### **1. Implementation Strategy Assessment**
- **Is the phased approach optimal** for rolling out the civics data ingestion?
- **Are the rate limits sufficient** for the expected data volume and user base?
- **Should we prioritize certain data sources** over others for initial implementation?
- **What are the critical dependencies** that could block or delay implementation?

### **2. Data Architecture & Quality**
- **Is the database schema optimized** for the ranked choice voting system and democratic equalizer features?
- **How can we improve query performance** for large datasets and real-time updates?
- **What are the best practices** for data partitioning and indexing at scale?
- **How should we handle data versioning** and historical records for accountability tracking?

### **3. Integration & Orchestration**
- **Is the unified orchestrator robust enough** for production scale and reliability?
- **How can we optimize the data transformation pipeline** for performance and accuracy?
- **What are the best practices** for handling API failures and implementing fallback strategies?
- **How should we implement data deduplication** across multiple sources effectively?

### **4. Security & Compliance**
- **Are the privacy protections sufficient** for handling sensitive political data?
- **What additional security measures** should be implemented for government data?
- **How can we ensure compliance** with evolving data protection regulations?
- **What are the risks** of handling political data and how can they be mitigated?

### **5. Scalability & Performance**
- **How can we scale the system** to handle millions of records and users?
- **What are the bottlenecks** in the current architecture and how can they be addressed?
- **How should we implement caching** for frequently accessed data?
- **What monitoring and alerting** should be implemented for system health?

### **6. Democratic Impact & Ethics**
- **How can we ensure the system remains non-partisan** and fair to all candidates?
- **What safeguards** should be implemented to prevent manipulation or bias?
- **How can we measure the democratic impact** of the platform?
- **What are the ethical considerations** for handling political data and user preferences?

### **7. Business & Operational**
- **What are the operational costs** of running this system at scale?
- **How can we ensure data freshness** and real-time updates?
- **What are the maintenance requirements** for keeping the system running?
- **How can we measure success** and ROI for the democratic equalizer mission?

---

**Ready for production deployment with comprehensive AI-validated architecture!** 🚀

*This document provides the complete context for the civics data ingestion architecture, including existing implementations, project vision, security considerations, and 12 critical production-ready hardening features validated by AI assessment. The platform is ready to commit to comprehensive data ingestion that will power the democratic equalizer revolution with enterprise-grade reliability and scalability.*

### **Key Takeaways for Implementation**

1. **We're 90% there** - The foundation is solid and production-ready
2. **12 critical hardening features** identified and documented for immediate implementation
3. **5 high-impact tickets** prioritized for next development phase
4. **Production-ready architecture** with canonical IDs, temporal modeling, and comprehensive monitoring
5. **Democratic equalizer vision** fully integrated with technical implementation
6. **Privacy-first approach** maintained throughout all data handling
7. **Scalable infrastructure** ready for millions of users and records

**The civics data ingestion system is ready to power the democratic revolution!** 🗳️

---

## 🚀 **Go/No-Go Preflight Checklist**

### **Production Launch Readiness Assessment**

Before flipping the switch on comprehensive civics data ingestion, run this super-tight preflight checklist. **Green = Go, Red = No-Go**.

#### **✅ Database Readiness**
- [ ] **Migrations apply clean** in staging environment
- [ ] **PostGIS extension enabled** for geographic lookups
- [ ] **RLS policies active** on all new civics tables (including staging.*)
- [ ] **SELECT-only access** via views for external applications
- [ ] **Backup and recovery** procedures tested and documented

#### **✅ ID Crosswalk System**
- [ ] **id_crosswalk populated** for at least one known federal + state test cohort
- [ ] **All joins use canonical IDs** (not source IDs) in production queries
- [ ] **Crosswalk maintenance procedures** documented and tested
- [ ] **Entity resolution** working for bioguide/openstates/fec/govtrack/opensecrets
- [ ] **Canonical ID generation** automated and consistent

#### **✅ FEC Pipeline Readiness**
- [ ] **Tables partitioned by cycle** for optimal performance
- [ ] **ingest_cursors seeded** with proper initial state
- [ ] **E-filing vs processed** clearly labeled end-to-end
- [ ] **UI shows "preliminary"** where appropriate for e-filing data
- [ ] **Candidate-committee relationships** properly mapped
- [ ] **Cycle-based queries** implemented and tested

#### **✅ Raw Data + Provenance**
- [ ] **Every curated row has provenance JSON** with source tracking
- [ ] **Raw payloads land in staging.*** with etag/md5 and request URL
- [ ] **Data lineage tracking** from source to curated table
- [ ] **Checksum validation** for data integrity
- [ ] **ETag/If-Modified-Since** support for API efficiency

#### **✅ Quality Gates**
- [ ] **dbt tests pass** for all data quality checks
- [ ] **PK uniqueness** validated across all tables
- [ ] **FK existence** verified for all relationships
- [ ] **Accepted values** enforced (party, vote, etc.)
- [ ] **Freshness SLAs met**: FEC ≤7 days, Congress votes ≤24 hours
- [ ] **Data contracts** enforced with proper constraints

#### **✅ Observability & Monitoring**
- [ ] **Dashboards operational** for quota usage, stale records, schema drift
- [ ] **Ingestion error rate** monitoring and alerting
- [ ] **Data health metrics** tracked and displayed
- [ ] **API usage monitoring** with quota warnings
- [ ] **Alerting wired** for critical failures and SLA breaches

---

## 🧪 **Day-1 Smoke Tests (15-30 minutes)**

### **Critical Functionality Validation**

Run these tests immediately after deployment to validate core functionality:

#### **Test 1: Crosswalk Validation**
**Objective**: Verify canonical ID system works across all sources

```sql
-- Pick one current House member + one state legislator
-- Confirm all sources resolve to the same entity_uuid
SELECT 
  entity_uuid,
  canonical_id,
  source,
  source_id
FROM id_crosswalk 
WHERE entity_type = 'person' 
  AND canonical_id IN ('test_house_member', 'test_state_legislator')
ORDER BY entity_uuid, source;
```

**Expected Result**: All sources (bioguide/openstates/fec/govtrack/opensecrets) resolve to the same entity_uuid

#### **Test 2: Finance Flow Validation**
**Objective**: Verify FEC data ingestion and independence scoring

```sql
-- Ingest a tiny window of FEC Schedule A
-- Verify it appears in contributions and snapshot with independence_score
SELECT 
  c.candidate_id,
  c.total_raised,
  s.independence_score,
  m.version as methodology_version
FROM candidate_finance_snapshots s
JOIN candidates c ON s.candidate_id = c.id
JOIN independence_score_methodology m ON s.methodology_version = m.version
WHERE s.cycle = 2024 
  AND s.taken_at > NOW() - INTERVAL '1 hour'
LIMIT 5;
```

**Expected Result**: Recent FEC data appears with independence scores and methodology version

#### **Test 3: Geographic Sanity Check**
**Objective**: Verify geographic lookups work correctly

```sql
-- Test ZIP→OCD and lat/lon→OCD return same division
-- Historical lookup respects census_cycle
SELECT 
  z.zip5,
  z.ocd_division_id as zip_ocd,
  l.ocd_division_id as latlon_ocd,
  g.census_cycle
FROM zip_to_ocd z
JOIN latlon_to_ocd l ON z.ocd_division_id = l.ocd_division_id
JOIN geographic_lookups g ON z.ocd_division_id = g.ocd_division_id
WHERE z.zip5 = '10001' -- Test ZIP
LIMIT 1;
```

**Expected Result**: ZIP and lat/lon lookups return same OCD division, census cycle preserved

#### **Test 4: Rate-Limit Resilience**
**Objective**: Verify system handles API rate limits gracefully

```typescript
// Force a 429 in staging and verify exponential backoff + resume from last_index
const testRateLimit = async () => {
  const rateLimiter = createCongressGovRateLimiter();
  
  // Simulate rate limit hit
  await rateLimiter.handleRateLimitError(1);
  
  // Verify backoff delay
  const status = rateLimiter.getRateLimitStatus();
  console.log('Rate limit status:', status);
  
  // Verify cursor state preserved
  const cursor = await getIngestCursor('congress-gov');
  console.log('Cursor preserved:', cursor);
};
```

**Expected Result**: Exponential backoff works, cursor state preserved, ingestion resumes

#### **Test 5: Privacy Display Validation**
**Objective**: Verify PII protection in UI

```sql
-- Verify donor data shows city/state/ZIP5 only
-- Street is hashed/omitted, small-N rollups suppressed
SELECT 
  donor_city,
  donor_state,
  donor_zip5,
  donor_name_hash, -- Should be hashed, not plain text
  amount
FROM contributions_private
WHERE candidate_id = 'test_candidate_id'
  AND contribution_date > CURRENT_DATE - INTERVAL '30 days'
LIMIT 10;
```

**Expected Result**: Only safe geographic data displayed, names hashed, amounts visible

---

## 🛡️ **Rollback & Safety Rails**

### **Emergency Controls**

#### **Kill Switch**
```typescript
// Feature flag to pause all ingestion jobs
const INGESTION_ENABLED = process.env.INGESTION_ENABLED === 'true';

// Separate flag to hide "preliminary/e-file" finance in UI
const SHOW_PRELIMINARY_FINANCE = process.env.SHOW_PRELIMINARY_FINANCE === 'true';

// Emergency stop function
const emergencyStop = async () => {
  await updateFeatureFlag('INGESTION_ENABLED', false);
  await pauseAllIngestionJobs();
  await notifyAdmins('Ingestion emergency stopped');
};
```

#### **Rollback Procedures**
```sql
-- Revert latest migration
-- Clear only today's ingest_cursors
-- Keep raw payloads for replay
BEGIN;

-- Revert migration
ROLLBACK TO SAVEPOINT before_civics_migration;

-- Clear today's cursors only
DELETE FROM ingest_cursors 
WHERE updated_at >= CURRENT_DATE;

-- Keep raw payloads for replay
-- (No action needed - staging.* tables preserved)

COMMIT;
```

#### **Licensing Compliance**
```sql
-- Verify data_licenses rows present
-- Attribution auto-renders where required
SELECT 
  license_key,
  source_name,
  attribution_text,
  display_requirements
FROM data_licenses
WHERE source_name IN ('congress-gov', 'fec', 'open-states', 'opensecrets');

-- Verify attribution links on all data
SELECT 
  c.name,
  c.license_key,
  dl.attribution_text
FROM candidates c
JOIN data_licenses dl ON c.license_key = dl.license_key
LIMIT 5;
```

---

## 🎯 **Nice-to-Have Features (Won't Block GA)**

### **Post-Launch Enhancements**

#### **Canary Jobs**
```typescript
// One canary job per source with tiny scope
const canaryJobs = {
  'congress-gov': { scope: 'single_state', state: 'CA' },
  'fec': { scope: 'single_cycle', cycle: 2024 },
  'open-states': { scope: 'single_state', state: 'CA' }
};

// Run on separate cron from bulk jobs
// Monitor for early warning of issues
```

#### **Coverage Widget**
```sql
-- % candidates with finance + voting records by jurisdiction
CREATE VIEW candidate_coverage AS
SELECT 
  state,
  district,
  COUNT(*) as total_candidates,
  COUNT(*) FILTER (WHERE has_finance_data) as with_finance,
  COUNT(*) FILTER (WHERE has_voting_records) as with_votes,
  ROUND(
    COUNT(*) FILTER (WHERE has_finance_data AND has_voting_records)::DECIMAL / 
    COUNT(*) * 100, 2
  ) as complete_coverage_percent
FROM candidates
GROUP BY state, district
ORDER BY complete_coverage_percent DESC;
```

---

## 🚀 **Final Launch Decision**

### **Go/No-Go Criteria**

**🟢 GO** if all preflight checks pass:
- Database migrations clean
- ID crosswalk populated and tested
- FEC pipeline ready with proper labeling
- Raw data + provenance working
- Quality gates passing
- Observability operational
- All 5 smoke tests pass

**🔴 NO-GO** if any critical issues:
- Database migration failures
- ID crosswalk not working
- FEC data not properly labeled
- Missing provenance or raw data
- Quality gates failing
- Monitoring not operational
- Smoke tests failing

### **Launch Readiness Statement**

**If all checks pass, ship it.** Your civics ingestion will plug cleanly into the ranked-choice, profiles, finance transparency, and privacy layers you've already scoped.

**The democratic equalizer is ready to revolutionize elections!** 🗳️
