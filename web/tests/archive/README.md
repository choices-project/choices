# Test Archive

**Archived**: November 6, 2025

## Contents

### `/infrastructure-tests/`
Tests that test the testing infrastructure itself (not app features):
- `simple-login-test.spec.ts` - Basic login smoke test
- `rate-limit-bypass.spec.ts` - E2E bypass mechanism test
- `rate-limit-robust.spec.ts` - Rate limit bypass test

### `/old-docs/`
Historical documentation (15 files) - superseded by current docs.

### `/old-reports/`
Previous audit reports (5 files) - superseded by current status.

### `/extra-docs/`
Detailed documentation moved to archive for simplicity:
- Complete authentication guides
- Detailed setup instructions
- Implementation summaries
- Security audits
- Test ID references
- Alignment verification docs

### `/unused-helpers/`
Helper files not currently used by any tests:
- Mock Supabase helpers
- Test utilities
- Fixtures

---

## Why Archived

Current testing approach uses:
- **Real authentication** (no mocks needed)
- **Real database** (configured test users)
- **Simplified documentation** (3 core .md files)

These archived files contain valuable context but aren't needed for day-to-day testing.

---

## Restoring Files

If needed, files can be moved back from archive. They're not deleted, just organized.

---

**Current Docs**: Only 3 .md files in active `tests/` directory  
**Archived**: 40+ files safely preserved here

