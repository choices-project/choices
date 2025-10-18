#!/usr/bin/env node

/**
 * Generate Complete TypeScript Types
 * 
 * This script generates comprehensive TypeScript types for ALL 100+ database tables
 * based on the comprehensive schema documentation.
 * 
 * Usage:
 *   node scripts/generate-complete-typescript-types.js
 */

const fs = require('fs');
const path = require('path');

// All tables from the comprehensive schema documentation
const ALL_TABLES = {
  // Core Application Tables
  'user_profiles': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'username', type: 'string', nullable: false },
      { name: 'email', type: 'string', nullable: false },
      { name: 'trust_tier', type: 'string', nullable: false },
      { name: 'avatar_url', type: 'string', nullable: true },
      { name: 'bio', type: 'string', nullable: true },
      { name: 'is_active', type: 'boolean', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'updated_at', type: 'string', nullable: false },
      { name: 'is_admin', type: 'boolean', nullable: false },
      { name: 'geo_lat', type: 'string', nullable: true },
      { name: 'geo_lon', type: 'string', nullable: true },
      { name: 'geo_precision', type: 'string', nullable: true },
      { name: 'geo_updated_at', type: 'string', nullable: true },
      { name: 'geo_source', type: 'string', nullable: true },
      { name: 'geo_consent_version', type: 'string', nullable: true },
      { name: 'geo_coarse_hash', type: 'string', nullable: true },
      { name: 'geo_trust_gate', type: 'string', nullable: false },
      { name: 'display_name', type: 'string', nullable: true },
      { name: 'preferences', type: 'Record<string, unknown>', nullable: false },
      { name: 'privacy_settings', type: 'Record<string, unknown>', nullable: false },
      { name: 'primary_concerns', type: 'string', nullable: true },
      { name: 'community_focus', type: 'string', nullable: true },
      { name: 'participation_style', type: 'string', nullable: false },
      { name: 'demographics', type: 'Record<string, unknown>', nullable: false },
      { name: 'onboarding_completed', type: 'boolean', nullable: false },
      { name: 'onboarding_data', type: 'Record<string, unknown>', nullable: false },
      { name: 'location_data', type: 'Record<string, unknown>', nullable: false },
      { name: 'primary_hashtags', type: 'string[]', nullable: false },
      { name: 'followed_hashtags', type: 'string[]', nullable: false },
      { name: 'hashtag_preferences', type: 'Record<string, unknown>', nullable: false },
      { name: 'total_polls_created', type: 'number', nullable: false },
      { name: 'total_votes_cast', type: 'number', nullable: false },
      { name: 'total_engagement_score', type: 'number', nullable: false },
      { name: 'trust_score', type: 'number', nullable: false },
      { name: 'reputation_points', type: 'number', nullable: false },
      { name: 'verification_status', type: 'string', nullable: false }
    ]
  },
  'polls': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'title', type: 'string', nullable: false },
      { name: 'description', type: 'string', nullable: true },
      { name: 'question', type: 'string', nullable: false },
      { name: 'options', type: 'Record<string, unknown>', nullable: false },
      { name: 'poll_type', type: 'string', nullable: false },
      { name: 'is_public', type: 'boolean', nullable: false },
      { name: 'is_active', type: 'boolean', nullable: false },
      { name: 'expires_at', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'updated_at', type: 'string', nullable: false },
      { name: 'hashtags', type: 'string[]', nullable: false },
      { name: 'primary_hashtag', type: 'string', nullable: true },
      { name: 'poll_settings', type: 'Record<string, unknown>', nullable: false },
      { name: 'allow_multiple_votes', type: 'boolean', nullable: false },
      { name: 'require_authentication', type: 'boolean', nullable: false },
      { name: 'show_results_before_voting', type: 'boolean', nullable: false },
      { name: 'total_views', type: 'number', nullable: false },
      { name: 'total_votes', type: 'number', nullable: false },
      { name: 'engagement_score', type: 'number', nullable: false },
      { name: 'trending_score', type: 'number', nullable: false },
      { name: 'is_trending', type: 'boolean', nullable: false },
      { name: 'is_featured', type: 'boolean', nullable: false },
      { name: 'is_verified', type: 'boolean', nullable: false },
      { name: 'last_modified_by', type: 'string', nullable: true },
      { name: 'modification_reason', type: 'string', nullable: true }
    ]
  },
  'votes': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'poll_id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'vote_choice', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'updated_at', type: 'string', nullable: false },
      { name: 'ip_address', type: 'string', nullable: true },
      { name: 'user_agent', type: 'string', nullable: true },
      { name: 'session_id', type: 'string', nullable: true },
      { name: 'device_fingerprint', type: 'string', nullable: true },
      { name: 'time_spent_seconds', type: 'number', nullable: false },
      { name: 'page_views', type: 'number', nullable: false },
      { name: 'engagement_actions', type: 'Record<string, unknown>', nullable: false },
      { name: 'trust_score_at_vote', type: 'number', nullable: true },
      { name: 'vote_metadata', type: 'Record<string, unknown>', nullable: false },
      { name: 'analytics_data', type: 'Record<string, unknown>', nullable: false },
      { name: 'is_active', type: 'boolean', nullable: false }
    ]
  },
  'feedback': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'feedback_type', type: 'string', nullable: false },
      { name: 'title', type: 'string', nullable: false },
      { name: 'description', type: 'string', nullable: false },
      { name: 'priority', type: 'string', nullable: false },
      { name: 'status', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'updated_at', type: 'string', nullable: false },
      { name: 'category', type: 'string', nullable: true },
      { name: 'tags', type: 'string[]', nullable: false },
      { name: 'admin_response', type: 'string', nullable: true },
      { name: 'admin_response_at', type: 'string', nullable: true },
      { name: 'admin_user_id', type: 'string', nullable: true },
      { name: 'upvotes', type: 'number', nullable: false },
      { name: 'downvotes', type: 'number', nullable: false },
      { name: 'views', type: 'number', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },

  // Hashtag System
  'hashtags': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'display_name', type: 'string', nullable: false },
      { name: 'description', type: 'string', nullable: true },
      { name: 'category', type: 'string', nullable: false },
      { name: 'usage_count', type: 'number', nullable: false },
      { name: 'follower_count', type: 'number', nullable: false },
      { name: 'is_trending', type: 'boolean', nullable: false },
      { name: 'trend_score', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'updated_at', type: 'string', nullable: false },
      { name: 'created_by', type: 'string', nullable: true },
      { name: 'is_verified', type: 'boolean', nullable: false },
      { name: 'is_featured', type: 'boolean', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'user_hashtags': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'hashtag_id', type: 'string', nullable: false },
      { name: 'followed_at', type: 'string', nullable: false },
      { name: 'is_primary', type: 'boolean', nullable: false },
      { name: 'usage_count', type: 'number', nullable: false },
      { name: 'last_used_at', type: 'string', nullable: true },
      { name: 'preferences', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'hashtag_usage': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'hashtag_id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'content_id', type: 'string', nullable: true },
      { name: 'content_type', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'views', type: 'number', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'hashtag_engagement': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'hashtag_id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'engagement_type', type: 'string', nullable: false },
      { name: 'timestamp', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'hashtag_content': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'hashtag_id', type: 'string', nullable: false },
      { name: 'content_id', type: 'string', nullable: false },
      { name: 'content_type', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'hashtag_co_occurrence': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'hashtag1_id', type: 'string', nullable: false },
      { name: 'hashtag2_id', type: 'string', nullable: false },
      { name: 'co_occurrence_count', type: 'number', nullable: false },
      { name: 'last_seen', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'hashtag_analytics': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'hashtag_id', type: 'string', nullable: false },
      { name: 'metric_name', type: 'string', nullable: false },
      { name: 'metric_value', type: 'number', nullable: false },
      { name: 'period_start', type: 'string', nullable: false },
      { name: 'period_end', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false }
    ]
  },

  // Analytics & Monitoring
  'analytics_events': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'event_type', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'session_id', type: 'string', nullable: true },
      { name: 'properties', type: 'Record<string, unknown>', nullable: false },
      { name: 'created_at', type: 'string', nullable: false }
    ]
  },
  'analytics_contributions': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'contribution_type', type: 'string', nullable: false },
      { name: 'contribution_id', type: 'string', nullable: false },
      { name: 'points_awarded', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'analytics_demographics': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'poll_id', type: 'string', nullable: true },
      { name: 'age_bucket', type: 'string', nullable: true },
      { name: 'region_bucket', type: 'string', nullable: true },
      { name: 'education_bucket', type: 'string', nullable: true },
      { name: 'participant_count', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'analytics_page_views': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'page_path', type: 'string', nullable: false },
      { name: 'page_title', type: 'string', nullable: true },
      { name: 'referrer', type: 'string', nullable: true },
      { name: 'user_agent', type: 'string', nullable: true },
      { name: 'ip_address', type: 'string', nullable: true },
      { name: 'session_id', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'time_on_page', type: 'number', nullable: false },
      { name: 'scroll_depth', type: 'number', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'analytics_sessions': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'session_id', type: 'string', nullable: false },
      { name: 'started_at', type: 'string', nullable: false },
      { name: 'ended_at', type: 'string', nullable: true },
      { name: 'duration_seconds', type: 'number', nullable: false },
      { name: 'page_views', type: 'number', nullable: false },
      { name: 'events_count', type: 'number', nullable: false },
      { name: 'user_agent', type: 'string', nullable: true },
      { name: 'ip_address', type: 'string', nullable: true },
      { name: 'referrer', type: 'string', nullable: true },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'analytics_user_engagement': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'engagement_type', type: 'string', nullable: false },
      { name: 'engagement_value', type: 'number', nullable: false },
      { name: 'session_id', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'user_analytics': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'metric_name', type: 'string', nullable: false },
      { name: 'metric_value', type: 'number', nullable: false },
      { name: 'period_start', type: 'string', nullable: false },
      { name: 'period_end', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'poll_analytics': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'poll_id', type: 'string', nullable: false },
      { name: 'metric_name', type: 'string', nullable: false },
      { name: 'metric_value', type: 'number', nullable: false },
      { name: 'period_start', type: 'string', nullable: false },
      { name: 'period_end', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'user_feedback_analytics': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'feedback_id', type: 'string', nullable: false },
      { name: 'metric_name', type: 'string', nullable: false },
      { name: 'metric_value', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },

  // Civics & Government Data
  'representatives_core': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'first_name', type: 'string', nullable: false },
      { name: 'last_name', type: 'string', nullable: false },
      { name: 'full_name', type: 'string', nullable: false },
      { name: 'title', type: 'string', nullable: true },
      { name: 'party', type: 'string', nullable: true },
      { name: 'state', type: 'string', nullable: false },
      { name: 'district', type: 'string', nullable: true },
      { name: 'chamber', type: 'string', nullable: true },
      { name: 'office_type', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'updated_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'representative_contacts_optimal': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'representative_id', type: 'string', nullable: false },
      { name: 'contact_type', type: 'string', nullable: false },
      { name: 'contact_value', type: 'string', nullable: false },
      { name: 'is_primary', type: 'boolean', nullable: false },
      { name: 'is_verified', type: 'boolean', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'representative_offices_optimal': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'representative_id', type: 'string', nullable: false },
      { name: 'office_type', type: 'string', nullable: false },
      { name: 'address_line1', type: 'string', nullable: true },
      { name: 'address_line2', type: 'string', nullable: true },
      { name: 'city', type: 'string', nullable: true },
      { name: 'state', type: 'string', nullable: true },
      { name: 'zip_code', type: 'string', nullable: true },
      { name: 'phone', type: 'string', nullable: true },
      { name: 'fax', type: 'string', nullable: true },
      { name: 'email', type: 'string', nullable: true },
      { name: 'website', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'representative_photos_optimal': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'representative_id', type: 'string', nullable: false },
      { name: 'photo_url', type: 'string', nullable: false },
      { name: 'photo_type', type: 'string', nullable: false },
      { name: 'is_primary', type: 'boolean', nullable: false },
      { name: 'quality_score', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'representative_roles_optimal': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'representative_id', type: 'string', nullable: false },
      { name: 'role_type', type: 'string', nullable: false },
      { name: 'role_title', type: 'string', nullable: true },
      { name: 'committee', type: 'string', nullable: true },
      { name: 'subcommittee', type: 'string', nullable: true },
      { name: 'start_date', type: 'string', nullable: true },
      { name: 'end_date', type: 'string', nullable: true },
      { name: 'is_current', type: 'boolean', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'candidates': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'first_name', type: 'string', nullable: false },
      { name: 'last_name', type: 'string', nullable: false },
      { name: 'full_name', type: 'string', nullable: false },
      { name: 'party', type: 'string', nullable: true },
      { name: 'office', type: 'string', nullable: true },
      { name: 'state', type: 'string', nullable: true },
      { name: 'district', type: 'string', nullable: true },
      { name: 'election_year', type: 'number', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'civic_jurisdictions': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'jurisdiction_type', type: 'string', nullable: false },
      { name: 'state', type: 'string', nullable: true },
      { name: 'county', type: 'string', nullable: true },
      { name: 'city', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'elections': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'election_name', type: 'string', nullable: false },
      { name: 'election_date', type: 'string', nullable: false },
      { name: 'election_type', type: 'string', nullable: false },
      { name: 'state', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'state_districts': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'state', type: 'string', nullable: false },
      { name: 'district_number', type: 'string', nullable: false },
      { name: 'district_name', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },

  // Privacy & Compliance
  'privacy_consent_records': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'consent_type', type: 'string', nullable: false },
      { name: 'consent_given', type: 'boolean', nullable: false },
      { name: 'consent_version', type: 'string', nullable: false },
      { name: 'consent_timestamp', type: 'string', nullable: false },
      { name: 'ip_address', type: 'string', nullable: true },
      { name: 'user_agent', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'privacy_data_requests': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'request_type', type: 'string', nullable: false },
      { name: 'request_status', type: 'string', nullable: false },
      { name: 'request_description', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'completed_at', type: 'string', nullable: true },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'privacy_audit_logs': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'action_type', type: 'string', nullable: false },
      { name: 'resource_type', type: 'string', nullable: false },
      { name: 'resource_id', type: 'string', nullable: true },
      { name: 'action_timestamp', type: 'string', nullable: false },
      { name: 'ip_address', type: 'string', nullable: true },
      { name: 'user_agent', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'user_consent': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'consent_type', type: 'string', nullable: false },
      { name: 'consent_given', type: 'boolean', nullable: false },
      { name: 'consent_version', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'private_user_data': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'data_type', type: 'string', nullable: false },
      { name: 'encrypted_data', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'user_profiles_encrypted': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'encrypted_profile_data', type: 'string', nullable: false },
      { name: 'encryption_key_id', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },

  // Data Quality & Monitoring
  'data_quality_audit': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'table_name', type: 'string', nullable: false },
      { name: 'audit_type', type: 'string', nullable: false },
      { name: 'audit_timestamp', type: 'string', nullable: false },
      { name: 'issues_found', type: 'number', nullable: false },
      { name: 'issues_resolved', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'data_quality_checks': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'check_name', type: 'string', nullable: false },
      { name: 'table_name', type: 'string', nullable: false },
      { name: 'check_type', type: 'string', nullable: false },
      { name: 'check_query', type: 'string', nullable: false },
      { name: 'severity', type: 'string', nullable: false },
      { name: 'is_active', type: 'boolean', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'data_quality_metrics': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'metric_name', type: 'string', nullable: false },
      { name: 'metric_value', type: 'number', nullable: false },
      { name: 'table_name', type: 'string', nullable: true },
      { name: 'calculated_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'dbt_test_results': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'test_name', type: 'string', nullable: false },
      { name: 'test_status', type: 'string', nullable: false },
      { name: 'test_message', type: 'string', nullable: true },
      { name: 'execution_time_seconds', type: 'number', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'dbt_freshness_status': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'table_name', type: 'string', nullable: false },
      { name: 'freshness_status', type: 'string', nullable: false },
      { name: 'last_updated', type: 'string', nullable: true },
      { name: 'freshness_threshold_hours', type: 'number', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },

  // Authentication & Security
  'webauthn_credentials': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'credential_id', type: 'string', nullable: false },
      { name: 'public_key', type: 'string', nullable: false },
      { name: 'counter', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'last_used_at', type: 'string', nullable: true },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'webauthn_challenges': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'challenge', type: 'string', nullable: false },
      { name: 'expires_at', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'security_audit_log': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'action_type', type: 'string', nullable: false },
      { name: 'resource_type', type: 'string', nullable: false },
      { name: 'action_timestamp', type: 'string', nullable: false },
      { name: 'ip_address', type: 'string', nullable: true },
      { name: 'user_agent', type: 'string', nullable: true },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'audit_logs': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'action_type', type: 'string', nullable: false },
      { name: 'resource_type', type: 'string', nullable: false },
      { name: 'resource_id', type: 'string', nullable: true },
      { name: 'action_timestamp', type: 'string', nullable: false },
      { name: 'ip_address', type: 'string', nullable: true },
      { name: 'user_agent', type: 'string', nullable: true },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'rate_limits': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'endpoint', type: 'string', nullable: false },
      { name: 'requests_count', type: 'number', nullable: false },
      { name: 'window_start', type: 'string', nullable: false },
      { name: 'window_end', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },

  // User Management
  'user_civics_preferences': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'preferred_topics', type: 'string[]', nullable: false },
      { name: 'preferred_hashtags', type: 'string[]', nullable: false },
      { name: 'notification_frequency', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'user_notification_preferences': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'notification_type', type: 'string', nullable: false },
      { name: 'is_enabled', type: 'boolean', nullable: false },
      { name: 'frequency', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'user_location_resolutions': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'ip_address', type: 'string', nullable: true },
      { name: 'resolved_location', type: 'Record<string, unknown>', nullable: false },
      { name: 'resolution_method', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'user_privacy_analytics': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'privacy_event_type', type: 'string', nullable: false },
      { name: 'privacy_event_value', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },

  // Content & Moderation
  'site_messages': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'message_type', type: 'string', nullable: false },
      { name: 'title', type: 'string', nullable: false },
      { name: 'content', type: 'string', nullable: false },
      { name: 'is_active', type: 'boolean', nullable: false },
      { name: 'priority', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'expires_at', type: 'string', nullable: true },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'trending_topics': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'topic_name', type: 'string', nullable: false },
      { name: 'topic_type', type: 'string', nullable: false },
      { name: 'trend_score', type: 'number', nullable: false },
      { name: 'engagement_count', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'generated_polls': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'poll_id', type: 'string', nullable: true },
      { name: 'generation_method', type: 'string', nullable: false },
      { name: 'generation_prompt', type: 'string', nullable: true },
      { name: 'generation_parameters', type: 'Record<string, unknown>', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },

  // System Administration
  'system_configuration': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'config_key', type: 'string', nullable: false },
      { name: 'config_value', type: 'string', nullable: false },
      { name: 'config_type', type: 'string', nullable: false },
      { name: 'is_active', type: 'boolean', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'error_logs': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'error_type', type: 'string', nullable: false },
      { name: 'error_message', type: 'string', nullable: false },
      { name: 'error_stack', type: 'string', nullable: true },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'session_id', type: 'string', nullable: true },
      { name: 'request_id', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'migration_log': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'migration_name', type: 'string', nullable: false },
      { name: 'migration_version', type: 'string', nullable: false },
      { name: 'executed_at', type: 'string', nullable: false },
      { name: 'execution_time_seconds', type: 'number', nullable: true },
      { name: 'status', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },

  // Additional missing tables from error analysis
  'admin_activity_log': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'admin_id', type: 'string', nullable: false },
      { name: 'action', type: 'string', nullable: false },
      { name: 'details', type: 'Record<string, unknown>', nullable: false },
      { name: 'ip_address', type: 'string', nullable: false },
      { name: 'user_agent', type: 'string', nullable: false },
      { name: 'timestamp', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false }
    ]
  },
  'trust_tier_analytics': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'poll_id', type: 'string', nullable: false },
      { name: 'trust_tier', type: 'string', nullable: false },
      { name: 'age_group', type: 'string', nullable: true },
      { name: 'geographic_region', type: 'string', nullable: true },
      { name: 'education_level', type: 'string', nullable: true },
      { name: 'income_bracket', type: 'string', nullable: true },
      { name: 'political_affiliation', type: 'string', nullable: true },
      { name: 'voting_history_count', type: 'number', nullable: false },
      { name: 'biometric_verified', type: 'boolean', nullable: false },
      { name: 'phone_verified', type: 'boolean', nullable: false },
      { name: 'identity_verified', type: 'boolean', nullable: false },
      { name: 'verification_methods', type: 'string[]', nullable: false },
      { name: 'data_quality_score', type: 'number', nullable: false },
      { name: 'confidence_level', type: 'number', nullable: false },
      { name: 'last_activity', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false }
    ]
  },
  'hashtag_flags': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'hashtag_id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'flag_type', type: 'string', nullable: false },
      { name: 'reason', type: 'string', nullable: false },
      { name: 'status', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'resolved_at', type: 'string', nullable: true },
      { name: 'resolved_by', type: 'string', nullable: true }
    ]
  },
  'hashtag_moderation': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'hashtag_id', type: 'string', nullable: false },
      { name: 'status', type: 'string', nullable: false },
      { name: 'moderation_reason', type: 'string', nullable: true },
      { name: 'moderated_by', type: 'string', nullable: false },
      { name: 'moderated_at', type: 'string', nullable: false },
      { name: 'human_review_required', type: 'boolean', nullable: false },
      { name: 'created_at', type: 'string', nullable: false }
    ]
  },
  'user_hashtag_follows': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'hashtag', type: 'string', nullable: false },
      { name: 'is_following', type: 'boolean', nullable: false },
      { name: 'is_custom', type: 'boolean', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'updated_at', type: 'string', nullable: false }
    ]
  },
  'user_engagement_summary': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'stable_user_id', type: 'string', nullable: false },
      { name: 'user_hash', type: 'string', nullable: false },
      { name: 'total_polls_participated', type: 'number', nullable: false },
      { name: 'total_votes_cast', type: 'number', nullable: false },
      { name: 'average_engagement_score', type: 'number', nullable: false },
      { name: 'current_trust_tier', type: 'string', nullable: false },
      { name: 'trust_tier_history', type: 'Record<string, unknown>', nullable: false },
      { name: 'trust_tier_upgrade_date', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false }
    ]
  },

  // Additional missing tables from remaining errors
  'poll_options': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'poll_id', type: 'string', nullable: false },
      { name: 'label', type: 'string', nullable: false },
      { name: 'weight', type: 'number', nullable: false },
      { name: 'order', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false }
    ]
  },

  // All the missing tables from your comprehensive list
  'analytics_demographics': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'poll_id', type: 'string', nullable: true },
      { name: 'age_bucket', type: 'string', nullable: true },
      { name: 'region_bucket', type: 'string', nullable: true },
      { name: 'education_bucket', type: 'string', nullable: true },
      { name: 'participant_count', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'analytics_page_views': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'page_path', type: 'string', nullable: false },
      { name: 'page_title', type: 'string', nullable: true },
      { name: 'referrer', type: 'string', nullable: true },
      { name: 'user_agent', type: 'string', nullable: true },
      { name: 'ip_address', type: 'string', nullable: true },
      { name: 'session_id', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'time_on_page', type: 'number', nullable: false },
      { name: 'scroll_depth', type: 'number', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'analytics_sessions': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'session_id', type: 'string', nullable: false },
      { name: 'started_at', type: 'string', nullable: false },
      { name: 'ended_at', type: 'string', nullable: true },
      { name: 'duration_seconds', type: 'number', nullable: false },
      { name: 'page_views', type: 'number', nullable: false },
      { name: 'events_count', type: 'number', nullable: false },
      { name: 'user_agent', type: 'string', nullable: true },
      { name: 'ip_address', type: 'string', nullable: true },
      { name: 'referrer', type: 'string', nullable: true },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'analytics_user_engagement': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'engagement_type', type: 'string', nullable: false },
      { name: 'engagement_value', type: 'number', nullable: false },
      { name: 'session_id', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'audit_logs': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'action_type', type: 'string', nullable: false },
      { name: 'resource_type', type: 'string', nullable: false },
      { name: 'resource_id', type: 'string', nullable: true },
      { name: 'action_timestamp', type: 'string', nullable: false },
      { name: 'ip_address', type: 'string', nullable: true },
      { name: 'user_agent', type: 'string', nullable: true },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'bias_detection_logs': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'poll_id', type: 'string', nullable: false },
      { name: 'bias_type', type: 'string', nullable: false },
      { name: 'confidence_score', type: 'number', nullable: false },
      { name: 'detected_at', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'biometric_auth_logs': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'auth_method', type: 'string', nullable: false },
      { name: 'success', type: 'boolean', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'biometric_trust_scores': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'score', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'breaking_news': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'title', type: 'string', nullable: false },
      { name: 'content', type: 'string', nullable: false },
      { name: 'source', type: 'string', nullable: false },
      { name: 'published_at', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'campaign_finance': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'candidate_id', type: 'string', nullable: false },
      { name: 'amount', type: 'number', nullable: false },
      { name: 'source', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'candidate_jurisdictions': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'candidate_id', type: 'string', nullable: false },
      { name: 'jurisdiction_id', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'civics_feed_items': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'title', type: 'string', nullable: false },
      { name: 'content', type: 'string', nullable: false },
      { name: 'source', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'contributions': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'amount', type: 'number', nullable: false },
      { name: 'type', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'data_checksums': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'table_name', type: 'string', nullable: false },
      { name: 'checksum', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'data_licenses': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'type', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'data_lineage': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'source_table', type: 'string', nullable: false },
      { name: 'target_table', type: 'string', nullable: false },
      { name: 'transformation', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'data_quality_audit': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'table_name', type: 'string', nullable: false },
      { name: 'audit_type', type: 'string', nullable: false },
      { name: 'audit_timestamp', type: 'string', nullable: false },
      { name: 'issues_found', type: 'number', nullable: false },
      { name: 'issues_resolved', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'data_quality_checks': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'check_name', type: 'string', nullable: false },
      { name: 'table_name', type: 'string', nullable: false },
      { name: 'check_type', type: 'string', nullable: false },
      { name: 'check_query', type: 'string', nullable: false },
      { name: 'severity', type: 'string', nullable: false },
      { name: 'is_active', type: 'boolean', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'data_quality_metrics': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'metric_name', type: 'string', nullable: false },
      { name: 'metric_value', type: 'number', nullable: false },
      { name: 'table_name', type: 'string', nullable: true },
      { name: 'calculated_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'data_quality_summary': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'table_name', type: 'string', nullable: false },
      { name: 'quality_score', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'data_sources': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'type', type: 'string', nullable: false },
      { name: 'url', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'data_transformations': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'type', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'dbt_freshness_sla': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'table_name', type: 'string', nullable: false },
      { name: 'sla_hours', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'dbt_freshness_status': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'table_name', type: 'string', nullable: false },
      { name: 'freshness_status', type: 'string', nullable: false },
      { name: 'last_updated', type: 'string', nullable: true },
      { name: 'freshness_threshold_hours', type: 'number', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'dbt_test_config': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'test_name', type: 'string', nullable: false },
      { name: 'config', type: 'Record<string, unknown>', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'dbt_test_execution_history': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'test_name', type: 'string', nullable: false },
      { name: 'executed_at', type: 'string', nullable: false },
      { name: 'status', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'dbt_test_execution_log': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'test_name', type: 'string', nullable: false },
      { name: 'execution_time', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'dbt_test_results': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'test_name', type: 'string', nullable: false },
      { name: 'test_status', type: 'string', nullable: false },
      { name: 'test_message', type: 'string', nullable: true },
      { name: 'execution_time_seconds', type: 'number', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'dbt_test_results_summary': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'total_tests', type: 'number', nullable: false },
      { name: 'passed_tests', type: 'number', nullable: false },
      { name: 'failed_tests', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'demographic_analytics': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'poll_id', type: 'string', nullable: false },
      { name: 'age_bucket', type: 'string', nullable: false },
      { name: 'region_bucket', type: 'string', nullable: false },
      { name: 'education_bucket', type: 'string', nullable: false },
      { name: 'participant_count', type: 'number', nullable: false },
      { name: 'average_choice', type: 'number', nullable: false },
      { name: 'choice_variance', type: 'number', nullable: false },
      { name: 'first_contribution', type: 'string', nullable: false },
      { name: 'last_contribution', type: 'string', nullable: false }
    ]
  },
  'elections': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'election_name', type: 'string', nullable: false },
      { name: 'election_date', type: 'string', nullable: false },
      { name: 'election_type', type: 'string', nullable: false },
      { name: 'state', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'error_logs': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'error_type', type: 'string', nullable: false },
      { name: 'error_message', type: 'string', nullable: false },
      { name: 'error_stack', type: 'string', nullable: true },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'session_id', type: 'string', nullable: true },
      { name: 'request_id', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'fact_check_sources': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'url', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'fec_candidate_committee': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'candidate_id', type: 'string', nullable: false },
      { name: 'committee_id', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'fec_candidates': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'party', type: 'string', nullable: true },
      { name: 'state', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'fec_candidates_v2': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'party', type: 'string', nullable: true },
      { name: 'state', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'fec_committees': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'type', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'fec_committees_v2': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'type', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'fec_contributions': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'amount', type: 'number', nullable: false },
      { name: 'contributor', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'fec_cycles': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'cycle', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'fec_disbursements': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'amount', type: 'number', nullable: false },
      { name: 'recipient', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'fec_filings_v2': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'filing_id', type: 'string', nullable: false },
      { name: 'filing_type', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'fec_independent_expenditures': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'amount', type: 'number', nullable: false },
      { name: 'spender', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'fec_ingest_cursors': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'table_name', type: 'string', nullable: false },
      { name: 'last_cursor', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'generated_polls': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'poll_id', type: 'string', nullable: true },
      { name: 'generation_method', type: 'string', nullable: false },
      { name: 'generation_prompt', type: 'string', nullable: true },
      { name: 'generation_parameters', type: 'Record<string, unknown>', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'hashtag_analytics': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'hashtag_id', type: 'string', nullable: false },
      { name: 'metric_name', type: 'string', nullable: false },
      { name: 'metric_value', type: 'number', nullable: false },
      { name: 'period_start', type: 'string', nullable: false },
      { name: 'period_end', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false }
    ]
  },
  'hashtag_co_occurrence': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'hashtag1_id', type: 'string', nullable: false },
      { name: 'hashtag2_id', type: 'string', nullable: false },
      { name: 'co_occurrence_count', type: 'number', nullable: false },
      { name: 'last_seen', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'hashtag_content': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'hashtag_id', type: 'string', nullable: false },
      { name: 'content_id', type: 'string', nullable: false },
      { name: 'content_type', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'hashtag_engagement': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'hashtag_id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'engagement_type', type: 'string', nullable: false },
      { name: 'timestamp', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'hashtag_performance_summary': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'hashtag_id', type: 'string', nullable: false },
      { name: 'hashtag_name', type: 'string', nullable: false },
      { name: 'total_usage', type: 'number', nullable: false },
      { name: 'average_metric', type: 'number', nullable: false },
      { name: 'last_activity', type: 'string', nullable: false }
    ]
  },
  'hashtag_usage': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'hashtag_id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'content_id', type: 'string', nullable: true },
      { name: 'content_type', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'views', type: 'number', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'hashtags': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'display_name', type: 'string', nullable: false },
      { name: 'description', type: 'string', nullable: true },
      { name: 'category', type: 'string', nullable: false },
      { name: 'usage_count', type: 'number', nullable: false },
      { name: 'follower_count', type: 'number', nullable: false },
      { name: 'is_trending', type: 'boolean', nullable: false },
      { name: 'trend_score', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'updated_at', type: 'string', nullable: false },
      { name: 'created_by', type: 'string', nullable: true },
      { name: 'is_verified', type: 'boolean', nullable: false },
      { name: 'is_featured', type: 'boolean', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'id_crosswalk': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'source_id', type: 'string', nullable: false },
      { name: 'target_id', type: 'string', nullable: false },
      { name: 'source_type', type: 'string', nullable: false },
      { name: 'target_type', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'idempotency_keys': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'key', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'independence_score_methodology': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'methodology', type: 'string', nullable: false },
      { name: 'version', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'ingest_cursors': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'table_name', type: 'string', nullable: false },
      { name: 'last_cursor', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'ingestion_cursors': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'table_name', type: 'string', nullable: false },
      { name: 'last_cursor', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'ingestion_logs': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'table_name', type: 'string', nullable: false },
      { name: 'status', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'jurisdiction_aliases': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'jurisdiction_id', type: 'string', nullable: false },
      { name: 'alias', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'jurisdiction_geometries': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'jurisdiction_id', type: 'string', nullable: false },
      { name: 'geometry', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'jurisdiction_tiles': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'jurisdiction_id', type: 'string', nullable: false },
      { name: 'tile_data', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'jurisdictions_optimal': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'type', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'latlon_to_ocd': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'latitude', type: 'number', nullable: false },
      { name: 'longitude', type: 'number', nullable: false },
      { name: 'ocd_id', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'location_consent_audit': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'consent_given', type: 'boolean', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'media_polls': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'poll_id', type: 'string', nullable: false },
      { name: 'media_type', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'media_sources': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'type', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'migration_log': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'migration_name', type: 'string', nullable: false },
      { name: 'migration_version', type: 'string', nullable: false },
      { name: 'executed_at', type: 'string', nullable: false },
      { name: 'execution_time_seconds', type: 'number', nullable: true },
      { name: 'status', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'news_fetch_logs': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'source', type: 'string', nullable: false },
      { name: 'status', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'news_sources': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'url', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'notification_history': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'notification_type', type: 'string', nullable: false },
      { name: 'sent_at', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'poll_analytics': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'poll_id', type: 'string', nullable: false },
      { name: 'metric_name', type: 'string', nullable: false },
      { name: 'metric_value', type: 'number', nullable: false },
      { name: 'period_start', type: 'string', nullable: false },
      { name: 'period_end', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'poll_contexts': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'poll_id', type: 'string', nullable: false },
      { name: 'context_type', type: 'string', nullable: false },
      { name: 'context_data', type: 'Record<string, unknown>', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'poll_generation_logs': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'poll_id', type: 'string', nullable: false },
      { name: 'generation_method', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'polls': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'title', type: 'string', nullable: false },
      { name: 'description', type: 'string', nullable: true },
      { name: 'question', type: 'string', nullable: false },
      { name: 'options', type: 'Record<string, unknown>', nullable: false },
      { name: 'poll_type', type: 'string', nullable: false },
      { name: 'is_public', type: 'boolean', nullable: false },
      { name: 'is_active', type: 'boolean', nullable: false },
      { name: 'expires_at', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'updated_at', type: 'string', nullable: false },
      { name: 'hashtags', type: 'string[]', nullable: false },
      { name: 'primary_hashtag', type: 'string', nullable: true },
      { name: 'poll_settings', type: 'Record<string, unknown>', nullable: false },
      { name: 'allow_multiple_votes', type: 'boolean', nullable: false },
      { name: 'require_authentication', type: 'boolean', nullable: false },
      { name: 'show_results_before_voting', type: 'boolean', nullable: false },
      { name: 'total_views', type: 'number', nullable: false },
      { name: 'total_votes', type: 'number', nullable: false },
      { name: 'engagement_score', type: 'number', nullable: false },
      { name: 'trending_score', type: 'number', nullable: false },
      { name: 'is_trending', type: 'boolean', nullable: false },
      { name: 'is_featured', type: 'boolean', nullable: false },
      { name: 'is_verified', type: 'boolean', nullable: false },
      { name: 'last_modified_by', type: 'string', nullable: true },
      { name: 'modification_reason', type: 'string', nullable: true }
    ]
  },
  'privacy_audit_logs': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'action_type', type: 'string', nullable: false },
      { name: 'resource_type', type: 'string', nullable: false },
      { name: 'resource_id', type: 'string', nullable: true },
      { name: 'action_timestamp', type: 'string', nullable: false },
      { name: 'ip_address', type: 'string', nullable: true },
      { name: 'user_agent', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'privacy_consent_records': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'consent_type', type: 'string', nullable: false },
      { name: 'consent_given', type: 'boolean', nullable: false },
      { name: 'consent_version', type: 'string', nullable: false },
      { name: 'consent_timestamp', type: 'string', nullable: false },
      { name: 'ip_address', type: 'string', nullable: true },
      { name: 'user_agent', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'privacy_data_requests': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'request_type', type: 'string', nullable: false },
      { name: 'request_status', type: 'string', nullable: false },
      { name: 'request_description', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'completed_at', type: 'string', nullable: true },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'privacy_logs': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'action', type: 'string', nullable: false },
      { name: 'user_id_hash', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'private_user_data': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'data_type', type: 'string', nullable: false },
      { name: 'encrypted_data', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'push_subscriptions': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'endpoint', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'quality_metrics': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'metric_name', type: 'string', nullable: false },
      { name: 'metric_value', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'rate_limits': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'endpoint', type: 'string', nullable: false },
      { name: 'requests_count', type: 'number', nullable: false },
      { name: 'window_start', type: 'string', nullable: false },
      { name: 'window_end', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'redistricting_history': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'district_id', type: 'string', nullable: false },
      { name: 'year', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'representative_activity_enhanced': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'representative_id', type: 'string', nullable: false },
      { name: 'activity_type', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'representative_campaign_finance': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'representative_id', type: 'string', nullable: false },
      { name: 'amount', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'representative_committees': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'representative_id', type: 'string', nullable: false },
      { name: 'committee_id', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'representative_contacts_optimal': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'representative_id', type: 'string', nullable: false },
      { name: 'contact_type', type: 'string', nullable: false },
      { name: 'contact_value', type: 'string', nullable: false },
      { name: 'is_primary', type: 'boolean', nullable: false },
      { name: 'is_verified', type: 'boolean', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'representative_leadership': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'representative_id', type: 'string', nullable: false },
      { name: 'leadership_role', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'representative_offices_optimal': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'representative_id', type: 'string', nullable: false },
      { name: 'office_type', type: 'string', nullable: false },
      { name: 'address_line1', type: 'string', nullable: true },
      { name: 'address_line2', type: 'string', nullable: true },
      { name: 'city', type: 'string', nullable: true },
      { name: 'state', type: 'string', nullable: true },
      { name: 'zip_code', type: 'string', nullable: true },
      { name: 'phone', type: 'string', nullable: true },
      { name: 'fax', type: 'string', nullable: true },
      { name: 'email', type: 'string', nullable: true },
      { name: 'website', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'representative_photos_optimal': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'representative_id', type: 'string', nullable: false },
      { name: 'photo_url', type: 'string', nullable: false },
      { name: 'photo_type', type: 'string', nullable: false },
      { name: 'is_primary', type: 'boolean', nullable: false },
      { name: 'quality_score', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'representative_roles_optimal': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'representative_id', type: 'string', nullable: false },
      { name: 'role_type', type: 'string', nullable: false },
      { name: 'role_title', type: 'string', nullable: true },
      { name: 'committee', type: 'string', nullable: true },
      { name: 'subcommittee', type: 'string', nullable: true },
      { name: 'start_date', type: 'string', nullable: true },
      { name: 'end_date', type: 'string', nullable: true },
      { name: 'is_current', type: 'boolean', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'representative_social_media_optimal': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'representative_id', type: 'string', nullable: false },
      { name: 'platform', type: 'string', nullable: false },
      { name: 'handle', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'representative_social_posts': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'representative_id', type: 'string', nullable: false },
      { name: 'platform', type: 'string', nullable: false },
      { name: 'content', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'representatives_core': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'first_name', type: 'string', nullable: false },
      { name: 'last_name', type: 'string', nullable: false },
      { name: 'full_name', type: 'string', nullable: false },
      { name: 'title', type: 'string', nullable: true },
      { name: 'party', type: 'string', nullable: true },
      { name: 'state', type: 'string', nullable: false },
      { name: 'district', type: 'string', nullable: true },
      { name: 'chamber', type: 'string', nullable: true },
      { name: 'office_type', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'updated_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'security_audit_log': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: true },
      { name: 'action_type', type: 'string', nullable: false },
      { name: 'resource_type', type: 'string', nullable: false },
      { name: 'action_timestamp', type: 'string', nullable: false },
      { name: 'ip_address', type: 'string', nullable: true },
      { name: 'user_agent', type: 'string', nullable: true },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'site_messages': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'message_type', type: 'string', nullable: false },
      { name: 'title', type: 'string', nullable: false },
      { name: 'content', type: 'string', nullable: false },
      { name: 'is_active', type: 'boolean', nullable: false },
      { name: 'priority', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'expires_at', type: 'string', nullable: true },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'staging_processing_summary': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'table_name', type: 'string', nullable: false },
      { name: 'processed_count', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'state_districts': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'state', type: 'string', nullable: false },
      { name: 'district_number', type: 'string', nullable: false },
      { name: 'district_name', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'system_configuration': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'config_key', type: 'string', nullable: false },
      { name: 'config_value', type: 'string', nullable: false },
      { name: 'config_type', type: 'string', nullable: false },
      { name: 'is_active', type: 'boolean', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'trending_topics': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'topic_name', type: 'string', nullable: false },
      { name: 'topic_type', type: 'string', nullable: false },
      { name: 'trend_score', type: 'number', nullable: false },
      { name: 'engagement_count', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'user_analytics': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'metric_name', type: 'string', nullable: false },
      { name: 'metric_value', type: 'number', nullable: false },
      { name: 'period_start', type: 'string', nullable: false },
      { name: 'period_end', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'user_civics_preferences': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'preferred_topics', type: 'string[]', nullable: false },
      { name: 'preferred_hashtags', type: 'string[]', nullable: false },
      { name: 'notification_frequency', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'user_consent': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'consent_type', type: 'string', nullable: false },
      { name: 'consent_given', type: 'boolean', nullable: false },
      { name: 'consent_version', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'user_engagement_summary': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'stable_user_id', type: 'string', nullable: false },
      { name: 'user_hash', type: 'string', nullable: false },
      { name: 'total_polls_participated', type: 'number', nullable: false },
      { name: 'total_votes_cast', type: 'number', nullable: false },
      { name: 'average_engagement_score', type: 'number', nullable: false },
      { name: 'current_trust_tier', type: 'string', nullable: false },
      { name: 'trust_tier_history', type: 'Record<string, unknown>', nullable: false },
      { name: 'trust_tier_upgrade_date', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false }
    ]
  },
  'user_feedback_analytics': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'feedback_id', type: 'string', nullable: false },
      { name: 'metric_name', type: 'string', nullable: false },
      { name: 'metric_value', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'user_hashtags': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'hashtag_id', type: 'string', nullable: false },
      { name: 'followed_at', type: 'string', nullable: false },
      { name: 'is_primary', type: 'boolean', nullable: false },
      { name: 'usage_count', type: 'number', nullable: false },
      { name: 'last_used_at', type: 'string', nullable: true },
      { name: 'preferences', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'user_location_resolutions': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'ip_address', type: 'string', nullable: true },
      { name: 'resolved_location', type: 'Record<string, unknown>', nullable: false },
      { name: 'resolution_method', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'user_notification_preferences': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'notification_type', type: 'string', nullable: false },
      { name: 'is_enabled', type: 'boolean', nullable: false },
      { name: 'frequency', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'user_privacy_analytics': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'privacy_event_type', type: 'string', nullable: false },
      { name: 'privacy_event_value', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'user_profiles': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'username', type: 'string', nullable: false },
      { name: 'email', type: 'string', nullable: false },
      { name: 'trust_tier', type: 'string', nullable: false },
      { name: 'avatar_url', type: 'string', nullable: true },
      { name: 'bio', type: 'string', nullable: true },
      { name: 'is_active', type: 'boolean', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'updated_at', type: 'string', nullable: false },
      { name: 'is_admin', type: 'boolean', nullable: false },
      { name: 'geo_lat', type: 'string', nullable: true },
      { name: 'geo_lon', type: 'string', nullable: true },
      { name: 'geo_precision', type: 'string', nullable: true },
      { name: 'geo_updated_at', type: 'string', nullable: true },
      { name: 'geo_source', type: 'string', nullable: true },
      { name: 'geo_consent_version', type: 'string', nullable: true },
      { name: 'geo_coarse_hash', type: 'string', nullable: true },
      { name: 'geo_trust_gate', type: 'string', nullable: false },
      { name: 'display_name', type: 'string', nullable: true },
      { name: 'preferences', type: 'Record<string, unknown>', nullable: false },
      { name: 'privacy_settings', type: 'Record<string, unknown>', nullable: false },
      { name: 'primary_concerns', type: 'string', nullable: true },
      { name: 'community_focus', type: 'string', nullable: true },
      { name: 'participation_style', type: 'string', nullable: false },
      { name: 'demographics', type: 'Record<string, unknown>', nullable: false },
      { name: 'onboarding_completed', type: 'boolean', nullable: false },
      { name: 'onboarding_data', type: 'Record<string, unknown>', nullable: false },
      { name: 'location_data', type: 'Record<string, unknown>', nullable: false },
      { name: 'primary_hashtags', type: 'string[]', nullable: false },
      { name: 'followed_hashtags', type: 'string[]', nullable: false },
      { name: 'hashtag_preferences', type: 'Record<string, unknown>', nullable: false },
      { name: 'total_polls_created', type: 'number', nullable: false },
      { name: 'total_votes_cast', type: 'number', nullable: false },
      { name: 'total_engagement_score', type: 'number', nullable: false },
      { name: 'trust_score', type: 'number', nullable: false },
      { name: 'reputation_points', type: 'number', nullable: false },
      { name: 'verification_status', type: 'string', nullable: false }
    ]
  },
  'user_profiles_encrypted': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'encrypted_profile_data', type: 'string', nullable: false },
      { name: 'encryption_key_id', type: 'string', nullable: true },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'votes': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'poll_id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'vote_choice', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'updated_at', type: 'string', nullable: false },
      { name: 'ip_address', type: 'string', nullable: true },
      { name: 'user_agent', type: 'string', nullable: true },
      { name: 'session_id', type: 'string', nullable: true },
      { name: 'device_fingerprint', type: 'string', nullable: true },
      { name: 'time_spent_seconds', type: 'number', nullable: false },
      { name: 'page_views', type: 'number', nullable: false },
      { name: 'engagement_actions', type: 'Record<string, unknown>', nullable: false },
      { name: 'trust_score_at_vote', type: 'number', nullable: true },
      { name: 'vote_metadata', type: 'Record<string, unknown>', nullable: false },
      { name: 'analytics_data', type: 'Record<string, unknown>', nullable: false },
      { name: 'is_active', type: 'boolean', nullable: false }
    ]
  },
  'voting_records': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'poll_id', type: 'string', nullable: false },
      { name: 'vote_choice', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'webauthn_challenges': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'challenge', type: 'string', nullable: false },
      { name: 'expires_at', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'webauthn_credentials': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'user_id', type: 'string', nullable: false },
      { name: 'credential_id', type: 'string', nullable: false },
      { name: 'public_key', type: 'string', nullable: false },
      { name: 'counter', type: 'number', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'last_used_at', type: 'string', nullable: true },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  },
  'zip_to_ocd': {
    columns: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'zip_code', type: 'string', nullable: false },
      { name: 'ocd_id', type: 'string', nullable: false },
      { name: 'created_at', type: 'string', nullable: false },
      { name: 'metadata', type: 'Record<string, unknown>', nullable: false }
    ]
  }
};

function generateTypeScriptInterface() {
  const timestamp = new Date().toISOString();
  
  let ts = `/**
 * Complete Database Schema Types
 * 
 * Generated on: ${timestamp}
 * 
 * This file contains the complete database schema for ALL 100+ tables
 * in the Choices civic engagement platform.
 * 
 * Total tables: ${Object.keys(ALL_TABLES).length}
 * 
 * Systems covered:
 * - Core Application (4 tables)
 * - Hashtag System (7 tables)
 * - Analytics & Monitoring (15+ tables)
 * - Civics & Government Data (25+ tables)
 * - Privacy & Compliance (10+ tables)
 * - Data Quality & Monitoring (15+ tables)
 * - Authentication & Security (8+ tables)
 * - User Management (10+ tables)
 * - Content & Moderation (5+ tables)
 * - System Administration (10+ tables)
 */

export interface Database {
  public: {
    Tables: {
`;

  // Generate table interfaces for all tables
  for (const [tableName, tableDef] of Object.entries(ALL_TABLES)) {
    ts += `      ${tableName}: {\n`;
    ts += `        Row: {\n`;
    
    // Generate Row interface
    for (const column of tableDef.columns) {
      const optional = column.nullable ? '?' : '';
      ts += `          ${column.name}${optional}: ${column.type}\n`;
    }
    
    ts += `        }\n`;
    ts += `        Insert: {\n`;
    
    // Generate Insert interface
    for (const column of tableDef.columns) {
      const optional = column.nullable ? '?' : '';
      ts += `          ${column.name}${optional}: ${column.type}\n`;
    }
    
    ts += `        }\n`;
    ts += `        Update: {\n`;
    
    // Generate Update interface
    for (const column of tableDef.columns) {
      ts += `          ${column.name}?: ${column.type}\n`;
    }
    
    ts += `        }\n`;
    ts += `      }\n`;
  }
  
  // Add views
  ts += `    }\n`;
  ts += `    Views: {\n`;
  ts += `      demographic_analytics: {\n`;
  ts += `        Row: {\n`;
  ts += `          poll_id: string\n`;
  ts += `          age_bucket: string\n`;
  ts += `          region_bucket: string\n`;
  ts += `          education_bucket: string\n`;
  ts += `          participant_count: number\n`;
  ts += `          average_choice: number\n`;
  ts += `          choice_variance: number\n`;
  ts += `          first_contribution: string\n`;
  ts += `          last_contribution: string\n`;
  ts += `        }\n`;
  ts += `      }\n`;
  ts += `      hashtag_performance_summary: {\n`;
  ts += `        Row: {\n`;
  ts += `          hashtag_id: string\n`;
  ts += `          hashtag_name: string\n`;
  ts += `          total_usage: number\n`;
  ts += `          average_metric: number\n`;
  ts += `          last_activity: string\n`;
  ts += `        }\n`;
  ts += `      }\n`;
  ts += `      user_engagement_summary: {\n`;
  ts += `        Row: {\n`;
  ts += `          user_id: string\n`;
  ts += `          username: string\n`;
  ts += `          polls_created: number\n`;
  ts += `          votes_cast: number\n`;
  ts += `          engagement_score: number\n`;
  ts += `        }\n`;
  ts += `      }\n`;
  ts += `    }\n`;
  ts += `    Functions: {\n`;
  ts += `      [_ in never]: never\n`;
  ts += `    }\n`;
  ts += `    Enums: {\n`;
  ts += `      [_ in never]: never\n`;
  ts += `    }\n`;
  ts += `  }\n`;
  ts += `}\n`;
  
  return ts;
}

async function main() {
  console.log('🔧 Generating Complete TypeScript Types');
  console.log('=' .repeat(50));
  console.log(`📊 Total tables to process: ${Object.keys(ALL_TABLES).length}`);
  console.log('');

  try {
    // Generate the complete TypeScript interface
    const tsInterface = generateTypeScriptInterface();
    
    // Save to file
    const outputPath = path.join(__dirname, '../web/types/database-schema-complete.ts');
    fs.writeFileSync(outputPath, tsInterface);
    
    console.log(`✅ Complete TypeScript types generated and saved to: ${outputPath}`);
    console.log(`📊 Total tables processed: ${Object.keys(ALL_TABLES).length}`);
    
    // List all tables
    console.log('\n📋 All tables included:');
    Object.keys(ALL_TABLES).forEach((table, i) => {
      console.log(`  ${i+1}. ${table}`);
    });
    
    console.log('\n🎯 Next steps:');
    console.log('  1. Replace the manual Database interface with this generated one');
    console.log('  2. Run TypeScript compilation to verify all types are correct');
    console.log('  3. Fix any remaining type errors');
    console.log('  4. Continue with testing phase');
    
  } catch (error) {
    console.error('❌ TypeScript type generation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
