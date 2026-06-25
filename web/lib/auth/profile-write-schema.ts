import { z } from 'zod';

/** Columns a signed-in user may change via /api/profile (never privilege or trust fields). */
export const PROFILE_OWNER_WRITABLE_FIELDS = [
  'email',
  'avatar_url',
  'bio',
  'display_name',
  'username',
  'community_focus',
  'primary_concerns',
  'primary_hashtags',
  'followed_hashtags',
  'preferences',
  'demographics',
  'location_data',
  'privacy_settings',
] as const;

const privilegedProfileFields = [
  'is_admin',
  'is_active',
  'trust_tier',
  'trust_tier_score',
  'trust_tier_version',
  'integrity_consent_at',
  'integrity_consent_scope',
  'user_id',
  'id',
  'created_at',
  'updated_at',
  'participation_style',
  'dashboard_layout',
  'analytics_dashboard_mode',
] as const;

export const profileOwnerUpdateSchema = z
  .object({
    email: z.string().email(),
    avatar_url: z.string().url().optional().or(z.literal('')),
    bio: z.string().max(500).optional(),
    display_name: z.string().max(100).optional(),
    username: z.string().min(3).max(50).optional(),
    community_focus: z.array(z.string()).optional(),
    primary_concerns: z.array(z.string()).optional(),
    primary_hashtags: z.array(z.string()).optional(),
    followed_hashtags: z.array(z.string()).optional(),
    preferences: z.any().optional(),
    demographics: z.any().optional(),
    location_data: z.any().optional(),
    privacy_settings: z.any().optional(),
  })
  .strict();

export type ProfileOwnerUpdate = z.infer<typeof profileOwnerUpdateSchema>;

export function parseProfileOwnerUpdate(data: unknown) {
  return profileOwnerUpdateSchema.safeParse(data);
}

export function parsePartialProfileOwnerUpdate(data: unknown) {
  return profileOwnerUpdateSchema.partial().safeParse(data);
}

/** Drop privilege / server-managed keys before persisting owner updates. */
export function stripPrivilegedProfileFields(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...data };
  for (const key of privilegedProfileFields) {
    delete next[key];
  }
  return next;
}

/** Owner-facing profile select (no admin flag). */
export const OWNER_PROFILE_SELECT_COLUMNS =
  'id, user_id, email, display_name, username, avatar_url, bio, trust_tier, created_at, updated_at, demographics, privacy_settings, primary_concerns, community_focus, participation_style, dashboard_layout, analytics_dashboard_mode';
