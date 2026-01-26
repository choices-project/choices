# Database Update Strategy

## Overview

This document outlines how the system handles updates to existing database entries when:
- New elections occur
- OpenStates people repository is updated
- Representative data changes (office, district, contact info, etc.)

## Update Mechanisms

### 1. OpenStates Updates

**Process:**
1. **Stage** (`stage-openstates.ts`) - Loads YAML data into staging tables
2. **Merge** (`run-openstates-merge.ts`) - Executes SQL merge function
3. **Deactivate** - Marks non-current representatives as inactive

**SQL Function: `sync_representatives_from_openstates()`**

**Update Logic:**
- **Matches on:** `openstates_id` (unique identifier from OpenStates)
- **Updates existing rows:**
  ```sql
  UPDATE representatives_core SET
    name = s.name,
    office = s.office,
    level = s.level,
    state = s.state,
    district = s.district,
    party = s.party,
    primary_email = s.primary_email,
    primary_phone = s.primary_phone,
    primary_website = s.primary_website,
    primary_photo_url = s.primary_photo_url,
    term_start_date = s.term_start_date,
    term_end_date = s.term_end_date,
    is_active = s.is_active,
    status = 'active',  -- Sets status for current reps
    updated_at = now()
  WHERE openstates_id = s.openstates_id
  ```
- **Inserts new rows:** For representatives not yet in database
- **Status handling:** Sets `status = 'active'` for current representatives

**Deactivation: `deactivate_non_current_openstates_reps()`**
- Finds representatives whose `openstates_id` is no longer in current roles
- Sets `status = 'inactive'` with reason `'no_longer_current_in_openstates'`
- Updates `status_changed_at` timestamp

**Related Data Updates:**
- **Contacts:** Deletes old OpenStates contacts, inserts fresh ones
- **Social Media:** Updates social media handles
- **Photos:** Updates photo URLs
- **Committees:** Refreshes committee assignments
- **Divisions:** Refreshes division IDs via `refresh_divisions_from_openstates()`

### 2. Federal (Congress.gov) Updates

**Script:** `federal/enrich-congress-ids.ts`

**Update Logic:**
- **Matches on:** `bioguide_id` or `congress_gov_id`
- **Updates existing representatives:**
  ```typescript
  .update({
    bioguide_id: member.bioguideId,
    congress_gov_id: member.memberId,
    updated_at: now()
  })
  .eq('id', row.id)
  ```
- **Profile updates:** Updates `primary_phone`, `primary_website`, `primary_photo_url` from Congress.gov detail API
- **Inserts new:** Adds new federal representatives not in database
- **Deactivates:** Uses `update_representative_status()` RPC to deactivate members no longer in Congress

**Deactivation Logic:**
- Compares current Congress members with database
- Deactivates representatives not found in current Congress
- Uses name/state/district matching as fallback
- Handles duplicates (keeps one active, deactivates others)

### 3. FEC Finance Updates

**Script:** `federal/enrich-fec-finance.ts`

**Update Logic:**
- **Matches on:** `representative_id` (one-to-one relationship)
- **Uses upsert:**
  ```typescript
  .upsert(rows, { onConflict: 'representative_id' })
  ```
- **Updates:** Finance data for current cycle
- **Stale data handling:** Can filter by `staleDays` to refresh old data

### 4. Data Quality Updates

**Function:** `upsertFinanceDataQuality()`

**Update Logic:**
- **Matches on:** `representative_id`
- **Uses upsert:**
  ```typescript
  .upsert({
    representative_id,
    data_completeness: Math.max(existing, new),
    overall_confidence: Math.max(existing, new),
    ...
  }, { onConflict: 'representative_id' })
  ```
- **Strategy:** Takes maximum of existing and new scores (never decreases quality)

## Field Update Strategy

### Always Updated Fields
- `name` - May change (e.g., name corrections)
- `office` - May change (e.g., promotion to leadership)
- `district` - May change (redistricting)
- `party` - May change (party switches)
- `primary_email`, `primary_phone`, `primary_website` - Contact info changes
- `primary_photo_url` - Photo URLs may change
- `term_start_date`, `term_end_date` - Term dates from roles
- `updated_at` - Always updated on change

### Conditionally Updated Fields
- `status` - Only updated when representative becomes active/inactive
- `status_reason` - Set when status changes
- `status_changed_at` - Set when status changes
- `verification_status` - May be updated by verification processes

### Preserved Fields
- `id` - Never changes
- `created_at` - Preserved for historical tracking
- `canonical_id` - Stable identifier
- `data_quality_score` - Only increases (never decreases)

## Status Management

### Status Values
- `'active'` - Currently serving
- `'inactive'` - No longer serving
- `'historical'` - Historical record (preserved)

### Status Transitions
1. **New Election:**
   - New representatives: `status = 'active'`
   - Incumbents: Remain `'active'` (updated with new term dates)
   - Defeated incumbents: `status = 'inactive'` (via deactivation functions)

2. **OpenStates Update:**
   - Current roles: `status = 'active'`
   - No current roles: `status = 'inactive'` (via `deactivate_non_current_openstates_reps()`)

3. **Congress Update:**
   - In current Congress: `status = 'active'`
   - Not in current Congress: `status = 'inactive'` (via `deactivateFederalRepsNotInCongress()`)

## Update Workflows

### OpenStates Repository Update

```bash
# 1. Pull latest OpenStates data
npm run openstates:sync-people

# 2. Stage YAML data
npm run openstates:stage

# 3. Merge into representatives_core
npm run openstates:merge
# This automatically:
#   - Updates existing representatives
#   - Inserts new representatives
#   - Deactivates non-current representatives
#   - Updates contacts, social, photos, committees
```

### New Election Cycle

```bash
# 1. Update OpenStates (includes new election results)
npm run openstates:ingest

# 2. Update federal representatives
npm run federal:enrich:congress
# This:
#   - Updates existing members with new Congress data
#   - Adds newly elected members
#   - Deactivates members who left

# 3. Update finance data
npm run federal:enrich:finance
# This:
#   - Updates finance data for current cycle
#   - Can use --cycle flag for specific election cycle
```

### Incremental Updates

```bash
# Update only stale finance data (older than 30 days)
npm run federal:enrich:finance -- --stale-days 30

# Update specific states
npm run openstates:stage -- --states CA,TX
npm run openstates:merge

# Update specific representatives
npm run federal:enrich:congress -- --states CA
```

## Conflict Resolution

### Duplicate Representatives
- **OpenStates:** Uses `openstates_id` as unique key (no duplicates)
- **Federal:** Uses `bioguide_id` as primary identifier
- **Resolution:** When duplicates found, keeps one active, deactivates others

### Data Source Conflicts
- **Priority:** OpenStates > Congress.gov > FEC
- **Strategy:** Latest update wins for most fields
- **Exceptions:** Data quality scores only increase

### Identifier Conflicts
- **Crosswalk table:** Maps multiple identifiers to canonical_id
- **Strategy:** Multiple identifiers allowed per representative
- **Updates:** New identifiers added, existing preserved

## Verification

### Post-Update Checks

```sql
-- Check for representatives that should be active but aren't
SELECT COUNT(*) FROM representatives_core
WHERE status != 'active'
  AND openstates_id IN (
    SELECT openstates_id FROM openstates_people_current_roles_v WHERE is_current
  );

-- Check for representatives that should be inactive but aren't
SELECT COUNT(*) FROM representatives_core
WHERE status = 'active'
  AND openstates_id NOT IN (
    SELECT openstates_id FROM openstates_people_current_roles_v WHERE is_current
  );

-- Check update timestamps
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '7 days') as updated_recently
FROM representatives_core;
```

## Best Practices

1. **Always run deactivation functions after sync:**
   - `deactivate_non_current_openstates_reps()` after OpenStates merge
   - `deactivateFederalRepsNotInCongress()` after Congress enrichment

2. **Use dry-run for testing:**
   ```bash
   npm run federal:enrich:congress -- --dry-run
   ```

3. **Monitor update counts:**
   - Check logs for "Updated X representatives"
   - Verify deactivation counts match expectations

4. **Preserve historical data:**
   - Don't delete inactive representatives
   - Use `status = 'historical'` for preserved records
   - Keep `created_at` timestamps

5. **Update related tables:**
   - Contacts, photos, social media updated automatically
   - Committees refreshed from roles
   - Divisions refreshed from OpenStates

## Troubleshooting

### Representatives Not Updating
- Check if `openstates_id` or `bioguide_id` matches
- Verify staging tables have data
- Check for constraint violations

### Status Not Changing
- Verify deactivation functions are running
- Check `status_reason` for clues
- Review `status_changed_at` timestamps

### Duplicate Representatives
- Check for multiple rows with same identifier
- Use `update_representative_status()` to deactivate duplicates
- Verify crosswalk table mappings
