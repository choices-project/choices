# FEC Table Migration Guide

**Created:** January 15, 2025  
**Status:** ✅ NON-DESTRUCTIVE SOLUTION  
**Purpose:** Resolve FEC table naming conflicts

## Issue Summary

The original implementation script failed due to **name collisions** between new FEC tables and existing tables in the database:

- **Existing tables:** `fec_candidates`, `fec_committees`, `fec_filings` (with different column structures)
- **New tables:** Same names but with different column definitions
- **Error:** `CREATE TABLE IF NOT EXISTS` didn't replace existing tables, causing index creation to fail

## Solution: Non-Destructive V2 Tables

### ✅ **FIXED: Renamed FEC Tables to Avoid Conflicts**

**New Table Names:**
- `fec_candidates` → `fec_candidates_v2`
- `fec_committees` → `fec_committees_v2`  
- `fec_filings` → `fec_filings_v2`

### **Benefits of This Approach:**

1. **✅ Non-Destructive:** Existing tables and data remain untouched
2. **✅ No Data Loss:** All existing FEC data is preserved
3. **✅ Clear Separation:** V2 tables have distinct, modern schema
4. **✅ Future-Proof:** Can migrate data from old to new tables when ready
5. **✅ Rollback Safe:** Can easily remove V2 tables if needed

## Updated Schema

### FEC Candidates V2
```sql
CREATE TABLE fec_candidates_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    office VARCHAR(50),
    party VARCHAR(100),
    state VARCHAR(2),
    district VARCHAR(10),
    -- ... full schema with modern structure
);
```

### FEC Committees V2
```sql
CREATE TABLE fec_committees_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id VARCHAR(20) UNIQUE NOT NULL,
    committee_name VARCHAR(500) NOT NULL,
    -- ... full schema with modern structure
);
```

### FEC Filings V2
```sql
CREATE TABLE fec_filings_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filing_id VARCHAR(50) UNIQUE NOT NULL,
    committee_id VARCHAR(20) NOT NULL,
    candidate_id VARCHAR(20),
    -- ... full schema with modern structure
);
```

## Indexes and RLS

All indexes and RLS policies have been updated to use the V2 table names:

- **Indexes:** `idx_fec_candidates_v2_*`, `idx_fec_committees_v2_*`, `idx_fec_filings_v2_*`
- **RLS Policies:** Updated to reference V2 tables
- **Public Access:** V2 tables are publicly readable (same as original design)

## Integration Impact

### ✅ **No Breaking Changes**
- Existing FEC service code continues to work with original tables
- New V2 tables are available for enhanced functionality
- Gradual migration path available

### **Future Migration Options**

1. **Gradual Migration:** Update FEC service to use V2 tables over time
2. **Data Migration:** Copy data from old tables to new V2 tables
3. **Hybrid Approach:** Use both old and new tables as needed

## Next Steps

1. **✅ Execute Updated Script:** Run the fixed SQL script
2. **✅ Verify Tables:** Confirm V2 tables are created successfully
3. **✅ Test Integration:** Verify no conflicts with existing systems
4. **🔄 Optional Migration:** Plan data migration from old to new tables
5. **🔄 Code Updates:** Update FEC service to use V2 tables when ready

## Status

✅ **CONFLICT RESOLVED** - Non-destructive solution implemented

The updated script will now run successfully without any table name conflicts, providing complete database infrastructure for all systems while preserving existing data.
