# Database Table Usage Audit

**Purpose**: Systematically audit all 127+ database tables to identify which are actually used in the codebase, enabling safe removal of unused tables and optimization of database types.

**Status**: 🔄 IN PROGRESS  
**Created**: October 19, 2025  
**Last Updated**: October 19, 2025

## Audit Process

1. ✅ **Extract all tables** from the comprehensive database schema (127 tables found)
2. 🔄 **Search codebase** for each table usage
3. 🔄 **Document usage patterns** and dependencies
4. 🔄 **Identify unused tables** for safe removal
5. 🔄 **Create optimized database types** with only used tables

## Complete Table List (127 Tables)

### Core/Shared Tables
| Table Name | Status | Usage Count | Files Using | Notes |
|------------|--------|-------------|-------------|-------|
| `user_profiles` | ✅ USED | 98 | 41 files | Core user data - heavily used |
| `analytics_events` | ✅ USED | 10 | 5 files | Analytics tracking - moderate use |
| `error_logs` | ✅ USED | TBD | TBD | Error logging |
| `system_configuration` | 🔍 PENDING | TBD | TBD | System settings |
| `migration_log` | 🔍 PENDING | TBD | TBD | Database migrations |
| `admin_activity_log` | 🔍 PENDING | TBD | TBD | Admin actions |

### Polls & Voting Tables
| Table Name | Status | Usage Count | Files Using | Notes |
|------------|--------|-------------|-------------|-------|
| `polls` | ✅ USED | 807 | 163 files | Poll data - extremely heavily used |
| `votes` | ✅ USED | 868 | 130 files | User votes - extremely heavily used |
| `poll_options` | ✅ USED | TBD | TBD | Poll choices |
| `poll_analytics` | 🔍 PENDING | TBD | TBD | Poll statistics |
| `generated_polls` | 🔍 PENDING | TBD | TBD | AI-generated polls |

### Hashtags & Social Tables
| Table Name | Status | Usage Count | Files Using | Notes |
|------------|--------|-------------|-------------|-------|
| `hashtags` | ✅ USED | 639 | 43 files | Hashtag data - heavily used |
| `hashtag_usage` | ✅ USED | TBD | TBD | Hashtag tracking |
| `hashtag_flags` | ✅ USED | TBD | TBD | Hashtag moderation |
| `user_hashtags` | 🔍 PENDING | TBD | TBD | User hashtag follows |
| `hashtag_engagement` | 🔍 PENDING | TBD | TBD | Hashtag interactions |
| `hashtag_content` | 🔍 PENDING | TBD | TBD | Hashtag content |
| `hashtag_co_occurrence` | 🔍 PENDING | TBD | TBD | Hashtag relationships |
| `hashtag_analytics` | 🔍 PENDING | TBD | TBD | Hashtag statistics |
| `hashtag_moderation` | 🔍 PENDING | TBD | TBD | Hashtag moderation |
| `user_hashtag_follows` | 🔍 PENDING | TBD | TBD | User follows |
| `hashtag_performance_summary` | 🔍 PENDING | TBD | TBD | Performance metrics |

### Analytics & Metrics Tables
| Table Name | Status | Usage Count | Files Using | Notes |
|------------|--------|-------------|-------------|-------|
| `analytics_contributions` | 🔍 PENDING | TBD | TBD | Contribution analytics |
| `analytics_demographics` | 🔍 PENDING | TBD | TBD | Demographic data |
| `analytics_page_views` | 🔍 PENDING | TBD | TBD | Page view tracking |
| `analytics_sessions` | 🔍 PENDING | TBD | TBD | Session analytics |
| `analytics_user_engagement` | 🔍 PENDING | TBD | TBD | User engagement |
| `user_analytics` | 🔍 PENDING | TBD | TBD | User-specific analytics |
| `user_feedback_analytics` | 🔍 PENDING | TBD | TBD | Feedback analytics |
| `demographic_analytics` | 🔍 PENDING | TBD | TBD | Demographics |
| `user_engagement_summary` | 🔍 PENDING | TBD | TBD | Engagement summary |

### Civics & Government Tables
| Table Name | Status | Usage Count | Files Using | Notes |
|------------|--------|-------------|-------------|-------|
| `representatives_core` | ✅ USED | TBD | TBD | Government officials |
| `representative_contacts_optimal` | 🔍 PENDING | TBD | TBD | Contact information |
| `representative_offices_optimal` | 🔍 PENDING | TBD | TBD | Office locations |
| `representative_photos_optimal` | 🔍 PENDING | TBD | TBD | Official photos |
| `representative_roles_optimal` | 🔍 PENDING | TBD | TBD | Roles and positions |
| `candidates` | 🔍 PENDING | TBD | TBD | Election candidates |
| `civic_jurisdictions` | ✅ USED | TBD | TBD | Government areas |
| `elections` | 🔍 PENDING | TBD | TBD | Election data |
| `state_districts` | 🔍 PENDING | TBD | TBD | State districts |
| `campaign_finance` | 🔍 PENDING | TBD | TBD | Campaign funding |
| `contributions` | 🔍 PENDING | TBD | TBD | Political contributions |

### Privacy & Compliance Tables
| Table Name | Status | Usage Count | Files Using | Notes |
|------------|--------|-------------|-------------|-------|
| `privacy_consent_records` | 🔍 PENDING | TBD | TBD | Consent tracking |
| `privacy_data_requests` | 🔍 PENDING | TBD | TBD | Data requests |
| `privacy_audit_logs` | 🔍 PENDING | TBD | TBD | Privacy audits |
| `user_consent` | 🔍 PENDING | TBD | TBD | User consent |
| `private_user_data` | 🔍 PENDING | TBD | TBD | Private data |
| `user_profiles_encrypted` | 🔍 PENDING | TBD | TBD | Encrypted profiles |
| `user_privacy_analytics` | 🔍 PENDING | TBD | TBD | Privacy analytics |

### Data Quality & Governance Tables
| Table Name | Status | Usage Count | Files Using | Notes |
|------------|--------|-------------|-------------|-------|
| `data_quality_audit` | 🔍 PENDING | TBD | TBD | Data quality audits |
| `data_quality_checks` | 🔍 PENDING | TBD | TBD | Quality checks |
| `data_quality_metrics` | 🔍 PENDING | TBD | TBD | Quality metrics |
| `data_quality_summary` | 🔍 PENDING | TBD | TBD | Quality summary |
| `data_checksums` | 🔍 PENDING | TBD | TBD | Data integrity |
| `data_licenses` | 🔍 PENDING | TBD | TBD | Data licensing |
| `data_lineage` | 🔍 PENDING | TBD | TBD | Data lineage |
| `data_sources` | 🔍 PENDING | TBD | TBD | Data source tracking |
| `data_transformations` | 🔍 PENDING | TBD | TBD | Data transformations |

### Authentication & Security Tables
| Table Name | Status | Usage Count | Files Using | Notes |
|------------|--------|-------------|-------------|-------|
| `webauthn_credentials` | ✅ USED | TBD | TBD | WebAuthn auth |
| `webauthn_challenges` | ✅ USED | TBD | TBD | WebAuthn challenges |
| `security_audit_log` | 🔍 PENDING | TBD | TBD | Security audits |
| `audit_logs` | 🔍 PENDING | TBD | TBD | General audits |
| `rate_limits` | 🔍 PENDING | TBD | TBD | Rate limiting |
| `biometric_auth_logs` | 🔍 PENDING | TBD | TBD | Biometric auth |
| `biometric_trust_scores` | 🔍 PENDING | TBD | TBD | Trust scoring |

### FEC (Federal Election Commission) Tables
| Table Name | Status | Usage Count | Files Using | Notes |
|------------|--------|-------------|-------------|-------|
| `fec_candidate_committee` | 🔍 PENDING | TBD | TBD | FEC candidate data |
| `fec_candidates` | 🔍 PENDING | TBD | TBD | FEC candidates |
| `fec_candidates_v2` | 🔍 PENDING | TBD | TBD | FEC candidates v2 |
| `fec_committees` | 🔍 PENDING | TBD | TBD | FEC committees |
| `fec_committees_v2` | 🔍 PENDING | TBD | TBD | FEC committees v2 |
| `fec_contributions` | 🔍 PENDING | TBD | TBD | FEC contributions |
| `fec_cycles` | 🔍 PENDING | TBD | TBD | FEC election cycles |
| `fec_disbursements` | 🔍 PENDING | TBD | TBD | FEC disbursements |
| `fec_filings_v2` | 🔍 PENDING | TBD | TBD | FEC filings |
| `fec_independent_expenditures` | 🔍 PENDING | TBD | TBD | FEC expenditures |
| `fec_ingest_cursors` | 🔍 PENDING | TBD | TBD | FEC ingestion |

### DBT (Data Build Tool) Tables
| Table Name | Status | Usage Count | Files Using | Notes |
|------------|--------|-------------|-------------|-------|
| `dbt_test_results` | 🔍 PENDING | TBD | TBD | DBT test results |
| `dbt_freshness_status` | 🔍 PENDING | TBD | TBD | DBT freshness |
| `dbt_freshness_sla` | 🔍 PENDING | TBD | TBD | DBT SLA |
| `dbt_test_config` | 🔍 PENDING | TBD | TBD | DBT test config |
| `dbt_test_execution_history` | 🔍 PENDING | TBD | TBD | DBT execution history |
| `dbt_test_execution_log` | 🔍 PENDING | TBD | TBD | DBT execution log |
| `dbt_test_results_summary` | 🔍 PENDING | TBD | TBD | DBT results summary |

### Content & Media Tables
| Table Name | Status | Usage Count | Files Using | Notes |
|------------|--------|-------------|-------------|-------|
| `feedback` | ✅ USED | TBD | TBD | User feedback |
| `breaking_news` | 🔍 PENDING | TBD | TBD | News content |
| `civics_feed_items` | 🔍 PENDING | TBD | TBD | Civics content |
| `trending_topics` | 🔍 PENDING | TBD | TBD | Trending content |

### System & Admin Tables
| Table Name | Status | Usage Count | Files Using | Notes |
|------------|--------|-------------|-------------|-------|
| `site_messages` | 🔍 PENDING | TBD | TBD | Site messages |
| `trust_tier_analytics` | 🔍 PENDING | TBD | TBD | Trust tier analysis |
| `bias_detection_logs` | 🔍 PENDING | TBD | TBD | Bias detection |
| `fact_check_sources` | 🔍 PENDING | TBD | TBD | Fact checking |

### Geographic & Jurisdiction Tables
| Table Name | Status | Usage Count | Files Using | Notes |
|------------|--------|-------------|-------------|-------|
| `candidate_jurisdictions` | 🔍 PENDING | TBD | TBD | Candidate jurisdictions |
| `jurisdiction_aliases` | 🔍 PENDING | TBD | TBD | Jurisdiction aliases |
| `user_location_resolutions` | 🔍 PENDING | TBD | TBD | Location resolution |

### User Preferences & Settings Tables
| Table Name | Status | Usage Count | Files Using | Notes |
|------------|--------|-------------|-------------|-------|
| `user_civics_preferences` | 🔍 PENDING | TBD | TBD | Civics preferences |
| `user_notification_preferences` | 🔍 PENDING | TBD | TBD | Notification settings |

### Data Ingestion & Processing Tables
| Table Name | Status | Usage Count | Files Using | Notes |
|------------|--------|-------------|-------------|-------|
| `ingest_cursors` | 🔍 PENDING | TBD | TBD | Ingestion cursors |
| `ingestion_cursors` | 🔍 PENDING | TBD | TBD | Ingestion tracking |
| `ingestion_logs` | 🔍 PENDING | TBD | TBD | Ingestion logging |

### Utility & System Tables
| Table Name | Status | Usage Count | Files Using | Notes |
|------------|--------|-------------|-------------|-------|
| `id_crosswalk` | 🔍 PENDING | TBD | TBD | ID mapping |
| `idempotency_keys` | 🔍 PENDING | TBD | TBD | Idempotency |
| `independence_score_methodology` | 🔍 PENDING | TBD | TBD | Independence scoring |

## Usage Patterns Analysis

### High-Usage Tables (Core Functionality)
- `user_profiles` - Central user data
- `polls` - Core polling functionality  
- `votes` - Voting system
- `hashtags` - Social features
- `analytics_events` - Tracking
- `representatives_core` - Civics features

### Medium-Usage Tables (Feature-Specific)
- `webauthn_credentials` - Authentication
- `hashtag_usage` - Hashtag tracking
- `feedback` - User feedback system

### Low-Usage Tables (Admin/System)
- `error_logs` - Error tracking
- `system_configuration` - System settings
- `migration_log` - Database migrations

### Unused Tables (Candidates for Removal)
| Table Name | Usage Count | Files Using | Notes |
|------------|-------------|-------------|-------|
| `dbt_test_results` | 2 | 1 file | Only in schema file - unused |
| `privacy_consent_records` | 1 | 1 file | Only in schema file - unused |
| `data_quality_audit` | 1 | 1 file | Only in schema file - unused |
| `fec_candidates` | 4 | 2 files | Minimal usage - candidate for removal |
| `fec_committees` | TBD | TBD | Likely unused |
| `fec_contributions` | TBD | TBD | Likely unused |
| `fec_disbursements` | TBD | TBD | Likely unused |
| `fec_independent_expenditures` | TBD | TBD | Likely unused |
| `dbt_freshness_status` | TBD | TBD | Likely unused |
| `dbt_test_config` | TBD | TBD | Likely unused |
| `dbt_test_execution_history` | TBD | TBD | Likely unused |
| `dbt_test_execution_log` | TBD | TBD | Likely unused |
| `dbt_test_results_summary` | TBD | TBD | Likely unused |

## Next Steps

1. **Search codebase systematically** for each table usage
2. **Document usage patterns** and dependencies
3. **Identify safe removal candidates**
4. **Create optimized database types**
5. **Remove unused tables** from schema

## Notes

- This audit will help reduce the 3,868-line database types file
- Focus on tables actually used in the codebase
- Preserve tables that might be used by external systems
- Document any tables that are part of future planned features
- The comprehensive schema contains 127 tables total