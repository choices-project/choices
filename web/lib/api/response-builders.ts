import { normalizeTrustTier } from '@/lib/trust/trust-tiers';

import type { PrivacySettings, UserProfile } from './types';

/** Explicit columns for user_profiles select (avoid select('*')) */
export const PROFILE_SELECT_COLUMNS =
  'id, user_id, email, display_name, username, avatar_url, bio, trust_tier, is_admin, is_active, created_at, updated_at, demographics, privacy_settings, primary_concerns, community_focus, participation_style, dashboard_layout, analytics_dashboard_mode';

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

