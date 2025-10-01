-- ============================================================================
-- 2025-09-27: Browser Location Capture Schema
-- Adds canonical jurisdiction tables, user location resolution storage,
-- and supporting infrastructure for privacy-first geolocation capture.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS civic_jurisdictions (
  ocd_division_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN (
    'country', 'state', 'county', 'city', 'place', 'district', 'precinct', 'ward', 'custom'
  )),
  jurisdiction_type TEXT,
  parent_ocd_id TEXT REFERENCES civic_jurisdictions(ocd_division_id) ON DELETE SET NULL,
  country_code TEXT DEFAULT 'US',
  state_code TEXT,
  county_name TEXT,
  city_name TEXT,
  geo_scope TEXT,
  centroid_lat NUMERIC(9,6),
  centroid_lon NUMERIC(9,6),
  bounding_box JSONB,
  population INTEGER,
  source TEXT NOT NULL DEFAULT 'import',
  last_refreshed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS jurisdiction_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_type TEXT NOT NULL CHECK (alias_type IN ('zip', 'place', 'district', 'legacy', 'custom')),
  alias_value TEXT NOT NULL,
  normalized_value TEXT,
  ocd_division_id TEXT NOT NULL REFERENCES civic_jurisdictions(ocd_division_id) ON DELETE CASCADE,
  confidence NUMERIC(4,3) DEFAULT 1.000 CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT NOT NULL DEFAULT 'import',
  last_refreshed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS jurisdiction_geometries (
  ocd_division_id TEXT PRIMARY KEY REFERENCES civic_jurisdictions(ocd_division_id) ON DELETE CASCADE,
  geometry JSONB NOT NULL,
  geometry_format TEXT NOT NULL DEFAULT 'geojson',
  simplified_geometry JSONB,
  area_sq_km NUMERIC,
  perimeter_km NUMERIC,
  source TEXT NOT NULL,
  last_refreshed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS jurisdiction_tiles (
  ocd_division_id TEXT NOT NULL REFERENCES civic_jurisdictions(ocd_division_id) ON DELETE CASCADE,
  h3_index TEXT NOT NULL,
  resolution SMALLINT NOT NULL CHECK (resolution BETWEEN 0 AND 15),
  source TEXT NOT NULL DEFAULT 'generated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY (ocd_division_id, h3_index)
);

CREATE TABLE IF NOT EXISTS candidate_jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  ocd_division_id TEXT NOT NULL REFERENCES civic_jurisdictions(ocd_division_id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('represents', 'running_for', 'former', 'candidate')),
  effective_from DATE,
  effective_to DATE,
  source TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(candidate_id, ocd_division_id, role)
);

CREATE TABLE IF NOT EXISTS user_location_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address_hash TEXT,
  resolved_ocd_id TEXT REFERENCES civic_jurisdictions(ocd_division_id) ON DELETE SET NULL,
  lat_q11 NUMERIC(9,6),
  lon_q11 NUMERIC(9,6),
  accuracy_m INTEGER,
  geo_precision TEXT NOT NULL CHECK (geo_precision IN ('exact', 'approximate', 'zip', 'city', 'state', 'unknown')),
  source TEXT NOT NULL CHECK (source IN ('browser', 'manual', 'import', 'support', 'fallback')),
  consent_version INTEGER NOT NULL DEFAULT 1,
  consent_scope TEXT DEFAULT 'demographics',
  coarse_hash TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS location_consent_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resolution_id UUID REFERENCES user_location_resolutions(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('granted', 'revoked', 'deleted', 'regranted')),
  scope TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'user' CHECK (actor IN ('user', 'system', 'admin')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS geo_lat NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS geo_lon NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS geo_precision TEXT CHECK (geo_precision IN ('exact', 'approximate', 'zip', 'city', 'state', 'unknown')),
  ADD COLUMN IF NOT EXISTS geo_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS geo_source TEXT,
  ADD COLUMN IF NOT EXISTS geo_consent_version INTEGER,
  ADD COLUMN IF NOT EXISTS geo_coarse_hash TEXT,
  ADD COLUMN IF NOT EXISTS geo_trust_gate TEXT DEFAULT 'all' CHECK (geo_trust_gate IN ('all', 'trusted_only'));

CREATE INDEX IF NOT EXISTS idx_civic_jurisdictions_parent ON civic_jurisdictions(parent_ocd_id);
CREATE INDEX IF NOT EXISTS idx_civic_jurisdictions_level ON civic_jurisdictions(level);
CREATE INDEX IF NOT EXISTS idx_civic_jurisdictions_state ON civic_jurisdictions(state_code);
CREATE UNIQUE INDEX IF NOT EXISTS uid_jurisdiction_aliases_alias ON jurisdiction_aliases(alias_type, alias_value);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_aliases_ocd ON jurisdiction_aliases(ocd_division_id);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_tiles_h3 ON jurisdiction_tiles(h3_index);
CREATE INDEX IF NOT EXISTS idx_candidate_jurisdictions_ocd ON candidate_jurisdictions(ocd_division_id);
CREATE UNIQUE INDEX IF NOT EXISTS uid_user_location_resolutions_active ON user_location_resolutions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_location_resolutions_hash ON user_location_resolutions(address_hash) WHERE address_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_location_resolutions_ocd ON user_location_resolutions(resolved_ocd_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_location_consent_audit_user ON location_consent_audit(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_geo_updated_at ON user_profiles(geo_updated_at) WHERE geo_updated_at IS NOT NULL;

ALTER TABLE civic_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdiction_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdiction_geometries ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdiction_tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_location_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_consent_audit ENABLE ROW LEVEL SECURITY;

-- Read policies for public jurisdiction metadata
CREATE POLICY civic_jurisdictions_select ON civic_jurisdictions
  FOR SELECT USING (true);

CREATE POLICY jurisdiction_aliases_select ON jurisdiction_aliases
  FOR SELECT USING (true);

CREATE POLICY jurisdiction_geometries_select ON jurisdiction_geometries
  FOR SELECT USING (true);

CREATE POLICY jurisdiction_tiles_select ON jurisdiction_tiles
  FOR SELECT USING (true);

CREATE POLICY candidate_jurisdictions_select ON candidate_jurisdictions
  FOR SELECT USING (true);

-- User-specific policies for location resolutions and consent audit
CREATE POLICY user_location_resolutions_select ON user_location_resolutions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_location_resolutions_insert ON user_location_resolutions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_location_resolutions_update ON user_location_resolutions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_location_resolutions_delete ON user_location_resolutions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY location_consent_audit_select ON location_consent_audit
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY location_consent_audit_insert ON location_consent_audit
  FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMIT;
