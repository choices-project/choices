-- Remove Dangerous Location Fields Migration
-- CRITICAL: Remove dangerous geo_lat, geo_lon fields for privacy protection
-- Created: January 19, 2025
-- Priority: URGENT - Privacy & Security

-- Step 1: Create backup of dangerous location data
CREATE TABLE IF NOT EXISTS user_location_backup AS
SELECT 
  id as user_id,
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

-- Step 2: Remove dangerous location fields from user_profiles
-- WARNING: This will permanently delete precise location data
ALTER TABLE user_profiles DROP COLUMN IF EXISTS geo_lat;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS geo_lon;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS geo_precision;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS geo_source;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS geo_trust_gate;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS geo_coarse_hash;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS geo_consent_version;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS geo_updated_at;

-- Step 3: Add comments to document the removal
COMMENT ON TABLE user_profiles IS 'User profiles table - dangerous location fields removed for privacy protection';

-- Step 4: Verify removal
-- This will show no rows if successful
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name LIKE 'geo_%';

-- Step 5: Create view for safe location queries
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

-- Step 6: Create function to check if dangerous fields exist
CREATE OR REPLACE FUNCTION check_dangerous_fields_removed()
RETURNS BOOLEAN AS $$
DECLARE
  dangerous_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dangerous_count
  FROM information_schema.columns 
  WHERE table_name = 'user_profiles' 
  AND column_name LIKE 'geo_%';
  
  RETURN dangerous_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Test the function
SELECT check_dangerous_fields_removed() as dangerous_fields_removed;

-- Migration completed successfully
-- Next steps:
-- 1. Update TypeScript types to remove geo_lat/geo_lon
-- 2. Update application code to use privacy service
-- 3. Test privacy implementation
-- 4. Verify compliance
