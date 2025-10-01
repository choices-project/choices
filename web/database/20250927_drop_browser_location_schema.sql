-- ============================================================================
-- 2025-09-27: Rollback script for browser location capture schema.
-- Drops jurisdiction/location tables and geo columns added in the forward migration.
-- ============================================================================

BEGIN;

ALTER TABLE user_profiles
  DROP COLUMN IF EXISTS geo_trust_gate,
  DROP COLUMN IF EXISTS geo_coarse_hash,
  DROP COLUMN IF EXISTS geo_consent_version,
  DROP COLUMN IF EXISTS geo_source,
  DROP COLUMN IF EXISTS geo_updated_at,
  DROP COLUMN IF EXISTS geo_precision,
  DROP COLUMN IF EXISTS geo_lon,
  DROP COLUMN IF EXISTS geo_lat;

DROP TABLE IF EXISTS location_consent_audit;
DROP TABLE IF EXISTS user_location_resolutions;
DROP TABLE IF EXISTS candidate_jurisdictions;
DROP TABLE IF EXISTS jurisdiction_tiles;
DROP TABLE IF EXISTS jurisdiction_geometries;
DROP TABLE IF EXISTS jurisdiction_aliases;
DROP TABLE IF EXISTS civic_jurisdictions;

COMMIT;
