-- ============================================================================
-- IMPORTANT: Update Heatmap Function to District-Based
-- This replaces the geohash-based version with district-based analytics
-- ============================================================================

-- Drop the old geohash-based function
DROP FUNCTION IF EXISTS get_heatmap(TEXT[], INTEGER);

-- Create the new district-based function
CREATE OR REPLACE FUNCTION get_heatmap(
  state_filter TEXT DEFAULT NULL,
  level_filter TEXT DEFAULT NULL,
  min_count INTEGER DEFAULT 5
)
RETURNS TABLE(
  district_id TEXT,
  district_name TEXT,
  state TEXT,
  level TEXT,
  engagement_count INTEGER,
  representative_count INTEGER
) AS $$
BEGIN
  -- Return district-level civic engagement with k-anonymity protection
  -- Aggregates user activity by political district
  -- Only returns districts with >= min_count users for privacy
  
  RETURN QUERY
  SELECT 
    COALESCE(r.state || '-' || COALESCE(r.district, 'STATEWIDE'), r.state) as district_id,
    CASE 
      WHEN r.district IS NOT NULL THEN 'District ' || r.district
      ELSE 'Statewide'
    END as district_name,
    r.state,
    r.level,
    COUNT(DISTINCT up.user_id)::INTEGER as engagement_count,
    COUNT(DISTINCT r.id)::INTEGER as representative_count
  FROM representatives_core r
  LEFT JOIN user_profiles up ON 
    up.state = r.state AND
    (r.district IS NULL OR up.district = r.district)
  WHERE 
    (state_filter IS NULL OR r.state = state_filter) AND
    (level_filter IS NULL OR r.level = level_filter)
  GROUP BY r.state, r.district, r.level
  HAVING COUNT(DISTINCT up.user_id) >= min_count
  ORDER BY engagement_count DESC
  LIMIT 100;
  
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist yet, return empty
    RETURN;
  WHEN OTHERS THEN
    RAISE WARNING 'Error in get_heatmap: %', SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update permissions
GRANT EXECUTE ON FUNCTION get_heatmap(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_heatmap(TEXT, TEXT, INTEGER) TO anon;

-- Update comment
COMMENT ON FUNCTION get_heatmap(TEXT, TEXT, INTEGER) IS 
  'Returns district-level civic engagement heatmap with k-anonymity protection. Aggregates by congressional/legislative districts.';

SELECT 'Heatmap function updated successfully - now district-based!' as status;

