-- Migration: Geographic Heatmap RPC Function
-- Created: November 5, 2025
-- Purpose: Privacy-safe geographic analytics with k-anonymity

-- ============================================================================
-- GET HEATMAP FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_heatmap(
  prefixes TEXT[],
  min_count INTEGER DEFAULT 5
)
RETURNS TABLE(geohash TEXT, count INTEGER) AS $$
BEGIN
  -- Return aggregated geohash counts with k-anonymity protection
  -- Only return counts >= min_count to preserve privacy
  
  RETURN QUERY
  SELECT 
    geo_prefix,
    user_count
  FROM (
    SELECT 
      LEFT(geohash, 5) as geo_prefix,
      COUNT(DISTINCT user_id)::INTEGER as user_count
    FROM user_locations
    WHERE LEFT(geohash, 3) = ANY(prefixes)
    GROUP BY LEFT(geohash, 5)
  ) subquery
  WHERE user_count >= min_count
  ORDER BY user_count DESC;
  
EXCEPTION
  WHEN undefined_table THEN
    -- user_locations table doesn't exist yet
    -- Return empty result instead of failing
    RETURN;
  WHEN OTHERS THEN
    RAISE WARNING 'Error in get_heatmap: %', SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_heatmap(TEXT[], INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_heatmap(TEXT[], INTEGER) TO anon;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_heatmap(TEXT[], INTEGER) IS 
  'Returns privacy-safe geographic heatmap data with k-anonymity (min_count threshold)';

