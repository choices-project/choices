# Archived Scripts

**Date**: $(date)  
**Reason**: Scripts were outdated, temporary, or had placeholder implementations

## 🗑️ **Archived Scripts**

### **Temporary/Outdated Scripts**
- `fix-no-restricted-syntax.js` - Temporary linting fix script (replaced with proper fixes)
- `schema-extractor.js` - Duplicate of get-live-schema.js
- `test-admin.js` - Placeholder implementation with no real functionality
- `performance-monitor.js` - Basic implementation, needs enhancement
- `bundle-size-check.js` - Basic implementation, needs enhancement  
- `ensure-tooling.js` - Basic Node.js version check, needs enhancement

### **Archive Files**
- `webpack.config.optimized.js` - Archived webpack config
- `next.config.optimized.js` - Archived Next.js config

## 📋 **Package.json Changes**

Removed the following script references:
- `preinstall`: "node scripts/ensure-tooling.js"
- `test:admin`: "node scripts/test-admin.js"
- `test:admin:unit`: "node scripts/test-admin.js unit"
- `test:admin:e2e`: "node scripts/test-admin.js e2e"  
- `test:admin:security`: "node scripts/test-admin.js security"
- `bundle:size`: "npm run build && node scripts/bundle-size-check.js"
- `performance:monitor`: "node scripts/performance-monitor.js"

## 🔄 **Recreation Notes**

If any of these scripts are needed in the future:

1. **fix-no-restricted-syntax.js** - Should be replaced with proper ESLint fixes using withOptional()
2. **test-admin.js** - Should implement proper admin testing functionality
3. **performance-monitor.js** - Should implement comprehensive performance monitoring
4. **bundle-size-check.js** - Should implement proper bundle analysis
5. **ensure-tooling.js** - Should implement comprehensive environment validation

## ✅ **Safe to Delete**

These scripts were safely archived because:
- No critical functionality depends on them
- They were either duplicates, placeholders, or temporary fixes
- They can be recreated if needed with proper implementation
- All package.json references were removed

---

**Status**: ✅ Safely Archived  
**Next Action**: Continue with linting fixes or other priorities
