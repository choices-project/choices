# Type Regeneration Status

**Updated:** January 30, 2025  
**Status:** ✅ **TYPES VERIFIED & UP TO DATE**

---

## Current Status

### **Supabase CLI**
- ❌ Not linked to project (`supabase gen types typescript --linked` fails)
- ✅ Manual types maintained in `web/types/candidate.ts`
- ✅ Types are complete and match database schema

---

## Database Schema vs TypeScript Types

### **Base Table: `candidate_platforms`**
✅ All fields from initial migration (`20250130_create_candidate_platforms.sql`) are in types:
- `id`, `user_id`, `office`, `level`, `state`, `district`, `jurisdiction`
- `candidate_name`, `party`, `photo_url`
- `platform_positions`, `experience`, `endorsements`, `campaign_funding`
- `campaign_website`, `campaign_email`, `campaign_phone`
- `visibility`, `status`, `verified`
- `created_at`, `updated_at`, `last_active_at`

### **Official Filing Fields** ✅ ADDED
All fields from migration (`20250130_add_official_filing_fields.sql`) are in types:
- ✅ `official_filing_id` - TEXT → `string | null`
- ✅ `official_filing_date` - DATE → `string | null` (ISO string from DB)
- ✅ `filing_jurisdiction` - TEXT → `string | null`
- ✅ `filing_document_url` - TEXT → `string | null`
- ✅ `filing_status` - TEXT with CHECK constraint → `FilingStatus` type
  - Values: `'not_filed' | 'filed' | 'pending_verification' | 'verified' | 'rejected'`
  - Default: `'not_filed'`
- ✅ `filing_deadline` - DATE → `string | null` (ISO string from DB)
- ✅ `election_date` - DATE → `string | null` (ISO string from DB)
- ✅ `ballot_access_confirmed` - BOOLEAN → `boolean` (default: `false`)
- ✅ `verification_method` - TEXT with CHECK → `VerificationMethod | null`
  - Values: `'gov_email' | 'filing_document' | 'manual_review' | 'api_verification'`
- ✅ `verified_at` - TIMESTAMPTZ → `string | null` (ISO string from DB)
- ✅ `verified_by` - UUID → `string | null` (UUID string from DB)

---

## Type Definitions

### **Location**
- `web/types/candidate.ts` - Manual types (source of truth)
- Exported from `web/types/index.ts`

### **Type Exports**
- ✅ `CandidatePlatformRow` - Database row type
- ✅ `CandidatePlatformInsert` - Insert type (all fields optional except required)
- ✅ `CandidatePlatformUpdate` - Update type (all fields optional)
- ✅ `PlatformPosition` - Platform position structure
- ✅ `CampaignFunding` - Funding information structure
- ✅ `FilingStatus` - Filing status enum
- ✅ `VerificationMethod` - Verification method enum
- ✅ Supporting types: `CandidatePlatformStatus`, `CandidatePlatformVisibility`, `OfficeLevel`

---

## Type Safety Verification

### **Database Types**
- ✅ All database columns have corresponding TypeScript properties
- ✅ Type constraints match CHECK constraints in database
- ✅ Nullable fields properly typed as `| null`
- ✅ Default values documented in types

### **Date Handling**
- ✅ DATE fields → `string | null` (PostgreSQL DATE returned as ISO string)
- ✅ TIMESTAMPTZ fields → `string | null` (PostgreSQL TIMESTAMPTZ returned as ISO string)
- ✅ UUID fields → `string | null` (PostgreSQL UUID returned as string)

---

## When to Regenerate

### **Automatic Regeneration** (When Supabase is linked)
```bash
cd web
supabase gen types typescript --linked > utils/supabase/database.types.ts
```

### **Manual Update** (Current approach)
When database schema changes:
1. Update `web/types/candidate.ts` to match new schema
2. Update this document
3. Verify types compile: `npm run type-check`

---

## Integration Status

### **Files Using Types** ✅
- ✅ `web/app/actions/declare-candidacy.ts` - Uses `CandidatePlatformInsert`
- ✅ `web/app/api/candidate/platform/route.ts` - Uses `CandidatePlatformRow`
- ✅ `web/app/api/civics/representative/[id]/alternatives/route.ts` - Uses `CandidatePlatformRow`
- ✅ `web/app/(app)/candidate/dashboard/page.tsx` - Uses `CandidatePlatformRow`

### **Type Consistency** ✅
- All implementations use imported types from `@/types/candidate`
- No inline type definitions in implementation files
- TypeScript compilation passes (except unrelated tool file warnings)

---

## Next Steps

1. **Link Supabase project** (when possible):
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

2. **Auto-generate types** (after linking):
   ```bash
   supabase gen types typescript --linked > utils/supabase/database.types.ts
   ```

3. **Verify alignment**:
   - Compare auto-generated types with manual types
   - Update manual types if needed
   - Ensure backward compatibility

4. **Update documentation**:
   - Note any differences between auto-generated and manual types
   - Document any manual overrides needed

---

## Notes

- Manual types are currently the source of truth
- Types are complete and match database schema exactly
- All new official filing fields are included and properly typed
- No type mismatches or missing fields detected

---

**Last Verified:** January 30, 2025

