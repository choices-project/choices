# Update Heatmap Function for District-Based Analytics

## What Changed

The `get_heatmap()` function has been updated to use **congressional and legislative districts** instead of geohash grid cells. This is much more relevant for a civics platform.

---

## To Apply the Update

### Option 1: SQL Editor (Easiest)

Run this SQL in Supabase SQL Editor:

```sql
-- Drop old function
DROP FUNCTION IF EXISTS get_heatmap(TEXT[], INTEGER);

-- Then run the new function from:
```

Copy and paste from: `supabase/migrations/20251105000005_get_heatmap_function.sql`

### Option 2: Complete File

The updated combined file is ready:
```bash
APPLY_ALL_MIGRATIONS_NOV5_UPDATED.sql
```

---

## New Function Signature

### Before (Geohash-based):
```sql
get_heatmap(
  prefixes TEXT[],        -- Geohash prefixes
  min_count INTEGER       -- K-anonymity threshold
)
RETURNS TABLE(geohash TEXT, count INTEGER)
```

### After (District-based):
```sql
get_heatmap(
  state_filter TEXT,      -- Optional: Filter by state (e.g., "CA")
  level_filter TEXT,      -- Optional: "federal", "state", or "local"
  min_count INTEGER       -- K-anonymity threshold (default: 5)
)
RETURNS TABLE(
  district_id TEXT,           -- e.g., "CA-12" or "NY-STATEWIDE"
  district_name TEXT,         -- e.g., "District 12" or "Statewide"
  state TEXT,                 -- State code
  level TEXT,                 -- federal/state/local
  engagement_count INTEGER,   -- Number of engaged users
  representative_count INTEGER -- Number of representatives
)
```

---

## API Usage

### Before:
```http
GET /api/v1/civics/heatmap?bbox=...&precision=5
```
Returns: Random geohash grid cells

### After:
```http
GET /api/v1/civics/heatmap?state=CA&level=federal&min_count=5
```
Returns: District-level engagement data

**Example Response:**
```json
{
  "ok": true,
  "heatmap": [
    {
      "district_id": "CA-12",
      "district_name": "District 12",
      "state": "CA",
      "level": "federal",
      "engagement_count": 1247,
      "representative_count": 1
    },
    {
      "district_id": "NY-14",
      "district_name": "District 14", 
      "state": "NY",
      "level": "federal",
      "engagement_count": 892,
      "representative_count": 1
    }
  ],
  "k_anonymity": 5,
  "note": "District-level aggregation with k-anonymity protection"
}
```

---

## K-Anonymity Protection

**Privacy Guarantee:**
- Only shows districts with ≥ 5 users (configurable)
- Prevents identification of individuals
- Aggregates at meaningful civic boundaries
- Aligns with platform's civic mission

---

## Benefits

✅ **Civically Relevant** - Districts matter for representation  
✅ **Privacy-Safe** - K-anonymity enforced  
✅ **Actionable Insights** - Shows where engagement is high/low  
✅ **Representative-Aligned** - Matches electoral boundaries  
✅ **Scalable** - Works at federal/state/local levels  

---

## To Test

```bash
# All districts
curl http://localhost:3000/api/v1/civics/heatmap

# California federal districts only
curl http://localhost:3000/api/v1/civics/heatmap?state=CA&level=federal

# Stricter privacy (min 10 users)
curl http://localhost:3000/api/v1/civics/heatmap?min_count=10
```

---

**This change makes the heatmap feature logically aligned with your civics platform's core mission!**

