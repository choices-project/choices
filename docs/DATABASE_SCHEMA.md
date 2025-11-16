# Choices Platform - Database Schema Documentation

**Last Updated**: November 16, 2025  
**Source of Truth**: `/web/types/supabase.ts` (Supabase-generated types)  
**Status**: ✅ Current (synced to latest generated types)

---

## Overview

This document summarizes the Choices platform database schema. The authoritative, up-to-date definitions live in `/web/types/supabase.ts` and should be consulted when making code changes. The schema supports:

- 🗳️ **Poll Management** - Create, vote, and analyze polls
- 👥 **User Profiles & Trust Tiers** - User management and trust scoring
- 🏛️ **Civic Engagement** - Representative data, civic actions, contact tracking
- 📊 **Analytics** - Comprehensive analytics, bot detection, narrative analysis
- 🔔 **PWA Features** - Push notifications, offline sync, background tasks
- #️⃣ **Hashtag System** - Trending topics, user preferences, engagement tracking
- 🔐 **Authentication** - WebAuthn, biometric trust scores, sessions
- 📱 **Feeds** - User feeds, feed items, interactions

---

## Schema Index (from current generated types)

### Public Tables (current)

- `admin_activity_log`
- `analytics_event_data`
- `analytics_events`
- `audit_logs`
- `biometric_trust_scores`
- `bot_detection_logs`
- `cache_performance_log`
- `candidate_email_challenges`
- `candidate_onboarding`
- `candidate_platforms`
- `candidate_profile_audit`
- `candidate_profiles`
- `candidate_verifications`
- `civic_action_metadata`
- `civic_actions`
- `civic_database_entries`
- `civic_elections`
- `contact_messages`
- `contact_threads`
- `feature_usage`
- `feed_interactions`
- `feed_items`
- `feedback`
- `feeds`
- `hashtag_engagement`
- `hashtag_flags`
- `hashtag_usage`
- `hashtag_user_preferences`
- `hashtags`
- `id_crosswalk`
- `idempotency_keys`
- `message_delivery_logs`
- `narrative_analysis_results`
- `notification_log`
- `official_email_fast_track`
- `openstates_people_contacts`
- `openstates_people_data`
- `openstates_people_identifiers`
- `openstates_people_other_names`
- `openstates_people_roles`
- `openstates_people_social_media`
- `openstates_people_sources`
- `performance_metrics`
- `permissions`
- `platform_analytics`
- `poll_demographic_insights`
- `poll_options`
- `poll_participation_analytics`
- `poll_rankings`
- `polls`
- `push_subscriptions`
- `query_performance_log`
- `rate_limits`
- `representative_activity`
- `representative_campaign_finance`
- `representative_committees`
- `representative_contacts`
- `representative_crosswalk_enhanced`
- `representative_data_quality`
- `representative_data_sources`
- `representative_divisions`
- `representative_enhanced_crosswalk`
- `representative_follows`
- `representative_overrides`
- `representative_overrides_audit`
- `representative_photos`
- `representative_social_media`
- `representatives_core`
- `role_permissions`
- `roles`
- `site_messages`
- `sync_log`
- `system_health`
- `trending_topics`
- `trust_tier_analytics`
- `trust_tier_progression`
- `user_hashtags`
- `user_profiles`
- `user_roles`
- `user_sessions`
- `vote_trust_tiers`
- `voter_registration_resources`
- `votes`
- `webauthn_challenges`
- `webauthn_credentials`
- `idempotency_monitor`
- `user_voting_history`

### Public Views (current)

- `openstates_people_current_roles_v`
- `openstates_people_primary_contacts_v`
- `openstates_people_social_v`
- `openstates_people_sources_v`
- `voter_registration_resources_view`

### RPC Functions (current)

- `analyze_narrative_divergence`
- `analyze_polls_table`
- `analyze_query_performance`
- `calculate_trust_filtered_votes`
- `calculate_trust_weighted_votes`
- `calculate_user_trust_tier`
- `cleanup_expired_data`
- `create_audit_log`
- `get_audit_log_stats`
- `get_duplicate_canonical_ids`
- `get_hashtag_trending_history`
- `get_heatmap`
- `get_performance_recommendations`
- `get_personalized_recommendations`
- `get_poll_results_by_trust_tier`
- `get_poll_votes_by_trust_tier`
- `get_real_time_analytics`
- `get_table_columns`
- `get_upcoming_elections`
- `link_anonymous_votes_to_user`
- `optimize_database_performance`
- `run_maintenance_job`
- `update_cache_performance_metrics`
- `update_poll_demographic_insights`

> Notes:
> - Views are suffixed with `_v` or `_view`.
> - The functions list is provided for discovery; consult `/web/types/supabase.ts` for exact signatures.

---

## Table of Contents

1. [Core Tables](#core-tables)
2. [Authentication & Trust](#authentication--trust)
3. [Polls & Voting](#polls--voting)
4. [Civic Engagement](#civic-engagement)
5. [Representatives & Officials](#representatives--officials)
6. [Analytics & Monitoring](#analytics--monitoring)
7. [Hashtags & Trending](#hashtags--trending)
8. [Feeds & Content](#feeds--content)
9. [PWA & Notifications](#pwa--notifications)
10. [Admin & Permissions](#admin--permissions)
11. [Performance & Health](#performance--health)
12. [RPC Functions](#rpc-functions)

---

## Core Tables

### `user_profiles`
User profile information and preferences.

**Columns** (14):
- `id` UUID PRIMARY KEY
- `user_id` UUID (FK to auth.users)
- `username` TEXT UNIQUE
- `email` TEXT
- `display_name` TEXT
- `bio` TEXT
- `avatar_url` TEXT
- `trust_tier` TEXT (T0, T1, T2, T3)
- `is_admin` BOOLEAN
- `is_active` BOOLEAN
- `demographics` JSONB (age_group, geographic_region, education, etc.)
- `privacy_settings` JSONB (profile_visibility, share_demographics, etc.)
- `primary_concerns` TEXT[]
- `community_focus` TEXT[]
- `participation_style` TEXT
- `created_at`, `updated_at` TIMESTAMPTZ

**Notes**: 
- `demographics` JSONB can store district information (no full addresses stored)
- `privacy_settings` controls data collection and visibility
- Trust tier ranges from T0 (low) to T3 (highest trust)

### `user_sessions`
Tracks active user sessions across devices.

**Columns** (14):
- `id` UUID PRIMARY KEY
- `user_id` UUID (FK to auth.users)
- `session_token` TEXT UNIQUE
- `device_info` JSONB
- `ip_address` INET
- `user_agent` TEXT
- `is_active` BOOLEAN
- `last_activity` TIMESTAMPTZ
- `expires_at` TIMESTAMPTZ
- `created_at`, `updated_at` TIMESTAMPTZ

### `user_roles`
User role assignments for RBAC.

**Columns**:
- `id` UUID PRIMARY KEY
- `user_id` UUID (FK to user_profiles)
- `role_id` UUID (FK to roles)
- `assigned_at` TIMESTAMPTZ
- `assigned_by` UUID

### `user_hashtags`
User-specific hashtag preferences and follows.

**Columns** (9):
- `id` UUID PRIMARY KEY
- `user_id` UUID
- `hashtag_id` UUID (FK to hashtags)
- `is_following` BOOLEAN
- `notification_enabled` BOOLEAN
- `priority` INTEGER
- `created_at`, `updated_at` TIMESTAMPTZ

---

## Authentication & Trust

### `webauthn_credentials`
Stores WebAuthn/Passkey credentials for passwordless authentication.

**Columns** (10):
- `id` TEXT PRIMARY KEY (credential_id)
- `user_id` UUID (FK to auth.users)
- `public_key` BYTEA
- `counter` BIGINT
- `transports` TEXT[]
- `device_type` TEXT
- `backed_up` BOOLEAN
- `created_at`, `updated_at` TIMESTAMPTZ

### `webauthn_challenges`
Temporary challenges for WebAuthn authentication flows.

**Columns** (6):
- `id` UUID PRIMARY KEY
- `challenge` TEXT UNIQUE
- `user_id` UUID
- `expires_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ

### `biometric_trust_scores`
Trust scores derived from biometric authentication.

**Columns**:
- `id` UUID PRIMARY KEY
- `user_id` UUID (FK to auth.users)
- `credential_id` TEXT (FK to webauthn_credentials)
- `trust_score` NUMERIC(3,2) (0.00-1.00)
- `confidence_level` NUMERIC(3,2)
- `factors` JSONB (device_trust, usage_patterns, etc.)
- `device_info` JSONB
- `created_at`, `updated_at` TIMESTAMPTZ

### `trust_tier_analytics`
Tracks trust tier changes over time (audit log).

**Columns** (6):
- `id` UUID PRIMARY KEY
- `user_id` UUID (FK to user_profiles)
- `trust_tier` TEXT (T0, T1, T2, T3)
- `previous_tier` TEXT
- `tier_change_reason` TEXT
- `changed_by` UUID
- `created_at` TIMESTAMPTZ

**Note**: String-based tier values ("T0", "T1", "T2", "T3")

### `trust_tier_progression`
Detailed trust tier progression with metadata.

**Columns** (9):
- `id` UUID PRIMARY KEY
- `user_id` UUID (FK to user_profiles)
- `new_tier` INTEGER (0, 1, 2, 3)
- `previous_tier` INTEGER
- `progression_reason` TEXT
- `reason` TEXT
- `progression_data` JSONB
- `created_at`, `updated_at` TIMESTAMPTZ

**Note**: Numeric tier values (0-3). More detailed than `trust_tier_analytics`.

### `civic_database_entries`
User civic engagement tracking and representative connections.

**Columns**:
- `id` UUID PRIMARY KEY
- `user_id` UUID (FK to user_profiles)
- `user_hash` TEXT (privacy-safe identifier)
- `stable_user_id` TEXT
- `total_polls_participated` INTEGER
- `total_votes_cast` INTEGER
- `average_engagement_score` NUMERIC
- `current_trust_tier` TEXT
- `trust_tier_history` JSONB[]
- `representative_district` TEXT (district only, never full address)
- `representative_id` TEXT
- `last_representative_contact` TIMESTAMPTZ
- `data_sharing_consent` BOOLEAN
- `consent_date`, `consent_version` TEXT
- `created_at`, `updated_at` TIMESTAMPTZ

**Privacy Note**: Only stores district-level location, never full addresses.

---

## Polls & Voting

### `polls`
Poll creation and configuration.

**Columns** (59):
- `id` UUID PRIMARY KEY
- `title` TEXT
- `description` TEXT
- `category` TEXT
- `created_by` UUID (FK to user_profiles)
- `status` TEXT (draft, active, closed, archived)
- `privacy_level` TEXT (public, private, unlisted)
- `voting_method` TEXT (single_choice, multiple_choice, ranked_choice)
- `voting_config` JSONB (allow_multiple_votes, max_choices, etc.)
- `end_date`, `end_time` TIMESTAMPTZ
- `allow_post_close`, `allow_reopen` BOOLEAN
- `auto_lock_at` TIMESTAMPTZ
- `close_reason` TEXT
- `closed_at` TIMESTAMPTZ
- `baseline_at` TIMESTAMPTZ
- `total_votes` INTEGER
- `offline_created` BOOLEAN
- ... and 42 more configuration columns
- `created_at`, `updated_at` TIMESTAMPTZ

**Notes**:
- Rich configuration stored in `voting_config` JSONB
- Does NOT have `allow_multiple_votes` as separate column (in JSONB)
- Supports offline poll creation

### `poll_options`
Individual options/choices for polls.

**Columns** (7):
- `id` UUID PRIMARY KEY
- `poll_id` UUID (FK to polls)
- `option_text` TEXT
- `option_order` INTEGER
- `vote_count` INTEGER DEFAULT 0
- `metadata` JSONB
- `created_at` TIMESTAMPTZ

### `votes`
Individual vote records.

**Columns** (14):
- `id` UUID PRIMARY KEY
- `poll_id` UUID (FK to polls)
- `option_id` UUID (FK to poll_options)
- `user_id` UUID (FK to user_profiles, nullable for anonymous)
- `voter_session` TEXT (for anonymous voting)
- `poll_question` TEXT
- `poll_option_id` UUID
- `trust_tier` INTEGER
- `vote_weight` NUMERIC
- `vote_status` TEXT
- `ip_address` INET
- `offline_synced` BOOLEAN
- `offline_timestamp` BIGINT
- `linked_at` TIMESTAMPTZ (when anonymous vote linked to user)
- `created_at`, `updated_at` TIMESTAMPTZ

**Notes**:
- Supports both authenticated and anonymous voting
- Does NOT store user aggregate metrics (those are calculated)
- Tracks offline votes for PWA support

### `vote_trust_tiers`
Trust tier assignments for votes.

**Columns**:
- `id` UUID PRIMARY KEY
- `vote_id` UUID (FK to votes)
- `trust_tier` INTEGER (0-3)
- `assigned_at` TIMESTAMPTZ

### `user_voting_history`
Aggregated voting history per user.

**Columns**:
- `id` UUID PRIMARY KEY
- `user_id` UUID (FK to user_profiles)
- `poll_id` UUID (FK to polls)
- `voted_at` TIMESTAMPTZ
- `vote_data` JSONB
- `created_at` TIMESTAMPTZ

### `poll_participation_analytics`
Analytics for poll participation patterns.

**Columns**:
- `id` UUID PRIMARY KEY
- `poll_id` UUID (FK to polls)
- `user_id` UUID (FK to user_profiles)
- `trust_tier` INTEGER
- `demographic_data` JSONB
- `participation_timestamp` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ

---

## Civic Engagement

### `civic_actions`
Petitions, campaigns, and civic actions.

**Columns** (18):
- `id` UUID PRIMARY KEY
- `title` TEXT
- `description` TEXT
- `action_type` TEXT (petition, campaign, contact_rep, etc.)
- `created_by` UUID (FK to user_profiles)
- `status` TEXT (draft, active, completed, archived)
- `target_representative_id` INTEGER
- `target_office`, `target_state`, `target_district` TEXT
- `required_signatures`, `current_signatures` INTEGER
- `start_date`, `end_date` TIMESTAMPTZ
- `offline_synced` BOOLEAN
- `created_at`, `updated_at` TIMESTAMPTZ

**Notes**:
- Does NOT have `category` column (use `action_type`)
- Supports district-level targeting
- PWA offline sync support

### `civic_action_metadata`
Additional metadata for civic actions.

**Columns** (6):
- `id` UUID PRIMARY KEY
- `civic_action_id` UUID (FK to civic_actions)
- `metadata_key` TEXT
- `metadata_value` JSONB
- `created_at`, `updated_at` TIMESTAMPTZ

### `contact_messages`
Messages sent to representatives.

**Columns** (11):
- `id` UUID PRIMARY KEY
- `user_id` UUID (FK to user_profiles)
- `representative_id` INTEGER (FK to representatives_core)
- `subject` TEXT
- `message` TEXT
- `status` TEXT (draft, sent, delivered, bounced, replied)
- `sent_at`, `delivered_at`, `replied_at` TIMESTAMPTZ
- `offline_synced` BOOLEAN
- `created_at`, `updated_at` TIMESTAMPTZ

### `contact_threads`
Threading for representative correspondence.

**Columns**:
- `id` UUID PRIMARY KEY
- `initial_message_id` UUID (FK to contact_messages)
- `user_id` UUID
- `representative_id` INTEGER
- `thread_subject` TEXT
- `message_count` INTEGER
- `last_activity` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ

### `message_delivery_logs`
Tracks message delivery status.

**Columns**:
- `id` UUID PRIMARY KEY
- `message_id` UUID (FK to contact_messages)
- `delivery_status` TEXT
- `delivery_timestamp` TIMESTAMPTZ
- `delivery_metadata` JSONB
- `created_at` TIMESTAMPTZ

---

## Representatives & Officials

### `representatives_core`
Canonical record for every active representative and elected official. Column lengths reflect the live Supabase schema (verified via `scripts/inspect-schema.ts`).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `integer` | Primary key |
| `name` | `varchar(255)` | Full display name |
| `office` | `varchar(255)` | Title/role (e.g. “State Representative”) |
| `level` | `varchar(20)` | `federal` \| `state` \| `local` |
| `state` | `varchar(2)` | USPS postal abbreviation |
| `district` | `varchar(50)` | Legislative district (nullable) |
| `party` | `varchar(100)` | Party affiliation |
| `openstates_id` | `varchar(255)` | Raw OpenStates person ID |
| `canonical_id` | `varchar(255)` | Choices canonical identifier |
| `is_active` | `boolean` | Current term flag |
| `created_at`, `updated_at`, `last_verified` | `timestamptz` | Audit columns |
| `data_quality_score` | `integer` | Legacy scoring field (nullable) |
| `verification_status` | `varchar(50)` | `verified` \| `unverified` etc. |
| `bioguide_id`, `fec_id`, `google_civic_id`, `legiscan_id`, `congress_gov_id`, `govinfo_id` | `varchar(20-50)` | Identifier fields (`bioguide_id`/`fec_id` are `varchar(20)`) |
| `wikipedia_url`, `ballotpedia_url`, `facebook_url`, `linkedin_url`, `primary_website`, `primary_photo_url` | `varchar(500)` | Long-form provenance URLs |
| `twitter_handle`, `instagram_handle` | `varchar(50)` | Handles without the `@` |
| `youtube_channel` | `varchar(100)` | YouTube channel or custom handle |
| `primary_email` | `varchar(255)` | Preferred email |
| `primary_phone` | `varchar(20)` | Normalised phone |
| `term_start_date`, `term_end_date`, `next_election_date` | `date` | Term metadata |
| `data_sources` | `jsonb` | Aggregated provenance entries |

### `representative_photos`
Photo gallery sourced from OpenStates and enrichment providers.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `integer` | Primary key |
| `representative_id` | `integer` | FK → `representatives_core.id` |
| `url` | `text` | Image URL |
| `source` | `varchar(100)` | Origin (e.g. `openstates_yaml`) |
| `width`, `height` | `integer` | Optional dimension hints |
| `alt_text`, `attribution` | `text` | Accessibility metadata |
| `is_primary` | `boolean` | True for main profile photo |
| `created_at`, `updated_at` | `timestamptz` | Audit columns |

### `representative_social_media`
Denormalised social handles per platform (one row per representative + platform).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `integer` | Primary key |
| `representative_id` | `integer` | FK → `representatives_core.id` |
| `platform` | `varchar(50)` | `twitter`, `facebook`, etc. |
| `handle` | `varchar(100)` | Platform-specific username |
| `url` | `text` | Canonical profile URL (nullable) |
| `is_primary`, `is_verified`, `verified` | `boolean` | Flags carried from sources |
| `followers_count` | `bigint` | Optional enrichment metric |
| `created_at`, `updated_at` | `timestamptz` | Audit columns |

### `representative_contacts`
Stores phone/email/address/contact rows with a uniqueness constraint on `(representative_id, contact_type, value)`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `integer` | Primary key |
| `representative_id` | `integer` | FK → `representatives_core.id` |
| `contact_type` | `varchar(50)` | Normalised category (`phone`, `email`, `website`, `address`, `fax`) |
| `value` | `text` | Raw contact string |
| `is_primary`, `is_verified` | `boolean` | Flags from source or ingest |
| `source` | `varchar(100)` | Provenance (`openstates_yaml`, etc.) |
| `created_at`, `updated_at` | `timestamptz` | Audit columns |

### `representative_activity`
Activity tracking (votes, bills, etc.).

**Columns**:
- `id` SERIAL PRIMARY KEY
- `representative_id` INTEGER (FK to representatives_core)
- `activity_type` TEXT
- `activity_date` DATE
- `activity_data` JSONB
- `created_at` TIMESTAMPTZ

### `representative_committees`
Committee assignments.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `integer` | Primary key |
| `representative_id` | `integer` | FK → `representatives_core.id` |
| `committee_name` | `varchar(255)` | Normalised title/committee |
| `role` | `varchar(100)` | Role within committee (nullable) |
| `start_date`, `end_date` | `date` | Membership term |
| `is_current` | `boolean` | Derived flag |
| `created_at`, `updated_at` | `timestamptz` | Audit columns |

### `representative_campaign_finance`
Campaign finance rollups sourced from the FEC (one row per representative).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `integer` | Primary key |
| `representative_id` | `integer` | Unique FK → `representatives_core.id` |
| `cycle` | `integer` | Election cycle |
| `total_raised`, `total_spent`, `cash_on_hand` | `numeric` | Monetary summary |
| `small_donor_percentage` | `numeric` | Derived ratio |
| `top_contributors` | `jsonb` | Array of structured contributor objects |
| `last_filing_date` | `date` | Latest available filing |
| `source` | `varchar(50)` | Primary ingest source (e.g. `fec`) |
| `sources` | `text[]` | Secondary provenance |
| `office_code`, `district` | `text` | FEC metadata |
| `created_at`, `updated_at` | `timestamptz` | Audit columns |

### `representative_data_quality`
Data quality scoring.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `integer` | Primary key |
| `representative_id` | `integer` | FK → `representatives_core.id` |
| `data_completeness`, `overall_confidence`, `primary_source_score`, `secondary_source_score`, `source_reliability` | `numeric` | Component quality metrics |
| `validation_method` | `varchar(50)` | e.g. `openstates_sync` |
| `last_validated` | `timestamptz` | Timestamp of scoring |
| `created_at`, `updated_at` | `timestamptz` | Audit columns |

### `representative_data_sources`
Track data sources per representative.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `integer` | Primary key |
| `representative_id` | `integer` | FK → `representatives_core.id` |
| `source_name` | `varchar(50)` | Human-friendly label |
| `source_type` | `varchar(50)` | System identifier (`openstates`, `openstates_source`, etc.) |
| `confidence` | `varchar(20)` | `high`, `medium`, etc. |
| `validation_status` | `varchar(20)` | `synced`, `stale`, etc. |
| `last_updated`, `updated_at`, `created_at` | `timestamptz` | Timestamps |
| `raw_data` | `jsonb` | Structured payload (e.g. source URLs) |

> **Uniqueness**: `(representative_id, source_name, source_type)` must be unique (`unique_representative_data_sources`).

### `representative_crosswalk_enhanced` & `representative_enhanced_crosswalk`
ID mapping between external systems (two variations).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `integer` | Primary key |
| `representative_id` | `integer` | FK → `representatives_core.id` (nullable for orphan IDs) |
| `canonical_id` | `varchar(255)` | Canonical Choices identifier |
| `source_system` | `varchar(50)` | e.g. `openstates`, `fec`, `bioguide` |
| `source_id` | `varchar(255)` | External identifier |
| `source_confidence` | `varchar(20)` | Confidence flag |
| `last_verified`, `created_at`, `updated_at` | `timestamptz` | Audit columns |

> **Uniqueness**: `(source_system, source_id)` enforced by `unique_representative_crosswalk_enhanced`.

### `id_crosswalk`
General-purpose ID crosswalk table.

**Columns**:
- `id` UUID PRIMARY KEY
- `source_system` TEXT
- `source_id` TEXT
- `target_system` TEXT
- `target_id` TEXT
- `confidence` NUMERIC
- `verified` BOOLEAN
- `created_at`, `updated_at` TIMESTAMPTZ

### OpenStates Integration Tables

Integration with OpenStates API for state legislature data:

- **`openstates_people_data`**: Core person data
- **`openstates_people_contacts`**: Contact information
- **`openstates_people_identifiers`**: External identifiers
- **`openstates_people_other_names`**: Alternate names
- **`openstates_people_roles`**: Current and past roles
- **`openstates_people_social_media`**: Social media accounts
- **`openstates_people_sources`**: Data sources

---

## Analytics & Monitoring

### `analytics_events`
Generic event tracking.

**Columns** (9):
- `id` UUID PRIMARY KEY
- `event_type` TEXT
- `user_id` UUID (FK to user_profiles, nullable)
- `session_id` UUID
- `event_data` JSONB
- `ip_address` INET
- `user_agent` TEXT
- `referrer` TEXT
- `created_at` TIMESTAMPTZ

**Usage**: Store ANY analytics event with flexible JSONB data.

### `analytics_event_data`
Normalized event data for efficient querying.

**Columns**:
- `id` SERIAL PRIMARY KEY
- `event_id` UUID (FK to analytics_events)
- `data_key` TEXT
- `data_value` TEXT
- `data_type` TEXT
- `created_at` TIMESTAMPTZ

### `platform_analytics`
Platform-wide analytics aggregates.

**Columns**:
- `id` UUID PRIMARY KEY
- `metric_name` TEXT
- `metric_value` NUMERIC
- `metric_data` JSONB
- `recorded_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ

### `narrative_analysis_results`
AI-powered narrative analysis results.

**Columns**:
- `id` UUID PRIMARY KEY
- `poll_id` UUID (FK to polls)
- `analysis_type` TEXT
- `narrative_clusters` JSONB
- `divergence_score` NUMERIC
- `confidence_level` NUMERIC
- `analyzed_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ

### `bot_detection_logs`
Bot detection results.

**Columns** (7):
- `id` UUID PRIMARY KEY
- `user_id` UUID (FK to user_profiles)
- `detection_type` TEXT (pattern, timing, behavior)
- `detection_score` NUMERIC (0.0-1.0)
- `detection_reasons` JSONB
- `is_confirmed_bot` BOOLEAN
- `human_reviewed` BOOLEAN
- `created_at` TIMESTAMPTZ

### `trending_topics`
Trending topic tracking.

**Columns**:
- `id` UUID PRIMARY KEY
- `topic_name` TEXT
- `topic_type` TEXT (hashtag, poll, issue)
- `trend_score` NUMERIC
- `participant_count` INTEGER
- `velocity` NUMERIC (growth rate)
- `peak_at` TIMESTAMPTZ
- `recorded_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ

---

## Hashtags & Trending

### `hashtags`
Core hashtag data.

**Columns** (12):
- `id` UUID PRIMARY KEY
- `tag` TEXT UNIQUE
- `normalized_tag` TEXT
- `usage_count` INTEGER DEFAULT 0
- `trending_score` NUMERIC DEFAULT 0
- `is_trending` BOOLEAN DEFAULT FALSE
- `is_featured` BOOLEAN
- `is_blocked` BOOLEAN
- `category` TEXT
- `first_used_at`, `last_used_at` TIMESTAMPTZ
- `created_at`, `updated_at` TIMESTAMPTZ

### `hashtag_usage`
Tracks hashtag usage in content.

**Columns**:
- `id` UUID PRIMARY KEY
- `hashtag_id` UUID (FK to hashtags)
- `content_type` TEXT (poll, civic_action, comment)
- `content_id` UUID
- `user_id` UUID
- `used_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ

### `hashtag_engagement`
User engagement with hashtags.

**Columns** (7):
- `id` UUID PRIMARY KEY
- `hashtag_id` UUID (FK to hashtags)
- `user_id` UUID (FK to user_profiles)
- `engagement_type` TEXT (view, click, vote, share)
- `engagement_count` INTEGER
- `last_engaged_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ

### `hashtag_flags`
Moderation flags for hashtags.

**Columns** (10):
- `id` UUID PRIMARY KEY
- `hashtag_id` UUID (FK to hashtags)
- `flagged_by` UUID (FK to user_profiles)
- `flag_reason` TEXT
- `flag_type` TEXT (spam, inappropriate, misinformation)
- `status` TEXT (pending, reviewed, resolved)
- `reviewed_by` UUID
- `reviewed_at` TIMESTAMPTZ
- `resolution` TEXT
- `created_at` TIMESTAMPTZ

### `hashtag_user_preferences`
User hashtag preferences.

**Columns**:
- `id` UUID PRIMARY KEY
- `user_id` UUID (FK to user_profiles)
- `hashtag_id` UUID (FK to hashtags)
- `preference_type` TEXT (follow, mute, block)
- `notification_enabled` BOOLEAN
- `created_at`, `updated_at` TIMESTAMPTZ

---

## Feeds & Content

### `feeds`
User-specific feeds.

**Columns** (7):
- `id` UUID PRIMARY KEY
- `user_id` UUID (FK to user_profiles)
- `feed_type` TEXT (home, following, trending, civic)
- `feed_config` JSONB
- `last_refreshed` TIMESTAMPTZ
- `created_at`, `updated_at` TIMESTAMPTZ

### `feed_items`
Items in feeds.

**Columns** (10):
- `id` UUID PRIMARY KEY
- `feed_id` UUID (FK to feeds)
- `item_type` TEXT (poll, civic_action, representative)
- `item_id` UUID
- `relevance_score` NUMERIC
- `position` INTEGER
- `shown_at` TIMESTAMPTZ
- `expires_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ

### `feed_interactions`
User interactions with feed items.

**Columns** (7):
- `id` UUID PRIMARY KEY
- `feed_item_id` UUID (FK to feed_items)
- `user_id` UUID (FK to user_profiles)
- `interaction_type` TEXT (view, click, vote, share, hide, report)
- `interaction_data` JSONB
- `interacted_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ

---

## PWA & Notifications

### `push_subscriptions`
Web Push API subscriptions.

**Columns** (11):
- `id` UUID PRIMARY KEY
- `user_id` UUID (FK to auth.users)
- `endpoint` TEXT UNIQUE
- `p256dh_key` TEXT (encryption key)
- `auth_key` TEXT (authentication secret)
- `subscription_data` JSONB (full subscription object)
- `preferences` JSONB (notification preferences)
- `is_active` BOOLEAN DEFAULT TRUE
- `created_at`, `updated_at`, `deactivated_at` TIMESTAMPTZ

### `notification_log`
Notification delivery tracking.

**Columns** (9):
- `id` UUID PRIMARY KEY
- `subscription_id` UUID (FK to push_subscriptions)
- `user_id` UUID (FK to auth.users)
- `title`, `body` TEXT
- `payload` JSONB
- `status` TEXT (sent, failed, pending)
- `error_message` TEXT
- `sent_at` TIMESTAMPTZ

### `sync_log`
Background sync operation tracking.

**Columns** (8):
- `id` UUID PRIMARY KEY
- `user_id` UUID (FK to auth.users)
- `device_id` TEXT
- `total_actions`, `success_count`, `failure_count` INTEGER
- `synced_at` TIMESTAMPTZ
- `duration_ms` INTEGER
- `sync_details` JSONB

---

## Admin & Permissions

### `admin_activity_log`
Admin action audit log.

**Columns** (8):
- `id` UUID PRIMARY KEY
- `admin_id` UUID (FK to user_profiles)
- `action` TEXT
- `details` JSONB
- `ip_address` INET
- `user_agent` TEXT
- `timestamp` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ

### `roles`
Available roles in the system.

**Columns**:
- `id` UUID PRIMARY KEY
- `name` TEXT UNIQUE
- `description` TEXT
- `is_system_role` BOOLEAN
- `created_at`, `updated_at` TIMESTAMPTZ

### `permissions`
Available permissions.

**Columns**:
- `id` UUID PRIMARY KEY
- `name` TEXT UNIQUE
- `description` TEXT
- `resource` TEXT
- `action` TEXT
- `created_at` TIMESTAMPTZ

### `role_permissions`
Role to permission mapping.

**Columns**:
- `id` UUID PRIMARY KEY
- `role_id` UUID (FK to roles)
- `permission_id` UUID (FK to permissions)
- `granted_at` TIMESTAMPTZ

---

## Performance & Health

### `performance_metrics`
System performance metrics.

**Columns**:
- `id` UUID PRIMARY KEY
- `metric_name` TEXT
- `metric_value` NUMERIC
- `metric_unit` TEXT
- `recorded_at` TIMESTAMPTZ
- `metadata` JSONB
- `created_at` TIMESTAMPTZ

**Note**: Table exists in schema but may not be actively used.

### `query_performance_log`
Query performance tracking.

**Columns**:
- `id` UUID PRIMARY KEY
- `query_signature` TEXT
- `execution_time_ms` NUMERIC
- `rows_returned` INTEGER
- `cache_hit` BOOLEAN
- `executed_at` TIMESTAMPTZ
- `query_metadata` JSONB
- `created_at` TIMESTAMPTZ

**Note**: Table exists in schema but may not be actively used.

### `cache_performance_log`
Cache operation tracking.

**Columns**:
- `id` UUID PRIMARY KEY
- `cache_key` TEXT
- `cache_operation` TEXT (get, set, delete)
- `cache_type` TEXT (redis, memory, db)
- `is_hit` BOOLEAN
- `operation_time_ms` NUMERIC
- `cache_size_bytes` INTEGER
- `namespace` TEXT
- `ttl_seconds` INTEGER
- `expires_at` TIMESTAMPTZ
- `recorded_at` TIMESTAMPTZ

**Note**: Table exists in schema but may not be actively used.

### `system_health`
System health monitoring.

**Columns** (9):
- `id` UUID PRIMARY KEY
- `component` TEXT
- `status` TEXT (healthy, degraded, down)
- `response_time_ms` NUMERIC
- `error_rate` NUMERIC
- `uptime_percentage` NUMERIC
- `last_check` TIMESTAMPTZ
- `metadata` JSONB
- `created_at` TIMESTAMPTZ

### `rate_limits`
Rate limit tracking.

**Columns**:
- `id` UUID PRIMARY KEY
- `identifier` TEXT (user_id, ip_address, api_key)
- `identifier_type` TEXT
- `endpoint` TEXT
- `request_count` INTEGER
- `window_start` TIMESTAMPTZ
- `window_end` TIMESTAMPTZ
- `limit_exceeded` BOOLEAN
- `created_at` TIMESTAMPTZ

---

## Additional Tables

### `candidate_platforms`
Candidate platform data (see [Candidate Types](../web/types/candidate.ts)).

**Columns** (23):
- Core candidate info (name, office, level, state, district)
- Platform positions (JSONB array)
- Campaign info (website, email, phone, funding)
- Official filing data
- Verification status
- Visibility and status flags

### `feedback`
User feedback submissions.

**Columns** (17):
- `id` UUID PRIMARY KEY
- `user_id` UUID
- `feedback_type` TEXT
- `category` TEXT
- `title`, `message` TEXT
- `severity` TEXT
- `status` TEXT
- `priority` TEXT
- `assigned_to` UUID
- `metadata` JSONB
- `attachments` TEXT[]
- `is_anonymous` BOOLEAN
- `created_at`, `updated_at`, `resolved_at` TIMESTAMPTZ

### `site_messages`
System-wide announcements.

**Columns** (14):
- `id` UUID PRIMARY KEY
- `message_type` TEXT (info, warning, error, maintenance)
- `title`, `content` TEXT
- `severity` TEXT
- `is_active` BOOLEAN
- `start_time`, `end_time` TIMESTAMPTZ
- `target_audience` TEXT (all, admins, specific_users)
- `created_by` UUID
- `created_at`, `updated_at` TIMESTAMPTZ

### `feature_usage`
Feature usage tracking.

**Columns**:
- `id` UUID PRIMARY KEY
- `feature_name` TEXT
- `user_id` UUID
- `usage_count` INTEGER
- `last_used` TIMESTAMPTZ
- `usage_data` JSONB
- `created_at` TIMESTAMPTZ

---

## RPC Functions

The database includes 19 RPC (Remote Procedure Call) functions for complex operations:

### Analytics Functions
1. **`analyze_narrative_divergence`** - AI-powered narrative divergence analysis
2. **`analyze_polls_table`** - Table-level poll analytics
3. **`analyze_query_performance`** - Query performance analysis
4. **`get_real_time_analytics`** - Real-time analytics aggregation
5. **`get_poll_results_by_trust_tier`** - Poll results filtered by trust tier
6. **`get_poll_votes_by_trust_tier`** - Vote breakdown by trust tier
7. **`get_personalized_recommendations`** - AI recommendations for users

### Trust & Voting Functions
8. **`calculate_trust_filtered_votes`** - Vote counts filtered by trust tier
9. **`calculate_user_trust_tier`** - Calculate user's trust tier score
10. **`link_anonymous_votes_to_user`** - Link anonymous votes when user authenticates

### ⚠️ REMOVED Functions (Historical Record)
- ~~**`calculate_trust_weighted_votes`**~~ - **REMOVED - VIOLATED VOTING INTEGRITY**
  - **Status**: ✅ REMOVED from database (November 5, 2025)
  - **Issue**: Would have weighted votes by trust tier (1 vote ≠ 1 vote)
  - **Policy**: "A vote is a vote. Period." - All votes count equally
  - **Migration**: `remove-vote-weighting-function.sql` executed successfully
  - **Alternative**: Use `calculate_trust_filtered_votes` for analytics DISPLAY only
  - **Verified**: Function was NEVER used in codebase (clean before removal)

### Hashtag Functions
12. **`get_hashtag_trending_history`** - Historical trending data for hashtags

### Maintenance Functions
13. **`cleanup_expired_data`** - Remove expired sessions, rate limits, etc.
14. **`optimize_database_performance`** - Run VACUUM, ANALYZE, rebuild indexes
15. **`run_maintenance_job`** - Scheduled maintenance tasks

### Heatmap Function
16. **`get_heatmap`** - District-level engagement heatmap (k-anonymity enforced)
   - Parameters: `state_filter`, `level_filter`, `min_count`
   - Returns: district engagement data with k-anonymity (min 5 users)
   - Privacy-safe: Only shows aggregated district-level data

### Analytics Updates
17. **`update_cache_performance_metrics`** - Update cache performance statistics
18. **`update_poll_demographic_insights`** - Calculate demographic insights for polls

### Performance Functions
19. **`get_performance_recommendations`** - Suggest performance optimizations

---

## Schema Notes & Best Practices

### Privacy by Design
- **No full addresses stored**: Only district-level location data
- **K-anonymity enforced**: Heatmap requires minimum 5 users per district
- **Opt-in analytics**: All tracking respects user privacy settings
- **Anonymous voting**: Support for both authenticated and anonymous votes
- **HMAC-based privacy**: Address hashing for cache keys without storing addresses

### Data Storage Patterns
- **JSONB for flexible data**: `demographics`, `privacy_settings`, `event_data`, etc.
- **Trust tiers**: Two tables (`trust_tier_analytics` vs `trust_tier_progression`) - consider consolidation
- **Offline support**: Many tables have `offline_synced` fields for PWA
- **Audit logging**: Comprehensive audit trails for admin actions, trust changes, notifications

### Performance Considerations
- **Materialized views**: Some analytics may use materialized views (not visible in schema)
- **Indexes**: Critical indexes on foreign keys, user lookups, timestamps
- **RPC functions**: Complex queries encapsulated in database functions
- **Cache tracking**: Tables for cache and query performance (may not be actively used)

### Known Schema Issues
1. **Duplicate tables**: `trust_tier_analytics` vs `trust_tier_progression` serve similar purposes
2. **Performance tables**: `performance_metrics`, `query_performance_log`, `cache_performance_log` exist but may not be fully utilized
3. **Representative crosswalk**: Two similar tables (`representative_crosswalk_enhanced` and `representative_enhanced_crosswalk`)

### Migration Strategy
- Schema is Supabase-managed
- Regenerate types after schema changes: `npm run types:generate`
- Types are source of truth: `/web/types/supabase.ts`
- Always verify against generated types, not assumptions

---

## Generating Updated Types

To regenerate TypeScript types after schema changes:

```bash
cd web
npm run types:generate
```

This runs:
```bash
npx supabase gen types typescript --project-id muqwrehywjrbaeerjgfb > types/supabase.ts
```

---

## See Also

- [Privacy Policy](./PRIVACY_POLICY.md) - Data collection and privacy practices
- [Security Documentation](./SECURITY.md) - Security measures and best practices
- [Environment Variables](./ENVIRONMENT_VARIABLES.md) - Required configuration
- [Database Migrations](../supabase/migrations/) - Schema change history

---

**Generated**: November 16, 2025  
**Method**: Summarized from `/web/types/supabase.ts` (Supabase-generated)  
**Confidence**: HIGH - Aligned with current generated types

---

## Selected Table Details (current columns)

### `voter_registration_resources`
- `state_code` text (PK)
- `online_url` text | null
- `mail_form_url` text | null
- `mailing_address` text | null
- `election_office_name` text | null
- `status_check_url` text | null
- `special_instructions` text | null
- `sources` text[] (default {})
- `metadata` jsonb | null
- `last_verified` timestamptz
- `created_at` timestamptz
- `updated_at` timestamptz

### `representatives_core`
- `id` integer (PK)
- `name` text
- `office` text
- `level` text
- `state` text
- `district` text | null
- `party` text | null
- `openstates_id` text | null
- `canonical_id` text | null
- `is_active` boolean | null
- `created_at` timestamptz | null

### `representative_data_quality`
- `id` integer (PK, 1:1 with representative)
- `representative_id` integer (unique FK)
- `data_completeness`, `overall_confidence`, `primary_source_score`, `secondary_source_score`, `source_reliability` numeric | null
- `validation_method` text | null
- `last_validated` timestamptz | null
- `created_at`, `updated_at` timestamptz | null

### `representative_data_sources`
- `id` integer (PK)
- `representative_id` integer | null (FK)
- `source_name` text
- `source_type` text
- `confidence` text
- `validation_status` text | null
- `raw_data` jsonb | null
- `last_updated` timestamptz | null
- `created_at`, `updated_at` timestamptz | null

### `representative_divisions`
- `representative_id` integer (FK)
- `division_id` text
- `level` text | null
- `source` text
- `created_at`, `updated_at` timestamptz

### `representative_activity`
- `id` integer (PK)
- `representative_id` integer (FK)
- `type` text
- `title` text
- `description` text | null
- `date` date | null
- `source`, `source_url`, `url` text | null
- `metadata` jsonb | null
- `created_at`, `updated_at` timestamptz | null

### `permissions`
- `id` uuid (PK)
- `name` text
- `resource` text
- `action` text
- `description` text | null
- `created_at` timestamptz | null

### `rate_limits`
- `id` uuid (PK)
- `endpoint` text
- `ip_address` inet
- `request_count` integer | null
- `expires_at` timestamptz | null
- `created_at` timestamptz | null

### `feature_usage`
- `id` uuid (PK)
- `user_id` uuid | null
- `session_id` uuid | null
- `feature_name` text
- `action_type` text
- `success` boolean | null
- `duration` integer | null
- `context`, `metadata` jsonb | null
- `error_message` text | null
- `timestamp` timestamptz | null

### `id_crosswalk`
- `id` serial (PK)
- `canonical_id` text
- `entity_type` text
- `source` text
- `source_id` text
- `attrs` jsonb | null
- `created_at`, `updated_at` timestamptz | null

### `representative_crosswalk_enhanced` / `representative_enhanced_crosswalk`
- `id` integer (PK)
- `representative_id` integer | null (FK)
- `canonical_id` text
- `source_system` text
- `source_id` text
- `source_confidence` text | null
- `last_verified` timestamptz | null
- `created_at`, `updated_at` timestamptz | null

### `representative_data_sources`
See detailed section above. Uniqueness: `(representative_id, source_name, source_type)`.

### `openstates_people_data`
- Core person data snapshot from OpenStates:
- `id` integer (PK), `openstates_id` text, `name` text, `state` text, `level` text | null, `party` text | null,
  `roles` jsonb | null, `identifiers` jsonb | null, `extras` jsonb | null, timestamps.
> See `/web/types/supabase.ts` for full column list for all `openstates_*` tables below.

### `openstates_people_contacts`
- Contact rows linked to OpenStates people:
- `id` integer (PK), `openstates_id` text, `contact_type` text, `value` text, `note` text | null, timestamps.

### `openstates_people_roles`
- Current/past roles:
- `id` integer (PK), `openstates_id` text, `role` text, `district` text | null, `start_date`, `end_date` date | null, timestamps.

### `openstates_people_social_media`
- Social handles per platform:
- `id` integer (PK), `openstates_id` text, `platform` text, `handle` text, `url` text | null, timestamps.

### `openstates_people_identifiers`, `openstates_people_other_names`, `openstates_people_sources`
- Identifier mapping, alternate names, provenance sources. All carry integer `id` PK, `openstates_id` text, payload columns, timestamps.

### `civic_actions`
- `id` uuid (PK), `title` text, `description` text, `action_type` text, `created_by` uuid, `status` text,
  targeting fields, signature counts, dates, `offline_synced` boolean, timestamps.

### `civic_action_metadata`
- `id` uuid (PK), `civic_action_id` uuid (FK), `metadata_key` text, `metadata_value` jsonb, timestamps.

### `civic_elections`
- Election snapshots:
- `id` uuid (PK), `state_code` text, `election_date` date, `election_type` text | null, `metadata` jsonb | null, timestamps.

### `poll_participation_analytics`
- `id` uuid (PK), `poll_id` uuid, `user_id` uuid, `trust_tier` integer, optional demographics columns,
  `participated_at` timestamptz | null, timestamps, additional verification flags.

### `site_messages`
- `id` uuid (PK), `message_type` text, `title`, `content` text, `severity` text,
  `is_active` boolean, `start_time`, `end_time` timestamptz, `target_audience` text, `created_by` uuid, timestamps.

### `feedback`
- `id` uuid (PK), `feedback_type` text, `category` text | null, `description`/`title` text,
  `impact_score` numeric | null, `priority`/`status` text | null, `assigned_to` uuid | null,
  `ai_analysis` jsonb | null, `attachments` text[] | null, timestamps.

### `performance_metrics`, `query_performance_log`, `cache_performance_log`
- Performance and cache telemetry tables with PK `id` (uuid/serial), metric fields (names/values), metadata jsonb,
  timestamps; see `/web/types/supabase.ts` for full layouts.

### `user_hashtags`
- `id` uuid (PK)
- `user_id` uuid
- `hashtag_id` uuid (FK hashtags.id)
- `is_primary` boolean | null
- `preferences` jsonb | null
- `usage_count` integer | null
- `followed_at`, `last_used_at` timestamptz | null
- `created_at` timestamptz | null

### `representative_follows`
- `user_id` uuid
- `representative_id` integer (FK)
- `notify_on_votes`, `notify_on_events`, `notify_on_public_statements`, `notify_on_committee_activity` boolean
- `tags` text[] | null
- `notes` text | null
- `created_at`, `updated_at` timestamptz

### `representative_overrides`
- `id` uuid (PK)
- `representative_id` integer (FK)
- `user_id` uuid
- `short_bio`, `press_contact` text | null
- `profile_photo_url`, `campaign_website` text | null
- `socials` jsonb | null
- `created_at`, `updated_at` timestamptz

### `representative_overrides_audit`
- `id` uuid (PK)
- `representative_id` integer (FK)
- `user_id` uuid
- `field` text
- `old_value`, `new_value` jsonb | null
- `ip`, `user_agent` text | null
- `created_at` timestamptz

### `official_email_fast_track`
- `id` uuid (PK)
- `representative_id` integer (FK)
- `email` text | null
- `domain` text | null
- `verified` boolean
- `last_attempt_at` timestamptz | null

### `user_roles`
- `id` uuid (PK)
- `user_id` uuid
- `role_id` uuid (FK roles.id)
- `assigned_by` uuid | null
- `created_at` timestamptz | null

### `user_voting_history` (view)
- Read-only projection of vote history for users:
- `id` uuid | null, `user_id` uuid | null, `poll_id` uuid | null, `option_id` uuid | null,
  `option_text` text | null, `poll_question` text | null, `trust_tier` integer | null,
  `is_public` boolean | null, `is_shareable` boolean | null, `linked_at` timestamptz | null,
  `created_by` uuid | null, `created_at` timestamptz | null

### `vote_trust_tiers`
- `id` uuid (PK)
- `vote_id` uuid | null (FK votes.id)
- `trust_tier` integer
- `confidence_score` numeric | null
- `sentiment_score` numeric | null
- `created_at` timestamptz | null

### `message_delivery_logs`
- `id` uuid (PK)
- `message_id` uuid (FK contact_messages.id)
- `delivery_status` text
- `delivery_timestamp` timestamptz
- `delivery_metadata` jsonb
- `created_at` timestamptz

### `poll_demographic_insights`
- `poll_id` uuid (PK)
- Aggregates stored as jsonb:
- `age_group_breakdown`, `education_breakdown`, `income_breakdown`, `geographic_breakdown`,
  `political_breakdown`, `trust_tier_breakdown`, `demographic_by_trust_tier`,
  `trust_tier_by_demographic`, `data_quality_distribution`, `verification_method_distribution`
- `total_responses` integer, `average_confidence_level` numeric
- `created_at`, `updated_at` timestamptz

### `poll_rankings`
- `id` uuid (PK)
- `poll_id` uuid (FK polls.id)
- `user_id` uuid | null (FK user_profiles.id)
- `rankings` integer[]
- `created_at`, `updated_at` timestamptz

### `candidate_profiles`
- `id` uuid (PK)
- `user_id` uuid
- `display_name` text
- `slug` text
- `bio` text | null
- `website` text | null
- `social` jsonb | null
- `is_public` boolean
- `filing_status` text
- `representative_id` integer | null (FK)
- `jurisdiction`, `office`, `party` text | null
- `created_at`, `updated_at` timestamptz

### `candidate_profile_audit`
- `id` uuid (PK)
- `candidate_id` uuid (FK candidate_profiles.id)
- `user_id` uuid
- `field` text
- `old_value`, `new_value` jsonb | null
- `ip`, `user_agent` text | null
- `created_at` timestamptz

### `candidate_verifications`
- `id` uuid (PK)
- `candidate_id` uuid (FK)
- `method` text
- `status` text
- `evidence` jsonb | null
- `updated_at` timestamptz
### `idempotency_keys`
- `id` uuid (PK)
- `key` text
- `status` text
- `data` jsonb | null
- `error_message` text | null
- `expires_at`, `created_at`, `started_at`, `completed_at`, `updated_at` timestamptz

### `idempotency_monitor` (view)
- Aggregated view of idempotency durations:
- `status` text | null, `count` integer | null, `stuck_count` integer | null,
  `avg_duration_seconds`, `max_duration_seconds` numeric | null

### `audit_logs`
- `id` uuid (PK)
- `event_name` text
- `event_type` enum
- `severity` enum | null
- `resource`, `action`, `status` text | null
- `user_id` uuid | null, `session_id` uuid | null
- `ip_address` inet, `user_agent` text | null
- `request_method`, `request_path` text | null
- `metadata` jsonb | null
- `error_message`, `error_stack` text | null
- `granted` boolean | null
- `expires_at` timestamptz | null
- `created_at` timestamptz
- `updated_at` timestamptz | null
- `last_verified` timestamptz | null
- `data_quality_score` integer | null
- `verification_status` text | null
- `bioguide_id`, `fec_id`, `google_civic_id`, `legiscan_id`, `congress_gov_id`, `govinfo_id` text | null
- `wikipedia_url`, `ballotpedia_url`, `facebook_url`, `linkedin_url`, `primary_website`, `primary_photo_url` text | null
- `twitter_handle`, `instagram_handle` text | null
- `youtube_channel` text | null
- `term_start_date`, `term_end_date`, `next_election_date` date | null
- `data_sources` jsonb | null

### `user_profiles`
- `id` uuid (PK)
- `user_id` uuid (auth.users)
- `username` text
- `email` text
- `display_name` text | null
- `avatar_url` text | null
- `bio` text | null
- `is_admin` boolean | null
- `is_active` boolean | null
- `demographics` jsonb | null
- `privacy_settings` jsonb | null
- `primary_concerns` text[] | null
- `community_focus` text[] | null
- `participation_style` text | null
- `dashboard_layout` jsonb | null
- `analytics_dashboard_mode` text | null
- `trust_tier` text | null
- `created_at` timestamptz | null
- `updated_at` timestamptz | null

### `votes`
- `id` uuid (PK)
- `poll_id` uuid (FK polls.id)
- `option_id` uuid (FK poll_options.id)
- `poll_option_id` uuid | null
- `poll_question` text | null
- `user_id` uuid | null
- `voter_session` text | null
- `trust_tier` integer | null
- `vote_status` text | null
- `ip_address` inet
- `offline_synced` boolean | null
- `offline_timestamp` bigint | null
- `linked_at` timestamptz | null
- `created_at`, `updated_at` timestamptz | null

### `representative_committees`
- `id` integer (PK)
- `representative_id` integer (FK representatives_core.id)
- `committee_name` text
- `role` text | null
- `start_date`, `end_date` date | null
- `is_current` boolean | null
- `created_at`, `updated_at` timestamptz | null

### `representative_campaign_finance`
- `id` integer (PK, 1:1 with representative)
- `representative_id` integer (unique FK)
- `cycle` integer | null
- `total_raised`, `total_spent`, `cash_on_hand` numeric | null
- `small_donor_percentage` numeric | null
- `top_contributors` jsonb | null
- `office_code`, `district` text | null
- `last_filing_date` date | null
- `source` text
- `sources` text[] | null
- `created_at`, `updated_at` timestamptz | null

### `contact_threads`
- `id` uuid (PK)
- `user_id` uuid
- `representative_id` integer (FK representatives_core.id)
- `subject` text
- `status` text
- `priority` text
- `message_count` integer
- `last_message_at` timestamptz | null
- `created_at`, `updated_at` timestamptz

### `system_health`
- `id` uuid (PK)
- `service_name` text
- `health_status` text
- `response_time` numeric | null
- `error_rate` numeric | null
- `uptime_percentage` numeric | null
- `alerts`, `details`, `metadata` jsonb | null
- `last_check`, `next_check` timestamptz | null

### `trending_topics`
- `id` uuid (PK)
- `topic` text
- `title` text | null
- `description` text | null
- `category` text | null
- `score`, `trending_score`, `momentum`, `velocity`, `sentiment_score` numeric | null
- `source_name` text | null
- `metadata` jsonb | null
- `created_at`, `updated_at` timestamptz | null

### `user_sessions`
- `id` uuid (PK)
- `session_id` text
- `user_id` uuid | null
- `device_info`, `location`, `metadata` jsonb | null
- `user_agent` text | null
- `ip_address` inet
- `started_at`, `ended_at`, `last_activity` timestamptz | null
- `is_active` boolean | null
- `page_views`, `actions_count`, `total_session_duration` integer | null
- `avg_page_load_time`, `bounce_rate` numeric | null
- `conversion_events` jsonb | null

### `roles`
- `id` uuid (PK)
- `name` text
- `description` text | null
- `level` integer | null
- `created_at`, `updated_at` timestamptz | null

### `role_permissions`
- `id` uuid (PK)
- `role_id` uuid (FK roles.id)
- `permission_id` uuid (FK permissions.id)
- `created_at` timestamptz | null

### `analytics_event_data`
- `id` serial (PK)
- `event_id` uuid (FK analytics_events.id)
- `data_key` text
- `data_value` text
- `data_type` text | null
- `created_at` timestamptz | null

### `polls`
- `id` uuid (PK)
- `title` text
- `created_by` uuid
- `status` text | null
- `privacy_level` text | null
- `voting_method` text | null
- `question` text | null
- `poll_question` text | null
- `options` jsonb | null
- `poll_settings` jsonb | null
- `settings` jsonb | null
- `category` text | null
- `primary_hashtag` text | null
- `hashtags` text[] | null
- `tags` text[] | null
- `is_public`, `is_shareable`, `is_featured`, `is_trending`, `is_verified`, `is_locked`, `is_mock` boolean | null
- `start_date`, `end_date`, `end_time` timestamptz | null
- `baseline_at`, `locked_at`, `unlocked_at`, `reopened_at`, `closed_at` timestamptz | null
- `auto_lock_at` timestamptz | null
- `lock_type` text | null
- `lock_reason` text | null
- `lock_duration` integer | null
- `lock_metadata` jsonb | null
- `lock_notifications_sent` boolean | null
- `modification_reason` text | null
- `last_modified_by` uuid | null
- `offline_created` boolean | null
- `participation`, `participation_rate`, `total_votes`, `total_views`, `trending_score`, `engagement_score` numeric | null
- `sponsors` text[] | null
- `verification_notes`, `moderation_notes` text | null
- `moderation_status` text | null
- `moderation_reviewed_at` timestamptz | null
- `moderation_reviewed_by` uuid | null
- `created_at`, `updated_at` timestamptz | null

### `poll_options`
- `id` uuid (PK)
- `poll_id` uuid (FK polls.id)
- `text` text
- `option_text` text | null
- `order_index` integer | null
- `vote_count` integer | null
- `created_at`, `updated_at` timestamptz | null

### `analytics_events`
- `id` uuid (PK)
- `event_type` text
- `event_data` jsonb | null
- `user_id` uuid | null
- `session_id` uuid | null
- `ip_address` inet
- `referrer` text | null
- `user_agent` text | null
- `created_at` timestamptz | null

### `hashtags`
- `id` uuid (PK)
- `name` text (unique)
- `description` text | null
- `category` text | null
- `metadata` jsonb | null
- `follower_count` integer | null
- `usage_count` integer | null
- `trending_score` numeric | null
- `is_featured`, `is_trending`, `is_verified` boolean | null
- `created_by` uuid | null
- `created_at`, `updated_at` timestamptz | null

### `hashtag_engagement`
- `id` uuid (PK)
- `hashtag_id` uuid (FK hashtags.id)
- `user_id` uuid
- `engagement_type` text
- `metadata` jsonb | null
- `timestamp` timestamptz | null
- `created_at` timestamptz | null

### `feeds`
- `id` uuid (PK)
- `user_id` uuid
- `feed_name` text
- `feed_type` text
- `content_filters` jsonb | null
- `hashtag_filters` jsonb | null
- `is_active` boolean | null
- `created_at`, `updated_at` timestamptz | null

### `feed_items`
- `id` uuid (PK)
- `feed_id` uuid (FK feeds.id)
- `item_type` text
- `item_data` jsonb | null
- `poll_id` uuid | null
- `is_featured` boolean | null
- `position` integer | null
- `created_at`, `updated_at` timestamptz | null

### `contact_messages`
- `id` uuid (PK)
- `user_id` uuid
- `representative_id` integer (FK representatives_core.id)
- `thread_id` uuid | null
- `subject`, `message` text
- `priority` text | null
- `status` text | null
- `offline_synced` boolean | null
- `created_at`, `updated_at` timestamptz | null

### `representative_photos`
- `id` integer (PK)
- `representative_id` integer (FK representatives_core.id)
- `url` text
- `source` text
- `alt_text`, `attribution` text | null
- `width`, `height` integer | null
- `is_primary` boolean | null
- `created_at`, `updated_at` timestamptz | null

### `representative_contacts`
- `id` integer (PK)
- `representative_id` integer (FK representatives_core.id)
- `contact_type` text
- `value` text
- `is_primary`, `is_verified` boolean | null
- `source` text | null
- `created_at`, `updated_at` timestamptz | null

### `representative_social_media`
- `id` integer (PK)
- `representative_id` integer (FK representatives_core.id)
- `platform` text
- `handle` text
- `url` text | null
- `followers_count` bigint | null
- `is_primary`, `is_verified`, `verified` boolean | null
- `created_at`, `updated_at` timestamptz | null
### `platform_analytics`
- `id` uuid (PK)
- `metric_name` text
- `metric_type` text
- `metric_value` numeric
- `dimensions` jsonb | null
- `metadata` jsonb | null
- `category`, `subcategory`, `source` text | null
- `period_start`, `period_end` timestamptz | null
- `timestamp` timestamptz | null

### `push_subscriptions`
- `id` uuid (PK)
- `user_id` uuid
- `endpoint` text (unique)
- `p256dh_key` text | null
- `auth_key` text | null
- `subscription_data` jsonb
- `preferences` jsonb | null
- `is_active` boolean | null
- `created_at`, `updated_at`, `deactivated_at` timestamptz | null

### `notification_log`
- `id` uuid (PK)
- `user_id` uuid
- `subscription_id` uuid | null
- `title`, `body` text
- `payload` jsonb
- `status` text
- `error_message` text | null
- `sent_at` timestamptz | null
- `created_at` timestamptz | null

