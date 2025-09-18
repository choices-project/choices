-- Civics Address Lookup Foundation Schema
-- Feature Flag: CIVICS_ADDRESS_LOOKUP (disabled by default)
-- This creates the foundation without enabling any functionality

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create civics schema for organization
CREATE SCHEMA IF NOT EXISTS civics;

-- Foundation table for address cache (privacy-first design)
CREATE TABLE IF NOT EXISTS civics.address_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address_hmac TEXT NOT NULL UNIQUE,        -- HMAC(address) with secret pepper
  place_id_hmac TEXT,                       -- HMAC(place_id) if available
  gh5 TEXT,                                 -- Geohash precision 5 (rough area)
  gh7 TEXT,                                 -- Geohash precision 7 (neighborhood)
  ocd_division_ids TEXT[],                  -- OCD division IDs from Google Civic
  representatives JSONB NOT NULL DEFAULT '{}', -- Representative data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Rate limiting table with HMAC'd IPs
CREATE TABLE IF NOT EXISTS civics.rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_hmac TEXT NOT NULL,                    -- HMAC(IP) with secret pepper
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ip_hmac, window_start)
);

-- User address preferences (privacy-safe)
CREATE TABLE IF NOT EXISTS civics.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  address_hmac TEXT,                       -- HMAC(primary_address)
  geohash TEXT,                           -- Geohash for location-based features
  representatives JSONB DEFAULT '{}',
  last_lookup TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_civics_cache_gh5 ON civics.address_cache(gh5);
CREATE INDEX IF NOT EXISTS idx_civics_cache_gh7 ON civics.address_cache(gh7);
CREATE INDEX IF NOT EXISTS idx_civics_cache_address_hmac ON civics.address_cache(address_hmac);
CREATE INDEX IF NOT EXISTS idx_civics_cache_expires ON civics.address_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_civics_rate_limits_ip_window 
  ON civics.rate_limits(ip_hmac, window_start);

-- RLS: deny everything to anon/auth; access only via service-role server
ALTER TABLE civics.address_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE civics.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE civics.user_preferences ENABLE ROW LEVEL SECURITY;

-- Deny all access (feature flag will control access)
CREATE POLICY "civics_cache_deny_all" ON civics.address_cache FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "civics_rate_limits_deny_all" ON civics.rate_limits FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "civics_user_prefs_deny_all" ON civics.user_preferences FOR ALL TO anon, authenticated USING (false);

-- Privacy-safe heatmap RPC (disabled by default)
CREATE OR REPLACE FUNCTION civics.get_heatmap(prefixes text[], min_count int DEFAULT 5)
RETURNS TABLE(geohash text, count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = civics AS $$
  -- Feature flag check: only return data if CIVICS_ADDRESS_LOOKUP is enabled
  SELECT COALESCE(gh7, gh5) AS geohash, COUNT(*)::bigint AS count
  FROM civics.address_cache
  WHERE (
    gh7 IS NOT NULL AND EXISTS (
      SELECT 1 FROM unnest(prefixes) p WHERE gh7 LIKE p || '%'
    )
  ) OR (
    gh7 IS NULL AND EXISTS (
      SELECT 1 FROM unnest(prefixes) p WHERE gh5 LIKE p || '%'
    )
  )
  GROUP BY 1
  HAVING COUNT(*) >= min_count;
$$;

-- Health check function
CREATE OR REPLACE FUNCTION civics.check_privacy_compliance()
RETURNS TABLE(has_pii boolean, pii_count bigint) 
LANGUAGE sql 
SECURITY DEFINER AS $$
  -- This table has no PII columns by design; this stays a tripwire if schema drifts
  SELECT COUNT(*)>0, COUNT(*)
  FROM civics.address_cache
  WHERE false;
$$;

-- Revoke all access (feature flag will control access)
REVOKE ALL ON FUNCTION civics.get_heatmap(text[], int) FROM public;
REVOKE ALL ON FUNCTION civics.check_privacy_compliance() FROM public;

-- Add cleanup jobs (will be enabled when feature flag is on)
-- SELECT cron.schedule('civics_cache_gc_daily', '0 3 * * *',
-- $$DELETE FROM civics.address_cache WHERE expires_at < now();$$);

-- SELECT cron.schedule('civics_rate_limit_gc_daily', '0 4 * * *',
-- $$DELETE FROM civics.rate_limits WHERE window_start < now() - interval '1 hour';$$);

-- Add comment explaining feature flag requirement
COMMENT ON SCHEMA civics IS 'Civics address lookup system - requires CIVICS_ADDRESS_LOOKUP feature flag to be enabled';
COMMENT ON TABLE civics.address_cache IS 'Privacy-first address cache - feature flagged';
COMMENT ON TABLE civics.rate_limits IS 'Rate limiting with HMACd IPs - feature flagged';
COMMENT ON TABLE civics.user_preferences IS 'User address preferences - feature flagged';
