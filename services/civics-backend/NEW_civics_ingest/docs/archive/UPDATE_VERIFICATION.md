# Update Verification Checklist

Use this checklist to verify that database updates are working correctly after running ingestion/enrichment scripts.

## Post-Update Verification

### 1. OpenStates Update Verification

After running `npm run openstates:ingest`:

```sql
-- Check that current OpenStates reps are active
SELECT 
  COUNT(*) as total_current,
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE status != 'active') as inactive_count
FROM representatives_core
WHERE openstates_id IN (
  SELECT openstates_id FROM openstates_people_current_roles_v WHERE is_current
);

-- Expected: active_count should equal total_current (or very close)
```

```sql
-- Check for stale data (reps that should be inactive)
SELECT COUNT(*) as should_be_inactive
FROM representatives_core
WHERE status = 'active'
  AND openstates_id IS NOT NULL
  AND openstates_id NOT IN (
    SELECT openstates_id FROM openstates_people_current_roles_v WHERE is_current
  );

-- Expected: 0 (or very small number if deactivation just ran)
```

```sql
-- Check update timestamps
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '1 hour') as updated_recently
FROM representatives_core
WHERE openstates_id IS NOT NULL;

-- Should show recent updates after running merge
```

### 2. Federal (Congress.gov) Update Verification

After running `npm run federal:enrich:congress`:

```sql
-- Check that current Congress members are active
SELECT 
  COUNT(*) as total_federal,
  COUNT(*) FILTER (WHERE status = 'active') as active_federal,
  COUNT(*) FILTER (WHERE bioguide_id IS NOT NULL) as with_bioguide
FROM representatives_core
WHERE level = 'federal';

-- Expected: active_federal should be ~535 (435 House + 100 Senate)
```

```sql
-- Check for federal reps that should be inactive
SELECT COUNT(*) as inactive_federal
FROM representatives_core
WHERE level = 'federal'
  AND status = 'active'
  AND bioguide_id IS NOT NULL
  AND bioguide_id NOT IN (
    -- This would need to be compared against current Congress API data
    -- For now, just check if there are any obvious issues
    SELECT bioguide_id FROM representatives_core WHERE level = 'federal' AND status = 'active'
  );

-- Manual verification: Compare against Congress.gov API
```

```sql
-- Check for missing identifiers
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE bioguide_id IS NOT NULL) as with_bioguide,
  COUNT(*) FILTER (WHERE congress_gov_id IS NOT NULL) as with_congress_gov
FROM representatives_core
WHERE level = 'federal' AND status = 'active';

-- Expected: Both counts should be close to total (high coverage)
```

### 3. FEC Finance Update Verification

After running `npm run federal:enrich:finance`:

```sql
-- Check finance data coverage
SELECT 
  COUNT(*) as total_federal,
  COUNT(DISTINCT rcf.representative_id) as with_finance_data,
  COUNT(DISTINCT rcf.representative_id) FILTER (WHERE rcf.total_raised IS NOT NULL) as with_totals
FROM representatives_core rc
LEFT JOIN representative_campaign_finance rcf ON rcf.representative_id = rc.id
WHERE rc.level = 'federal' AND rc.status = 'active';

-- Expected: with_finance_data should be > 0, with_totals depends on cycle data availability
```

```sql
-- Check for stale finance data
SELECT 
  COUNT(*) as stale_finance
FROM representative_campaign_finance
WHERE updated_at < NOW() - INTERVAL '90 days'
  AND cycle < EXTRACT(YEAR FROM NOW())::integer - 1;

-- Expected: Some stale data is normal for old cycles
```

### 4. Data Quality Verification

```sql
-- Check data quality scores
SELECT 
  AVG(data_quality_score) as avg_quality,
  COUNT(*) FILTER (WHERE data_quality_score >= 80) as high_quality,
  COUNT(*) FILTER (WHERE data_quality_score < 50) as low_quality
FROM representatives_core
WHERE status = 'active';

-- Expected: avg_quality should be reasonable, low_quality should be small
```

```sql
-- Check for representatives with missing critical fields
SELECT 
  COUNT(*) as missing_email,
  COUNT(*) FILTER (WHERE primary_phone IS NULL) as missing_phone,
  COUNT(*) FILTER (WHERE primary_website IS NULL) as missing_website
FROM representatives_core
WHERE status = 'active';

-- Expected: Some missing data is normal, but should be reasonable
```

### 5. Status Consistency Verification

```sql
-- Check for status inconsistencies
SELECT 
  COUNT(*) as status_mismatch
FROM representatives_core
WHERE (status = 'active' AND is_active = false)
   OR (status != 'active' AND is_active = true);

-- Expected: 0 (status and is_active should be consistent)
```

```sql
-- Check status tracking
SELECT 
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE status_reason IS NOT NULL) as with_reason,
  COUNT(*) FILTER (WHERE status_changed_at IS NOT NULL) as with_timestamp
FROM representatives_core
GROUP BY status;

-- Expected: Most active reps may not have status_reason (initial state)
-- Inactive reps should have status_reason and status_changed_at
```

### 6. Related Data Verification

```sql
-- Check contacts are updated
SELECT 
  COUNT(DISTINCT rc.id) as reps_with_contacts,
  COUNT(*) as total_contacts
FROM representatives_core rc
JOIN representative_contacts rct ON rct.representative_id = rc.id
WHERE rc.status = 'active'
  AND rct.source = 'openstates_yaml';

-- Expected: Should match number of active OpenStates reps
```

```sql
-- Check divisions are refreshed
SELECT 
  COUNT(DISTINCT rd.representative_id) as reps_with_divisions,
  COUNT(*) as total_divisions
FROM representatives_core rc
JOIN representative_divisions rd ON rd.representative_id = rc.id
WHERE rc.status = 'active';

-- Expected: Most active reps should have divisions
```

## Automated Verification Script

Create a script to run these checks:

```bash
# Run after updates
npm run verify:updates
```

## Common Issues

### Issue: Representatives not updating
**Check:**
- Verify staging tables have data: `SELECT COUNT(*) FROM openstates_people_data;`
- Check for constraint violations in logs
- Verify `openstates_id` matches between staging and core tables

### Issue: Status not changing
**Check:**
- Verify deactivation functions ran: Check logs for deactivation counts
- Check `status_reason` for clues: `SELECT status_reason, COUNT(*) FROM representatives_core GROUP BY status_reason;`
- Verify `status_changed_at` timestamps

### Issue: Duplicate representatives
**Check:**
- Find duplicates: `SELECT openstates_id, COUNT(*) FROM representatives_core WHERE openstates_id IS NOT NULL GROUP BY openstates_id HAVING COUNT(*) > 1;`
- Use `update_representative_status()` to deactivate duplicates
- Check crosswalk table for identifier conflicts

### Issue: Missing related data
**Check:**
- Verify sync scripts ran after merge
- Check for foreign key constraint violations
- Verify source fields are set correctly
