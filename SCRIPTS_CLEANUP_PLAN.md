# Scripts Cleanup Plan 🧹

**Date:** 2024-12-19  
**Status:** 🔄 **IN PROGRESS**  
**Goal:** Eliminate 80% of script cruft, keep only essential production scripts

## 📊 **Current State Analysis**

### ✅ **KEPT (Essential Production Scripts)**
```
scripts/
├── check-schema-status.js          # ✅ Database health monitoring
├── deploy-rls-security.sh          # ✅ Security deployment
├── precommit.sh                    # ✅ Git hooks (essential)
├── setup-supabase-env.js           # ✅ Environment setup
├── email-templates/                # ✅ Email templates (production)
│   ├── changeEmail.html
│   ├── confirmSignup.html
│   ├── inviteUser.html
│   ├── magicLink.html
│   ├── reauthentication.html
│   └── resetPassword.html
├── essential/                      # ✅ Core utilities
│   ├── assess-project-status.js
│   └── remind-documentation-update.js
├── performance/                    # ✅ Performance monitoring
│   ├── create-cache-table.sql
│   └── performance-test.js
├── quality/                        # ✅ Code quality
│   └── fix-eslint-warnings.js
└── security/                       # ✅ Security utilities
    ├── implement-rls-policies.sql
    ├── security-audit.js
    ├── test-rls-policies.js
    └── verify-privacy-system.js
```

### ❌ **DELETED (Historical Cruft)**
```
scripts/archive/                    # ❌ DELETED - All historical cruft
├── completed-work/                 # ❌ Done work, not needed
├── outdated-utilities/             # ❌ Outdated, not needed  
└── redundant-migrations/           # ❌ Redundant, not needed
```

### 🔄 **TO EVALUATE (One-time Fixes)**
```
scripts/
├── backup-before-cleanup.js        # 🤔 One-time cleanup script
├── cleanup-orphaned-auth-users.js  # 🤔 One-time cleanup
├── clear-supabase-database.js      # 🤔 One-time cleanup
├── disable-webauthn-features.js    # 🤔 Feature toggle
├── enable-webauthn-features.js     # 🤔 Feature toggle
├── execute-clean-migration.js      # 🤔 One-time migration
├── fix-all-imports.js              # 🤔 One-time fix
├── fix-remaining-imports.js        # 🤔 One-time fix
├── fix-unused-vars.js              # 🤔 One-time fix
├── img-to-Image.mjs                # 🤔 One-time fix
├── rename-jsx-ts-to-tsx.mjs        # 🤔 One-time fix
├── console-to-logger.mjs           # 🤔 One-time fix
├── stamp-docs.mjs                  # 🤔 One-time fix
├── stack-pr.sh                     # 🤔 Git utility
└── check-endpoints.mjs             # 🤔 API testing
```

### 🔧 **MOVED TO WEB (Next.js Specific)**
```
web/tools/                          # ✅ MOVED - Next.js specific
├── fix-async-cookies.mjs           # ✅ Next.js specific
├── scan-next-dynamic.mjs           # ✅ Next.js specific
└── scan-next14-ssr.mjs             # ✅ Next.js specific
```

## 🎯 **Cleanup Strategy**

### Phase 1: Delete One-time Fix Scripts ✅
These were used once and are no longer needed:
```bash
# One-time cleanup scripts
rm scripts/backup-before-cleanup.js
rm scripts/cleanup-orphaned-auth-users.js
rm scripts/clear-supabase-database.js
rm scripts/execute-clean-migration.js

# One-time import fixes
rm scripts/fix-all-imports.js
rm scripts/fix-remaining-imports.js
rm scripts/fix-unused-vars.js

# One-time code fixes
rm scripts/img-to-Image.mjs
rm scripts/rename-jsx-ts-to-tsx.mjs
rm scripts/console-to-logger.mjs
rm scripts/stamp-docs.mjs
```

### Phase 2: Evaluate Feature Toggle Scripts 🤔
These might be useful for feature management:
```bash
# Feature toggle scripts - KEEP for now
scripts/disable-webauthn-features.js
scripts/enable-webauthn-features.js
```

### Phase 3: Evaluate Utility Scripts 🤔
These might be useful for development:
```bash
# Development utilities - EVALUATE
scripts/check-endpoints.mjs          # API testing
scripts/stack-pr.sh                  # Git utility
```

## 📁 **Final Scripts Structure**

### Production Scripts (Keep)
```
scripts/
├── README.md                        # Documentation
├── precommit.sh                     # Git hooks
├── check-schema-status.js           # Database health
├── deploy-rls-security.sh           # Security deployment
├── setup-supabase-env.js            # Environment setup
├── email-templates/                 # Email templates
├── essential/                       # Core utilities
├── performance/                     # Performance monitoring
├── quality/                         # Code quality
└── security/                        # Security utilities
```

### Development Tools (Moved to Web)
```
web/tools/
├── fix-async-cookies.mjs            # Next.js specific
├── scan-next-dynamic.mjs            # Next.js specific
└── scan-next14-ssr.mjs              # Next.js specific
```

## 🎯 **Benefits of Cleanup**

### Before Cleanup
- **47 files** in scripts directory
- **3 files** in tools directory
- **Total: 50 files** of mixed utility

### After Cleanup
- **~15 files** in scripts directory (production only)
- **3 files** in web/tools directory (Next.js specific)
- **Total: ~18 files** (64% reduction)

### Benefits
- ✅ **Clear separation** between production and development scripts
- ✅ **Reduced confusion** about what scripts are actually needed
- ✅ **Better organization** with Next.js tools in web directory
- ✅ **Easier maintenance** with fewer files to manage
- ✅ **Clearer purpose** for each remaining script

## 🔄 **Next Steps**

1. **Delete one-time fix scripts** (Phase 1)
2. **Evaluate feature toggle scripts** (Phase 2)
3. **Evaluate utility scripts** (Phase 3)
4. **Update documentation** to reflect new structure
5. **Test that essential scripts still work**

---

**Result:** Clean, organized script structure with only essential production scripts and Next.js-specific development tools properly located.

**Last Updated:** 2024-12-19
