import { normalizeTrustTier } from '@/lib/trust/trust-tiers';

import type { PrivacySettings, UserProfile } from './types';

/** Explicit columns for user_profiles select (avoid select('*')) */
export const PROFILE_SELECT_COLUMNS =
  'id, user_id, email, display_name, username, avatar_url, bio, trust_tier, trust_tier_score, trust_tier_version, integrity_consent_at, integrity_consent_scope, is_admin, is_active, created_at, updated_at, demographics, privacy_settings, primary_concerns, community_focus, participation_style, dashboard_layout, analytics_dashboard_mode';

/** Explicit columns for hashtag_flags select (avoid select('*')) */
export const HASHTAG_FLAG_SELECT_COLUMNS =
  'id, hashtag_id, flag_type, reason, status, user_id, flagged_by, reviewed_at, reviewed_by, created_at';

/** Explicit columns for hashtags select (avoid select('*')) */
export const HASHTAGS_SELECT_COLUMNS =
  'id, name, category, description, follower_count, usage_count, is_featured, is_trending, is_verified, trending_score, created_at, updated_at, created_by, metadata';

/** Explicit columns for user_hashtags select (avoid select('*')) */
export const USER_HASHTAGS_SELECT_COLUMNS =
  'id, user_id, hashtag_id, followed_at, created_at, is_primary, last_used_at, preferences, usage_count';

/** Explicit columns for hashtag_usage select (avoid select('*')) */
export const HASHTAG_USAGE_SELECT_COLUMNS =
  'id, hashtag_id, created_at, user_id, poll_id, usage_type';

/** Explicit columns for hashtag_engagement select (avoid select('*')) */
export const HASHTAG_ENGAGEMENT_SELECT_COLUMNS =
  'id, engagement_type, hashtag_id, timestamp, user_id, created_at, metadata';

/** Explicit columns for hashtag_user_preferences select (avoid select('*')) */
export const HASHTAG_USER_PREFERENCES_SELECT_COLUMNS =
  'id, user_id, followed_hashtags, hashtag_filters, notification_preferences, created_at, updated_at';

/** Explicit columns for feed_items select (avoid select('*')) */
export const FEED_ITEMS_SELECT_COLUMNS =
  'id, feed_id, item_type, item_data, poll_id, position, is_featured, created_at, updated_at';

/** Explicit columns for audit_logs select (avoid select('*')) */
export const AUDIT_LOGS_SELECT_COLUMNS =
  'id, event_type, event_name, severity, user_id, session_id, ip_address, user_agent, request_path, request_method, resource, action, status, granted, metadata, error_message, error_stack, created_at, expires_at';

/** Explicit columns for moderation_reports select (avoid select('*')) */
export const MODERATION_REPORT_SELECT_COLUMNS =
  'id, reporter_id, target_type, target_id, reason, details, status, metadata, created_at, updated_at';

/** Explicit columns for moderation_actions select (avoid select('*')) */
export const MODERATION_ACTION_SELECT_COLUMNS =
  'id, actor_id, target_type, target_id, action, reason, status, metadata, created_at, expires_at';

/** Explicit columns for moderation_appeals select (avoid select('*')) */
export const MODERATION_APPEAL_SELECT_COLUMNS =
  'id, action_id, user_id, status, message, resolution, created_at, updated_at';

/** Explicit columns for feedback select (avoid select('*')). Minimal for insert response. */
export const FEEDBACK_SELECT_COLUMNS = 'id, created_at';

/** Explicit columns for site_messages select (avoid select('*')) */
export const SITE_MESSAGE_SELECT_COLUMNS =
  'id, title, message, type, priority, is_active, start_date, end_date, action_text, action_url, dismissible, target_audience, created_at, updated_at, metadata, status, view_count, last_viewed_at, created_by';

/** Explicit columns for user_privacy_preferences select (avoid select('*')) */
export const USER_PRIVACY_PREFERENCES_SELECT_COLUMNS =
  'user_id, profile_visibility, data_sharing_level, allow_contact, allow_research, allow_marketing, allow_analytics, notification_preferences, data_retention_preference, created_at, updated_at';

/** Explicit columns for notification_log select (avoid select('*')) */
export const NOTIFICATION_LOG_SELECT_COLUMNS =
  'id, user_id, title, body, status, payload, created_at, sent_at, subscription_id, error_message';

/** Explicit columns for webauthn_challenges select (avoid select('*')) */
export const WEBAUTHN_CHALLENGE_SELECT_COLUMNS =
  'id, user_id, kind, challenge, expires_at, used_at, rp_id, created_at, metadata';

/** Explicit columns for webauthn_credentials select (avoid select('*')) */
export const WEBAUTHN_CREDENTIAL_SELECT_COLUMNS =
  'id, credential_id, public_key, user_id, counter, created_at, last_used_at, device_label, rp_id, user_handle, metadata';

/** Explicit columns for device_flow select (avoid select('*')) */
export const DEVICE_FLOW_SELECT_COLUMNS =
  'id, device_code, user_code, provider, status, expires_at, client_ip, redirect_to, scopes, user_id, completed_at, created_at, updated_at, error_message';

/** Explicit columns for onboarding_progress select (avoid select('*')) */
export const ONBOARDING_PROGRESS_SELECT_COLUMNS =
  'user_id, current_step, completed_steps, step_data, started_at, last_activity_at, completed_at, total_time_minutes';

/** Explicit columns for civic_actions select (avoid select('*')) */
export const CIVIC_ACTION_SELECT_COLUMNS =
  'id, title, description, action_type, category, created_by, created_at, updated_at, status, is_public, urgency_level, start_date, end_date, required_signatures, current_signatures, target_state, target_district, target_office, target_representatives, target_representative_id, metadata, offline_synced';

/** Explicit columns for analytics_events share queries (avoid select('*')) */
export const ANALYTICS_EVENTS_SHARE_SELECT_COLUMNS =
  'id, event_type, event_data, created_at';

/** Explicit columns for representative_follows select (avoid select('*')) */
export const REPRESENTATIVE_FOLLOW_SELECT_COLUMNS =
  'user_id, representative_id, notify_on_votes, notify_on_committee_activity, notify_on_public_statements, notify_on_events, created_at, updated_at, notes, tags';

/** Explicit columns for candidate_email_challenges select (avoid select('*')) */
export const CANDIDATE_EMAIL_CHALLENGE_SELECT_COLUMNS =
  'id, user_id, candidate_id, code, email, expires_at, used_at, failed_attempts, created_at';

/** Explicit columns for official_email_fast_track select (avoid select('*')) */
export const OFFICIAL_EMAIL_FAST_TRACK_SELECT_COLUMNS =
  'id, domain, email, representative_id, verified, last_attempt_at';

/** Explicit columns for candidate_platforms select (avoid select('*')) */
export const CANDIDATE_PLATFORM_SELECT_COLUMNS =
  'id, user_id, candidate_name, party, photo_url, experience, platform_positions, endorsements, campaign_website, campaign_email, campaign_phone, visibility, status, ballot_access_confirmed, campaign_funding, created_at, updated_at, district, election_date, filing_deadline, filing_document_url, filing_jurisdiction, filing_status, jurisdiction, last_active_at, level, office, official_filing_date, official_filing_id, state, verification_method, verified, verified_at, verified_by';

/** Explicit columns for votes select (avoid select('*')) */
export const VOTES_SELECT_COLUMNS =
  'id, poll_id, option_id, poll_option_id, user_id, vote_status, trust_tier, created_at, updated_at, ip_address, voter_session, linked_at, offline_synced, offline_timestamp, poll_question';

/** Explicit columns for analytics tables (avoid select('*')) */
export const TRUST_TIER_ANALYTICS_SELECT_COLUMNS =
  'id, user_id, trust_tier, previous_tier, tier_change_reason, changed_by, created_at';
export const POLL_DEMOGRAPHIC_INSIGHTS_SELECT_COLUMNS =
  'poll_id, total_responses, average_confidence_level, age_group_breakdown, education_breakdown, geographic_breakdown, income_breakdown, political_breakdown, trust_tier_breakdown, demographic_by_trust_tier, trust_tier_by_demographic, data_quality_distribution, verification_method_distribution, created_at, updated_at';
export const PLATFORM_ANALYTICS_SELECT_COLUMNS =
  'id, metric_name, metric_type, metric_value, category, subcategory, dimensions, period_start, period_end, timestamp, source, metadata';
export const USER_SESSIONS_SELECT_COLUMNS =
  'id, session_id, user_id, is_active, last_activity, started_at, ended_at, actions_count, page_views, avg_page_load_time, bounce_rate, total_session_duration, device_info, location, metadata, conversion_events, user_agent, ip_address';
export const FEATURE_USAGE_SELECT_COLUMNS =
  'id, feature_name, action_type, session_id, user_id, timestamp, success, duration, error_message, context, metadata';
export const SYSTEM_HEALTH_SELECT_COLUMNS =
  'id, service_name, health_status, last_check, next_check, uptime_percentage, response_time, error_rate, alerts, details, metadata';

/** Explicit columns for user_consent select (avoid select('*')) */
export const USER_CONSENT_SELECT_COLUMNS =
  'id, user_id, consent_type, granted, granted_at, revoked_at, consent_version, purpose, data_types';

/** Explicit columns for idempotency_keys select (avoid select('*')) */
export const IDEMPOTENCY_KEYS_SELECT_COLUMNS =
  'key, expires_at, result_data, status, data, error_message, started_at';

/** Explicit columns for idempotency_monitor view select (avoid select('*')) */
export const IDEMPOTENCY_MONITOR_SELECT_COLUMNS =
  'status, count, stuck_count, avg_duration_seconds, max_duration_seconds';

export type ProfileResponsePayload = {
  profile: UserProfile | null;
  preferences: PrivacySettings | null;
  interests: {
    categories: string[];
    keywords: string[];
    topics: string[];
  };
  onboarding: {
    completed: boolean;
    data: Record<string, unknown>;
  };
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === 'string');
};

const toRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

export function createProfilePayload(record?: Record<string, unknown> | null): ProfileResponsePayload {
  const typedRecord = (record ?? null) as (Partial<UserProfile> & Record<string, unknown>) | null;
  const profile = typedRecord ? (typedRecord as UserProfile) : null;
  const normalizedProfile = profile
    ? {
        ...profile,
        trust_tier: normalizeTrustTier(profile.trust_tier),
      }
    : null;
  // Read preferences from preferences field first, fall back to privacy_settings for backward compatibility
  const preferences = (typedRecord?.preferences as PrivacySettings | undefined) ?? 
                      (typedRecord?.privacy_settings as PrivacySettings | undefined) ?? 
                      null;

  const categories = toStringArray(typedRecord?.primary_concerns);
  const keywords = toStringArray(typedRecord?.community_focus);
  const topics = toStringArray((typedRecord as { primary_hashtags?: unknown })?.primary_hashtags);
  const demographics = toRecord(typedRecord?.demographics);

  const onboardingCompleted = Boolean(
    typedRecord?.demographics &&
    typedRecord?.primary_concerns &&
    typedRecord?.community_focus &&
    typedRecord?.participation_style,
  );

  return {
    profile: normalizedProfile,
    preferences,
    interests: {
      categories,
      keywords,
      topics,
    },
    onboarding: {
      completed: onboardingCompleted,
      data: demographics,
    },
  };
}

