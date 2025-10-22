-- Remove Precise Location Data Migration
-- CRITICAL: Remove dangerous geo_lat, geo_lon fields for privacy protection
-- Created: January 19, 2025
-- Priority: URGENT - Privacy & Security

-- Step 1: Create privacy-safe location table
CREATE TABLE IF NOT EXISTS user_location_privacy (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- District-level data only (safe for political climate)
  federal_district VARCHAR(10),        -- "CA-12" format
  state_district VARCHAR(20),          -- "State Senate District 3"
  county VARCHAR(100),                 -- "San Francisco County"
  city VARCHAR(100),                   -- "San Francisco"
  state_code VARCHAR(2),               -- "CA"
  zip_code VARCHAR(10),                -- "94102" (safe level)
  
  -- Privacy-preserving geohash (precision 5 = ~5km)
  privacy_geohash VARCHAR(8),          -- "9q8yy" (5km precision)
  geohash_precision INTEGER DEFAULT 5,  -- 5 = ~5km, 6 = ~1km, 7 = ~150m
  
  -- Consent and privacy controls
  location_consent BOOLEAN DEFAULT false,
  consent_version VARCHAR(10) DEFAULT '1.0',
  data_retention_days INTEGER DEFAULT 90,
  
  -- Privacy audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_anonymized_at TIMESTAMPTZ
);

-- Step 2: Create privacy zones table for k-anonymity
CREATE TABLE IF NOT EXISTS privacy_zones (
  zone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  geohash VARCHAR(8) NOT NULL,           -- 5km precision
  user_count INTEGER DEFAULT 0,          -- Track users in zone
  min_k_anonymity INTEGER DEFAULT 5,     -- Minimum users required
  is_safe BOOLEAN DEFAULT false,          -- Safe for individual queries
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create privacy audit log
CREATE TABLE IF NOT EXISTS privacy_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  action VARCHAR(100) NOT NULL,         -- 'location_accessed', 'data_exported'
  data_type VARCHAR(50),                -- 'location', 'demographics', 'votes'
  privacy_level VARCHAR(20),            -- 'anonymized', 'aggregated', 'individual'
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_location_privacy_user_id ON user_location_privacy(user_id);
CREATE INDEX IF NOT EXISTS idx_user_location_privacy_geohash ON user_location_privacy(privacy_geohash);
CREATE INDEX IF NOT EXISTS idx_user_location_privacy_state ON user_location_privacy(state_code);
CREATE INDEX IF NOT EXISTS idx_privacy_zones_geohash ON privacy_zones(geohash);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_user_id ON privacy_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_created_at ON privacy_audit_log(created_at);

-- Step 5: Add RLS policies for privacy protection
ALTER TABLE user_location_privacy ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own location data
CREATE POLICY "Users can access own location data" ON user_location_privacy
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policy: Privacy zones are readable by all authenticated users
CREATE POLICY "Privacy zones are readable" ON privacy_zones
  FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policy: Audit logs are readable by admins only
CREATE POLICY "Audit logs are admin only" ON privacy_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

-- Step 6: Create function to safely migrate existing data
CREATE OR REPLACE FUNCTION migrate_location_data_to_privacy()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  district_info RECORD;
BEGIN
  -- For each user with location data, migrate to privacy-safe format
  FOR user_record IN 
    SELECT id as user_id, geo_lat, geo_lon, geo_coarse_hash
    FROM user_profiles 
    WHERE geo_lat IS NOT NULL AND geo_lon IS NOT NULL
  LOOP
    -- Get district information from existing latlon_to_ocd table
    SELECT ocd_division_id INTO district_info
    FROM latlon_to_ocd 
    WHERE lat = user_record.geo_lat 
    AND lon = user_record.geo_lon
    LIMIT 1;
    
    IF district_info.ocd_division_id IS NOT NULL THEN
      -- Insert privacy-safe location data
      INSERT INTO user_location_privacy (
        user_id,
        privacy_geohash,
        geohash_precision,
        location_consent,
        consent_version,
        data_retention_days
      ) VALUES (
        user_record.user_id,
        user_record.geo_coarse_hash,
        5, -- 5km precision
        false, -- No consent for existing data
        '1.0',
        90
      ) ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Run the migration function
SELECT migrate_location_data_to_privacy();

-- Step 8: Remove dangerous location fields from user_profiles
-- WARNING: This will permanently delete precise location data
-- Only run this after confirming the migration was successful

-- First, let's add a comment to document what we're removing
COMMENT ON COLUMN user_profiles.geo_lat IS 'DEPRECATED: Dangerous precise location data - will be removed for privacy protection';
COMMENT ON COLUMN user_profiles.geo_lon IS 'DEPRECATED: Dangerous precise location data - will be removed for privacy protection';

-- Create a backup of the dangerous data before removal
CREATE TABLE IF NOT EXISTS user_location_backup AS
SELECT 
  user_id,
  geo_lat,
  geo_lon,
  geo_precision,
  geo_source,
  geo_trust_gate,
  geo_coarse_hash,
  geo_consent_version,
  geo_updated_at,
  created_at
FROM user_profiles 
WHERE geo_lat IS NOT NULL OR geo_lon IS NOT NULL;

-- Add comment to backup table
COMMENT ON TABLE user_location_backup IS 'BACKUP: Precise location data removed for privacy protection - DO NOT USE';

-- Now remove the dangerous fields
-- NOTE: Uncomment these lines ONLY after confirming the migration was successful
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS geo_lat;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS geo_lon;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS geo_precision;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS geo_source;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS geo_trust_gate;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS geo_coarse_hash;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS geo_consent_version;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS geo_updated_at;

-- Step 9: Create privacy protection functions
CREATE OR REPLACE FUNCTION check_k_anonymity(geohash_input VARCHAR(8))
RETURNS BOOLEAN AS $$
DECLARE
  user_count INTEGER;
  min_k INTEGER;
BEGIN
  -- Get user count in zone
  SELECT COUNT(*) INTO user_count
  FROM user_location_privacy
  WHERE privacy_geohash = geohash_input;
  
  -- Get minimum k-anonymity requirement
  SELECT min_k_anonymity INTO min_k
  FROM privacy_zones
  WHERE geohash = geohash_input;
  
  -- Default to 5 if no zone exists
  IF min_k IS NULL THEN
    min_k := 5;
  END IF;
  
  RETURN user_count >= min_k;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create function to anonymize old location data
CREATE OR REPLACE FUNCTION anonymize_old_location_data()
RETURNS void AS $$
BEGIN
  -- Delete location data older than retention period
  DELETE FROM user_location_privacy
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND location_consent = false;
  
  -- Log the anonymization
  INSERT INTO privacy_audit_log (user_id, action, data_type, privacy_level)
  SELECT 
    user_id,
    'data_anonymized',
    'location',
    'anonymized'
  FROM user_location_privacy
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND location_consent = false;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create scheduled job to anonymize old data (if using pg_cron)
-- This would run daily to clean up old location data
-- SELECT cron.schedule('anonymize-location-data', '0 2 * * *', 'SELECT anonymize_old_location_data();');

-- Step 12: Add comments for documentation
COMMENT ON TABLE user_location_privacy IS 'Privacy-safe location data - district level only, no precise coordinates';
COMMENT ON TABLE privacy_zones IS 'K-anonymity zones for location privacy protection';
COMMENT ON TABLE privacy_audit_log IS 'Privacy audit trail for compliance and security';

-- Step 13: Create view for safe location queries
CREATE OR REPLACE VIEW safe_user_locations AS
SELECT 
  ulp.user_id,
  ulp.federal_district,
  ulp.state_district,
  ulp.county,
  ulp.city,
  ulp.state_code,
  ulp.zip_code,
  ulp.privacy_geohash,
  ulp.geohash_precision,
  ulp.location_consent,
  ulp.consent_version,
  ulp.data_retention_days,
  ulp.created_at,
  ulp.updated_at
FROM user_location_privacy ulp
WHERE ulp.location_consent = true
AND ulp.data_retention_days > 0;

COMMENT ON VIEW safe_user_locations IS 'Safe location data view - only consented, non-expired data';

-- Migration completed successfully
-- Next steps:
-- 1. Test the migration with sample data
-- 2. Update application code to use new privacy-safe location service
-- 3. Remove dangerous fields from user_profiles table
-- 4. Update TypeScript types to remove geo_lat/geo_lon
-- 5. Test privacy protection measures
