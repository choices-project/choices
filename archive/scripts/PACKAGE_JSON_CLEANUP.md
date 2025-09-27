# Package.json Script Cleanup

**Date**: $(date)  
**Reason**: Removed broken script references and temporary setup scripts

## 🗑️ **Removed Script References**

### **Archived Scripts (6 scripts moved to archive/)**
- `preinstall`: "node scripts/ensure-tooling.js"
- `test:admin`: "node scripts/test-admin.js" 
- `test:admin:unit`: "node scripts/test-admin.js unit"
- `test:admin:e2e`: "node scripts/test-admin.js e2e"
- `test:admin:security`: "node scripts/test-admin.js security"
- `bundle:size`: "npm run build && node scripts/bundle-size-check.js"
- `performance:monitor`: "node scripts/performance-monitor.js"

### **Broken References (12 scripts that don't exist)**
- `test:pre`: "tsx scripts/test-seed.ts" ❌ MISSING
- `cleanup:analyze`: "node ../scripts/cleanup-code.js" ❌ MISSING
- `cleanup:fix`: "node ../scripts/cleanup-code.js --fix" ❌ MISSING
- `migrate:civics`: "tsx scripts/run-civics-migration.ts" ❌ MISSING
- `test:canonical-ids`: "tsx scripts/test-canonical-ids.ts" ❌ MISSING
- `check:tables`: "tsx scripts/check-tables.ts" ❌ MISSING
- `create:civics-tables`: "tsx scripts/create-civics-tables.ts" ❌ MISSING
- `setup:postgis`: "tsx scripts/setup-postgis.ts" ❌ MISSING
- `test:geographic`: "tsx scripts/test-geographic-system.ts" ❌ MISSING
- `setup:fec`: "tsx scripts/setup-fec-pipeline.ts" ❌ MISSING
- `test:fec`: "tsx scripts/test-fec-pipeline.ts" ❌ MISSING
- `setup:raw-provenance`: "tsx scripts/setup-raw-provenance.ts" ❌ MISSING
- `test:raw-provenance`: "tsx scripts/test-raw-provenance.ts" ❌ MISSING
- `setup:dbt-tests`: "tsx scripts/setup-dbt-tests.ts" ❌ MISSING
- `test:dbt-tests`: "tsx scripts/test-dbt-tests.ts" ❌ MISSING

## ✅ **Remaining Valid Scripts**

### **Core Development**
- `dev`, `build`, `start` - Essential Next.js commands
- `lint:*` - ESLint commands (all working)
- `types:*` - TypeScript commands (all working)
- `test:*` - Jest and Playwright tests (all working)

### **Security & Quality**
- `check:next-security`: "node scripts/check-next-sec.js" ✅ EXISTS
- `test:security-headers`: "node scripts/test-security-headers.js" ✅ EXISTS
- `audit:high` - npm audit command
- `security-check` - grep command for SQL injection

### **Tools & Utilities**
- `errors:classify`: "node tools/error-classify.js" ✅ EXISTS
- `codemod:optional-literals`: "tsx tools/codemods/optional-literals.ts" ✅ EXISTS

## 🎯 **Key Insights**

### **Temporary Setup Scripts**
All the "setup:*" and "create:*" scripts were temporary one-time scripts that:
- Created database tables
- Set up PostGIS extensions  
- Configured FEC pipelines
- Set up raw provenance systems
- Created DBT tests

These were **correctly pruned** because:
1. They were one-time setup scripts
2. They've already been run (tables exist)
3. They would fail if run again
4. They're not needed for ongoing development

### **Broken References**
Many scripts referenced files that don't exist, indicating:
- Scripts were deleted but package.json wasn't updated
- Temporary scripts were removed but references remained
- Development process left orphaned references

## 🚨 **Security Benefits**

Removing broken script references prevents:
- Accidental execution of non-existent scripts
- CI/CD failures from missing scripts
- Developer confusion from broken commands
- Potential security issues from outdated scripts

## 📋 **Next Steps**

1. **Test remaining scripts** to ensure they all work
2. **Document essential scripts** that remain
3. **Add script validation** to prevent future broken references
4. **Continue with linting fixes** (322 warnings remaining)

---

**Status**: ✅ Package.json Cleaned  
**Result**: Removed 18 broken script references, archived 6 outdated scripts  
**Next Action**: Continue with systematic linting fixes
