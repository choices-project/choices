# Status Field Migration Guide

**Date:** 2026-01-27  
**Purpose:** Guide for updating code to use `status` field instead of `is_active` boolean

---

## Overview

The database schema now includes a `status` enum field (`active`, `inactive`, `historical`) that replaces the `is_active` boolean. The `is_active` field is kept for backward compatibility during migration but should be replaced with `status` queries.

---

## Database Changes

### New Fields
- `status` - ENUM: `'active' | 'inactive' | 'historical'`
- `replaced_by_id` - INTEGER (FK to representatives_core.id)
- `status_reason` - TEXT (reason for status change)
- `status_changed_at` - TIMESTAMPTZ (when status changed)

### Migration Status
- ✅ Schema migration created (`20260127130600_add_status_tracking.sql`)
- ✅ `is_active` values migrated to `status`
- ⚠️ Code still uses `is_active` (needs update)

---

## Code Updates Required

### 1. SQL Functions

#### ✅ Updated
- `deactivate_non_current_openstates_reps()` - Now uses `status` with tracking

#### ⚠️ Needs Update
- `sync_representatives_from_openstates()` - Large function, needs status updates:
  - Line 123: Add `status` calculation alongside `is_active`
  - Line 184: Update `status` when updating existing rows (preserve historical)
  - Line 210: Add `status` to INSERT column list
  - Line 239: Set `status = 'active'` for new rows

### 2. TypeScript Code

#### Files to Update

**`src/scripts/federal/enrich-congress-ids.ts`**
- Line 34: Add `status` to `RepresentativeRow` interface
- Line 99: Add `status` to SELECT query
- Line 107: Change `.or('is_active.eq.true,is_active.is.null')` to `.eq('status', 'active')`
- Line 553: Change `is_active: true` to `status: 'active'`
- Line 677: Change `is_active: false` to use `update_representative_status()` function

**`src/scripts/openstates/run-openstates-merge.ts`**
- Update to use `status` field in queries
- Use `update_representative_status()` RPC for status changes

**Frontend: `web/lib/services/civics-integration.ts`**
- Line 56: Change `.eq('is_active', true)` to `.eq('status', 'active')`

**Frontend: `web/lib/utils/civics-cache.ts`**
- Update `getRepresentativeQuery()` and `getStateQuery()` to use `status`

**Frontend: `web/app/api/v1/civics/by-state/route.ts`**
- Line 72: Change `.eq('is_active', true)` to `.eq('status', 'active')`

### 3. Type Definitions

**`web/types/representative.ts`**
- Add `status: 'active' | 'inactive' | 'historical'`
- Add `replaced_by_id?: number`
- Add `status_reason?: string`
- Add `status_changed_at?: string`
- Keep `is_active` for backward compatibility (deprecated)

---

## Migration Pattern

### Query Pattern (Before → After)

```typescript
// Before
.eq('is_active', true)

// After
.eq('status', 'active')
```

### Update Pattern (Before → After)

```typescript
// Before
.update({ is_active: false })

// After - Use helper function
await client.rpc('update_representative_status', {
  p_representative_id: id,
  p_new_status: 'inactive',
  p_status_reason: 'no_longer_in_congress',
  p_replaced_by_id: null
})

// Or direct update (if not using helper)
.update({ 
  status: 'inactive',
  status_reason: 'no_longer_in_congress',
  status_changed_at: new Date().toISOString(),
  is_active: false  // Keep for backward compatibility
})
```

### Insert Pattern (Before → After)

```typescript
// Before
.insert({ 
  ...otherFields,
  is_active: true 
})

// After
.insert({ 
  ...otherFields,
  status: 'active',
  is_active: true  // Keep for backward compatibility
})
```

---

## Helper Function

Use the `update_representative_status()` RPC for status changes:

```typescript
await client.rpc('update_representative_status', {
  p_representative_id: representativeId,
  p_new_status: 'inactive' | 'active' | 'historical',
  p_status_reason: 'reason text',  // optional
  p_replaced_by_id: successorId    // optional
});
```

This function:
- Updates `status`
- Sets `status_reason` (if provided)
- Sets `replaced_by_id` (if provided)
- Automatically sets `status_changed_at = now()`
- Automatically sets `updated_at = now()`

---

## Backward Compatibility

During migration:
- ✅ `is_active` field is kept (for backward compatibility)
- ✅ `is_active` is automatically synced with `status` (via trigger or application logic)
- ⚠️ New code should use `status` field
- ⚠️ Old code using `is_active` will continue to work but should be updated

---

## Testing Checklist

After updating code:
- [ ] Verify queries return correct results with `status` field
- [ ] Verify status updates work correctly
- [ ] Verify replacement tracking works (`replaced_by_id`)
- [ ] Verify status reason is set correctly
- [ ] Verify `status_changed_at` is set automatically
- [ ] Test first-time vs enrichment runs
- [ ] Test frontend queries still work

---

## Migration Order

1. ✅ Apply database migrations (status tracking schema)
2. ⚠️ Update SQL functions (sync_representatives_from_openstates)
3. ⚠️ Update TypeScript ingest scripts
4. ⚠️ Update frontend queries
5. ⚠️ Update type definitions
6. ⚠️ Test all queries and updates
7. ⚠️ Remove `is_active` field (future migration, after all code updated)

---

## References

- Status Tracking Migration: `supabase/migrations/20260127130600_add_status_tracking.sql`
- Sync Function Update: `supabase/migrations/20260127130700_update_sync_functions_for_status.sql`
- Plan: `/Users/alaughingkitsune/.cursor/plans/representative_change_tracking_and_api_optimization_7757ce95.plan.md`

---

**Status: In Progress - Code updates needed**
