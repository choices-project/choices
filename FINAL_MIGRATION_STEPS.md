# Final Migration Steps - District-Based Heatmap

## ⚠️ Important: Function Signature Changed

The `get_heatmap()` function was updated to use **districts** instead of **geohashes**.

---

## Step 1: Update the Function (Required)

Go to Supabase SQL Editor and run:

**File:** `REAPPLY_HEATMAP.sql`

This will:
1. Drop the old geohash-based function
2. Create new district-based function
3. Update permissions

---

## Step 2: Regenerate Types

```bash
cd web
npm run types:generate
```

This will update the TypeScript types to match the new function signature.

---

## Step 3: Verify

After regenerating types, the API should work:

```bash
# Test the endpoint
curl "http://localhost:3000/api/v1/civics/heatmap?state=CA&level=federal"
```

Expected response:
```json
{
  "ok": true,
  "heatmap": [
    {
      "district_id": "CA-12",
      "district_name": "District 12",
      "state": "CA",
      "level": "federal",
      "engagement_count": 47,
      "representative_count": 1
    }
  ],
  "k_anonymity": 5
}
```

---

## Why District-Based?

**Geohash Approach:**
- ❌ Geographic grid cells
- ❌ Not aligned with civic boundaries
- ❌ Less meaningful for voters

**District Approach:**
- ✅ Congressional districts (federal)
- ✅ State legislative districts
- ✅ Matches how representatives are elected
- ✅ Actionable civic insights
- ✅ Aligns with platform mission

---

## Quick Apply

```sql
-- Copy this entire block to Supabase SQL Editor:

DROP FUNCTION IF EXISTS get_heatmap(TEXT[], INTEGER);

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
) AS $$ ... (see REAPPLY_HEATMAP.sql for full function) $$ ...
```

Then regenerate types:
```bash
cd web && npm run types:generate
```

**Done!** 🎉

