# Choices Platform - Database Schema Documentation

**Last Updated**: November 5, 2025  
**Source**: Generated from `/web/types/supabase.ts` (Supabase-generated types)  
**Status**: ✅ CURRENT - Verified against production database  
**Total Tables**: 70  
**Total RPC Functions**: 19

---

## Overview

This document provides a comprehensive overview of the Choices platform database schema. The schema is designed to support:

- 🗳️ **Poll Management** - Create, vote, and analyze polls
- 👥 **User Profiles & Trust Tiers** - User management and trust scoring
- 🏛️ **Civic Engagement** - Representative data, civic actions, contact tracking
- 📊 **Analytics** - Comprehensive analytics, bot detection, narrative analysis
- 🔔 **PWA Features** - Push notifications, offline sync, background tasks
- #️⃣ **Hashtag System** - Trending topics, user preferences, engagement tracking
- 🔐 **Authentication** - WebAuthn, biometric trust scores, sessions
- 📱 **Feeds** - User feeds, feed items, interactions

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
Core representative/elected official data.

**Columns** (25):
- `id` SERIAL PRIMARY KEY
- `name` TEXT
- `office` TEXT
- `level` TEXT (federal, state, local)
- `state` TEXT
- `district` TEXT
- `party` TEXT
- `bioguide_id`, `openstates_id`, `fec_id`, `google_civic_id`, `congress_gov_id` TEXT
- `primary_email`, `primary_phone`, `primary_website` TEXT
- `primary_photo_url` TEXT
- `twitter_handle`, `facebook_url`, `instagram_handle`, `linkedin_url`, `youtube_channel` TEXT
- `term_start_date`, `term_end_date`, `next_election_date` DATE
- `data_quality_score` NUMERIC
- `verification_status` TEXT
- `data_sources` TEXT[]
- `created_at`, `updated_at`, `last_verified` TIMESTAMPTZ

### `representative_photos`
Multiple photos per representative.

**Columns**:
- `id` SERIAL PRIMARY KEY
- `representative_id` INTEGER (FK to representatives_core)
- `photo_url` TEXT
- `source` TEXT
- `is_primary` BOOLEAN
- `created_at` TIMESTAMPTZ

### `representative_social_media`
Social media accounts.

**Columns**:
- `id` SERIAL PRIMARY KEY
- `representative_id` INTEGER (FK to representatives_core)
- `platform` TEXT (twitter, facebook, instagram, etc.)
- `handle` TEXT
- `url` TEXT
- `verified` BOOLEAN
- `created_at`, `updated_at` TIMESTAMPTZ

### `representative_contacts`
Contact information.

**Columns**:
- `id` SERIAL PRIMARY KEY
- `representative_id` INTEGER (FK to representatives_core)
- `contact_type` TEXT (office, district, email, phone)
- `contact_value` TEXT
- `is_primary` BOOLEAN
- `created_at` TIMESTAMPTZ

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

**Columns**:
- `id` SERIAL PRIMARY KEY
- `representative_id` INTEGER (FK to representatives_core)
- `committee_name` TEXT
- `position` TEXT (member, chair, ranking)
- `start_date`, `end_date` DATE
- `created_at` TIMESTAMPTZ

### `representative_campaign_finance`
Campaign finance data.

**Columns**:
- `id` SERIAL PRIMARY KEY
- `representative_id` INTEGER (FK to representatives_core)
- `election_cycle` TEXT
- `total_raised`, `total_spent`, `cash_on_hand` NUMERIC
- `individual_contributions`, `pac_contributions` NUMERIC
- `self_funding` NUMERIC
- `data_source` TEXT
- `as_of_date` DATE
- `created_at`, `updated_at` TIMESTAMPTZ

### `representative_data_quality`
Data quality scoring.

**Columns**:
- `id` SERIAL PRIMARY KEY
- `representative_id` INTEGER (FK to representatives_core)
- `completeness_score` NUMERIC
- `freshness_score` NUMERIC
- `verification_score` NUMERIC
- `overall_score` NUMERIC
- `last_checked` TIMESTAMPTZ
- `created_at`, `updated_at` TIMESTAMPTZ

### `representative_data_sources`
Track data sources per representative.

**Columns**:
- `id` SERIAL PRIMARY KEY
- `representative_id` INTEGER (FK to representatives_core)
- `source_name` TEXT
- `source_type` TEXT
- `last_synced` TIMESTAMPTZ
- `sync_status` TEXT
- `created_at` TIMESTAMPTZ

### `representative_crosswalk_enhanced` & `representative_enhanced_crosswalk`
ID mapping between external systems (two variations).

**Columns**:
- `id` SERIAL PRIMARY KEY
- `representative_id` INTEGER (FK to representatives_core)
- `external_system` TEXT
- `external_id` TEXT
- `confidence_score` NUMERIC
- `verified` BOOLEAN
- `created_at`, `updated_at` TIMESTAMPTZ

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

**Generated**: November 5, 2025  
**Method**: Parsed from `/web/types/supabase.ts` (Supabase-generated)  
**Confidence**: HIGH - Direct verification against production schema

