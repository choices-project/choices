# 📊 Schema Extraction Summary

**Generated**: 2025-10-02T03:17:10.394Z  
**Total Tables**: 50

## 📈 **STATISTICS**

- **Tables with Data**: 12
- **Tables with RLS Enabled**: 0
- **Tables with RLS Disabled**: 50
- **Total Records**: 5373

## 🚨 **SECURITY STATUS**

### **Tables with RLS DISABLED (50)**
- polls (167 rows)
- votes (3 rows)
- user_profiles (3 rows)
- webauthn_credentials (0 rows)
- webauthn_challenges (0 rows)
- error_logs (0 rows)
- feedback (19 rows)
- user_consent (0 rows)
- privacy_logs (0 rows)
- location_consent_audit (0 rows)
- civics_person_xref (540 rows)
- civics_votes_minimal (2185 rows)
- civics_divisions (1172 rows)
- civics_representatives (1273 rows)
- civics_addresses (0 rows)
- civics_campaign_finance (0 rows)
- civics_votes (0 rows)
- civic_jurisdictions (4 rows)
- jurisdiction_aliases (3 rows)
- jurisdiction_geometries (0 rows)
- jurisdiction_tiles (3 rows)
- user_location_resolutions (0 rows)
- candidate_jurisdictions (0 rows)
- auth_users (0 rows)
- auth_sessions (0 rows)
- auth_identities (0 rows)
- auth_mfa_factors (0 rows)
- auth_mfa_challenges (0 rows)
- auth_audit_log_entries (0 rows)
- auth_flow_state (0 rows)
- storage_objects (0 rows)
- storage_buckets (0 rows)
- storage_migrations (0 rows)
- supabase_migrations (0 rows)
- supabase_migrations_schema_migrations (0 rows)
- poll_results_live_view (0 rows)
- poll_results_baseline_view (0 rows)
- poll_results_drift_view (0 rows)
- notifications (0 rows)
- user_preferences (0 rows)
- user_sessions (0 rows)
- api_keys (0 rows)
- webhooks (0 rows)
- integrations (0 rows)
- analytics_events (1 rows)
- audit_logs (0 rows)
- system_settings (0 rows)
- feature_flags (0 rows)
- rate_limits (0 rows)
- security_events (0 rows)

### **Tables with RLS ENABLED (0)**


## 📊 **DATA DISTRIBUTION**

### **Tables with Data (12)**
- polls: 167 rows
- votes: 3 rows
- user_profiles: 3 rows
- feedback: 19 rows
- civics_person_xref: 540 rows
- civics_votes_minimal: 2185 rows
- civics_divisions: 1172 rows
- civics_representatives: 1273 rows
- civic_jurisdictions: 4 rows
- jurisdiction_aliases: 3 rows
- jurisdiction_tiles: 3 rows
- analytics_events: 1 rows

### **Empty Tables (38)**
- webauthn_credentials
- webauthn_challenges
- error_logs
- user_consent
- privacy_logs
- location_consent_audit
- civics_addresses
- civics_campaign_finance
- civics_votes
- jurisdiction_geometries
- user_location_resolutions
- candidate_jurisdictions
- auth_users
- auth_sessions
- auth_identities
- auth_mfa_factors
- auth_mfa_challenges
- auth_audit_log_entries
- auth_flow_state
- storage_objects
- storage_buckets
- storage_migrations
- supabase_migrations
- supabase_migrations_schema_migrations
- poll_results_live_view
- poll_results_baseline_view
- poll_results_drift_view
- notifications
- user_preferences
- user_sessions
- api_keys
- webhooks
- integrations
- audit_logs
- system_settings
- feature_flags
- rate_limits
- security_events

## 🎯 **NEXT STEPS**

1. **Enable RLS** on all tables with RLS disabled
2. **Audit data access** for all tables with data
3. **Consolidate tables** to reduce complexity
4. **Optimize schema** for better performance
