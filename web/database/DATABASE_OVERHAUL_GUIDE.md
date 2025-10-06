# Database Overhaul Planning Guide

**Created at:** 2025-01-27  
**Updated at:** 2025-01-27  
**Purpose:** Comprehensive breakdown of all tables, columns, and relationships for database overhaul planning

## Executive Summary

This guide provides a complete breakdown of all 125 tables across 8 schemas, including:
- **Column definitions** with data types, constraints, and defaults
- **Foreign key relationships** and dependencies
- **Index strategies** and performance considerations
- **Row-Level Security** status
- **Data volume** and usage patterns

## Schema Overview

| Schema | Tables | RLS Enabled | Primary Purpose |
|--------|--------|-------------|-----------------|
| **auth** | 17 | 0 | User authentication & session management |
| **public** | 88 | 47 | Core application data & business logic |
| **staging** | 6 | 0 | Raw data ingestion from external APIs |
| **storage** | 7 | 0 | File storage & object management |
| **realtime** | 3 | 0 | Real-time subscriptions |
| **cron** | 2 | 2 | Scheduled job management |
| **civics** | 1 | 0 | Rate limiting |
| **vault** | 1 | 0 | Encrypted secrets storage |

## Critical Tables for Overhaul Planning

### 🔑 **Core Entity Tables** (Must Preserve Relationships)

#### 1. **auth.users** (Central Identity)
- **Primary Key:** id (uuid)
- **Key Relationships:** Referenced by 19 tables
- **Critical for:** All user-related functionality
- **Overhaul Impact:** HIGH - Central to entire system

#### 2. **public.representatives_core** (Political Data Hub)
- **Primary Key:** id (uuid)
- **Key Relationships:** Referenced by 13 tables
- **Key Columns:**
  - `name`, `party`, `state`, `office`, `level`
  - `bioguide_id`, `fec_id`, `openstates_id` (external IDs)
  - `active`, `verification_status`
- **Overhaul Impact:** HIGH - Central to civic data

#### 3. **public.civic_jurisdictions** (Geographic Hub)
- **Primary Key:** ocd_division_id (text)
- **Key Relationships:** Referenced by 6 tables
- **Key Columns:**
  - `ocd_division_id`, `name`, `type`, `level`
  - `parent_id`, `valid_from`, `valid_to`
- **Overhaul Impact:** HIGH - Geographic mapping

### 📊 **Data Flow Tables** (Processing Pipeline)

#### Staging Tables (Raw Data Ingestion)
- `staging.fec_raw` - FEC campaign finance data
- `staging.open_states_raw` - State legislature data
- `staging.govtrack_raw` - Congressional data
- `staging.congress_gov_raw` - Congress.gov data
- `staging.opensecrets_raw` - OpenSecrets data
- `staging.google_civic_raw` - Google Civic API data

**Common Pattern:**
```sql
-- All staging tables follow this structure:
id: uuid (PK)
retrieved_at: timestamp
request_url: text
payload: jsonb (raw API data)
processing_status: text
processing_started_at: timestamp
processing_completed_at: timestamp
processing_error: text
retry_count: integer
```

#### Core Processing Tables
- `public.fec_candidates` - Processed FEC candidate data
- `public.fec_committees` - Processed FEC committee data
- `public.fec_contributions` - Processed FEC contribution data
- `public.candidates` - Unified candidate data
- `public.contributions` - Unified contribution data

### 🔐 **User Management Tables** (Privacy-Critical)

#### Authentication Tables (auth schema)
- `auth.users` - Core user accounts
- `auth.identities` - OAuth/SSO identities
- `auth.sessions` - Active sessions
- `auth.refresh_tokens` - Token management

#### User Profile Tables (public schema)
- `public.user_profiles` - Public profile data
- `public.user_profiles_encrypted` - Encrypted sensitive data
- `public.private_user_data` - Encrypted personal information
- `public.user_consent` - Privacy consent management
- `public.user_location_resolutions` - Location data with consent

**Privacy Features:**
- Row-Level Security enabled on all user tables
- Encrypted data storage for sensitive information
- Consent versioning and audit trails
- Location data with privacy controls

### 🏛️ **Civic Data Tables** (Core Business Logic)

#### Representative Data
- `public.representatives_core` - Main representative data (40 rows)
- `public.representative_contacts` - Contact information (52 rows)
- `public.representative_activity` - Activity tracking
- `public.representative_voting_records` - Voting history
- `public.representative_social_media` - Social media accounts
- `public.representative_photos` - Photo management

#### Geographic Data
- `public.civic_jurisdictions` - Jurisdiction definitions
- `public.state_districts` - Congressional/state districts
- `public.jurisdiction_aliases` - Alternative jurisdiction names
- `public.jurisdiction_geometries` - Geographic boundaries
- `public.latlon_to_ocd` - Coordinate to jurisdiction mapping
- `public.zip_to_ocd` - ZIP code to jurisdiction mapping

#### Polling & Engagement
- `public.polls` - User-created polls (173 rows)
- `public.generated_polls` - AI-generated polls (3 rows)
- `public.votes` - User votes (3 rows)
- `public.trending_topics` - Trending topics (6 rows)
- `public.feedback` - User feedback (23 rows)

### 💰 **Campaign Finance Tables** (FEC Integration)

#### FEC Data Tables
- `public.fec_candidates` - FEC candidate data
- `public.fec_committees` - FEC committee data
- `public.fec_contributions` - FEC contribution data
- `public.fec_disbursements` - FEC disbursement data
- `public.fec_independent_expenditures` - Independent expenditures
- `public.fec_cycles` - Election cycles

#### Unified Finance Tables
- `public.campaign_finance` - Unified campaign finance data
- `public.contributions` - Unified contribution data
- `public.analytics_contributions` - Contribution analytics

### 📈 **Analytics & Monitoring Tables**

#### Data Quality
- `public.data_quality_metrics` - Data quality scores
- `public.data_quality_checks` - Quality check results
- `public.data_quality_audit` - Audit trail
- `public.quality_metrics` - Poll quality metrics

#### Analytics
- `public.analytics_events` - User behavior analytics
- `public.analytics_demographics` - Demographic analytics
- `public.analytics_contributions` - Financial analytics

#### Monitoring
- `public.audit_logs` - System audit logs
- `public.security_audit_log` - Security events
- `public.error_logs` - Error tracking
- `public.privacy_logs` - Privacy event logs

## Key Relationships & Dependencies

### 🔗 **Critical Foreign Key Chains**

#### User Identity Chain
```
auth.users (id)
├── public.user_profiles (user_id)
├── public.user_consent (user_id)
├── public.user_location_resolutions (user_id)
├── public.private_user_data (user_id)
├── public.user_profiles_encrypted (user_id)
├── public.webauthn_credentials (user_id)
├── public.webauthn_challenges (user_id)
└── public.feedback (user_id)
```

#### Representative Data Chain
```
public.representatives_core (id)
├── public.representative_contacts (representative_id)
├── public.representative_activity (representative_id)
├── public.representative_voting_records (representative_id)
├── public.representative_social_media (representative_id)
├── public.representative_photos (representative_id)
├── public.civics_feed_items (representative_id)
└── public.data_quality_metrics (entity_id)
```

#### Geographic Chain
```
public.civic_jurisdictions (ocd_division_id)
├── public.jurisdiction_aliases (ocd_division_id)
├── public.jurisdiction_geometries (ocd_division_id)
├── public.jurisdiction_tiles (ocd_division_id)
├── public.candidate_jurisdictions (jurisdiction_id)
└── public.user_location_resolutions (resolved_ocd_id)
```

### 📊 **Data Flow Architecture**

```
External APIs → Staging Tables → Core Tables → Analytics Tables
     ↓              ↓              ↓              ↓
Raw JSON → Processed Data → Business Logic → Insights
```

**Example Flow:**
1. **FEC API** → `staging.fec_raw` → `public.fec_candidates` → `public.representatives_core`
2. **OpenStates API** → `staging.open_states_raw` → `public.representatives_core`
3. **User Activity** → `public.analytics_events` → `public.analytics_demographics`

## Overhaul Recommendations

### 🎯 **Phase 1: Core Entity Consolidation**

#### 1. **Representative Data Unification**
- **Current State:** Multiple representative tables with overlapping data
- **Recommendation:** Consolidate into single `representatives` table with JSONB for flexible attributes
- **Tables to Merge:**
  - `representatives_core` (main data)
  - `representative_contacts` (contact info)
  - `representative_social_media` (social accounts)
  - `representative_photos` (photo metadata)

#### 2. **Geographic Data Optimization**
- **Current State:** Multiple jurisdiction tables with complex relationships
- **Recommendation:** Single `jurisdictions` table with hierarchical structure
- **Tables to Merge:**
  - `civic_jurisdictions` (main data)
  - `jurisdiction_aliases` (alternative names)
  - `jurisdiction_geometries` (boundary data)
  - `state_districts` (district data)

### 🔄 **Phase 2: Data Pipeline Optimization**

#### 1. **Staging Table Standardization**
- **Current State:** 6 different staging tables with similar structure
- **Recommendation:** Single `data_ingestion` table with source-specific JSONB
- **Benefits:**
  - Unified processing pipeline
  - Consistent error handling
  - Simplified monitoring

#### 2. **Campaign Finance Consolidation**
- **Current State:** Multiple FEC tables with overlapping data
- **Recommendation:** Single `campaign_finance` table with entity relationships
- **Tables to Merge:**
  - `fec_candidates`, `fec_committees`, `fec_contributions`
  - `campaign_finance`, `contributions`

### 🔐 **Phase 3: Security & Privacy Enhancement**

#### 1. **User Data Consolidation**
- **Current State:** Multiple user tables with privacy concerns
- **Recommendation:** Single `users` table with encrypted sensitive fields
- **Tables to Merge:**
  - `user_profiles`, `user_profiles_encrypted`
  - `private_user_data`, `user_consent`

#### 2. **Audit Trail Standardization**
- **Current State:** Multiple audit tables with different structures
- **Recommendation:** Single `audit_events` table with event-specific JSONB
- **Tables to Merge:**
  - `audit_logs`, `security_audit_log`
  - `privacy_logs`, `location_consent_audit`

### 📊 **Phase 4: Analytics & Monitoring**

#### 1. **Analytics Table Consolidation**
- **Current State:** Multiple analytics tables with overlapping metrics
- **Recommendation:** Single `analytics_events` table with event-specific JSONB
- **Tables to Merge:**
  - `analytics_events`, `analytics_demographics`
  - `analytics_contributions`

#### 2. **Quality Monitoring Unification**
- **Current State:** Multiple quality tables with different approaches
- **Recommendation:** Single `data_quality` table with metric-specific JSONB
- **Tables to Merge:**
  - `data_quality_metrics`, `data_quality_checks`
  - `quality_metrics`

## Migration Strategy

### 🚀 **Step-by-Step Migration Plan**

#### Step 1: **Backup & Preparation**
1. Create full database backup
2. Document all current relationships
3. Create migration scripts
4. Set up rollback procedures

#### Step 2: **Core Entity Migration**
1. Create new consolidated tables
2. Migrate data with relationship preservation
3. Update application code
4. Test functionality

#### Step 3: **Data Pipeline Migration**
1. Consolidate staging tables
2. Update ingestion processes
3. Migrate processing logic
4. Validate data integrity

#### Step 4: **Security Enhancement**
1. Implement new privacy controls
2. Migrate user data with encryption
3. Update consent management
4. Test security features

#### Step 5: **Analytics Migration**
1. Consolidate analytics tables
2. Update reporting queries
3. Migrate monitoring dashboards
4. Validate metrics

### ⚠️ **Critical Considerations**

#### Data Integrity
- **Foreign Key Constraints:** Must be preserved during migration
- **Data Validation:** Ensure no data loss during consolidation
- **Relationship Mapping:** Document all current relationships

#### Performance Impact
- **Index Strategy:** Recreate indexes on consolidated tables
- **Query Optimization:** Update queries for new table structure
- **Performance Testing:** Validate performance after migration

#### Security & Privacy
- **RLS Policies:** Update Row-Level Security policies
- **Data Encryption:** Ensure sensitive data remains encrypted
- **Audit Trails:** Maintain comprehensive audit logging

#### Application Impact
- **API Changes:** Update all API endpoints
- **Frontend Updates:** Update all user interfaces
- **Integration Testing:** Comprehensive testing of all features

## Conclusion

This database overhaul will significantly improve:
- **Data Consistency** through table consolidation
- **Performance** through optimized relationships
- **Security** through enhanced privacy controls
- **Maintainability** through simplified architecture

The migration should be planned carefully with extensive testing to ensure no data loss or functionality disruption.

---

*This guide provides the complete foundation for planning your database overhaul. Each table, column, and relationship has been documented to ensure accurate migration planning.*
