import { createProfilePayload, type ProfileResponsePayload } from '@/lib/api/response-builders';

/** Remove privilege fields from profile payloads returned to the signed-in owner. */
export function createOwnerProfilePayload(
  record?: Record<string, unknown> | null,
): ProfileResponsePayload {
  const payload = createProfilePayload(record);
  if (!payload.profile) {
    return payload;
  }

  const {
    is_admin: _isAdmin,
    is_active: _isActive,
    trust_tier_score: _trustTierScore,
    trust_tier_version: _trustTierVersion,
    integrity_consent_at: _integrityConsentAt,
    integrity_consent_scope: _integrityConsentScope,
    ...safeProfile
  } = payload.profile as Record<string, unknown>;

  return {
    ...payload,
    profile: safeProfile as ProfileResponsePayload['profile'],
  };
}
