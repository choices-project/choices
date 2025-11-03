# Scripts Inventory

**Last Updated**: November 4, 2025  
**Location**: `/web/scripts`

---

## Current Scripts (After Audit)

### Database Verification
- **`verify-database-tables.js`** (13KB) - Verify all tables exist
  - Status: ✅ Current (uses SUPABASE_SERVICE_ROLE_KEY)
  - Keep: Yes

- **`audit-database-schema.ts`** - TypeScript schema audit
  - Status: ✅ Current (uses SUPABASE_SERVICE_ROLE_KEY)
  - Keep: Yes

### Schema Introspection
- **`get-live-schema.js`** - Get live schema from Supabase
  - Status: ✅ Current (uses SUPABASE_SERVICE_ROLE_KEY)
  - Keep: Yes
  
- **`simple-schema-check.js`** - Simple schema validation
  - Status: ✅ Current (uses SUPABASE_SERVICE_ROLE_KEY)
  - Keep: Yes
  
- **`direct-table-check.js`** - Direct table checks
  - Status: ✅ Current (uses SUPABASE_SERVICE_ROLE_KEY)
  - Keep: Yes
  - Note: Redundant with verify-database-tables.js?

### Security & Testing
- **`check-next-sec.js`** - Check Next.js security config
  - Status: ✅ Current (checks SUPABASE_SERVICE_ROLE_KEY)
  - Keep: Yes

- **`test-security-headers.js`** - Test security headers
  - Status: ✅ Current
  - Keep: Yes

- **`test-email-system.js`** - Test email/filing system
  - Status: ✅ Current
  - Keep: Yes

### Archived/Deprecated
- **`comprehensive-fix.js`** - Old comprehensive fix script
  - Status: ❌ Likely outdated
  - Action: Audit and archive if not current

---

## Consolidation Recommendations

### Merge Candidates
1. **Database Table Verification** (3 scripts doing similar work):
   - `verify-database-tables.js` (13KB, most comprehensive)
   - `direct-table-check.js` (similar functionality)
   - `simple-schema-check.js` (simpler version)
   
   **Recommendation**: Keep `verify-database-tables.js`, archive others if redundant

### Keep As-Is
- `audit-database-schema.ts` - TypeScript version, different use case
- `get-live-schema.js` - Schema introspection tool
- `check-next-sec.js` - Security config checker
- `test-security-headers.js` - Security testing
- `test-email-system.js` - Email/filing testing

---

## Next Steps
1. Audit `comprehensive-fix.js` for current relevance
2. Compare the 3 table verification scripts
3. Archive redundant scripts to `/scratch/archived-scripts/`
4. Update this inventory

---

_Keep only current and relevant scripts_

