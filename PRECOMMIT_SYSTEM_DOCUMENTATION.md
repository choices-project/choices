# Pre-Commit System Documentation

**Created:** December 19, 2024  
**Updated:** December 19, 2024

## 🎯 **Overview**

This document provides a comprehensive analysis of the pre-commit system in the Choices project, including its current state, configuration, and recommendations for improvement.

## 📋 **Current Setup Analysis**

### **Husky Configuration**

#### **Root Package.json** (`/package.json`)
```json
{
  "name": "choices-repo",
  "private": true,
  "devDependencies": {
    "husky": "9.1.7"
  },
  "scripts": {
    "prepare": "husky install"
  }
}
```

#### **Web Package.json** (`/web/package.json`)
```json
{
  "devDependencies": {
    "husky": "9.1.7"
  }
}
```

### **Husky Directory Structure**
```
/.husky/
├── _/                          # Husky internal files
│   ├── applypatch-msg
│   ├── commit-msg
│   ├── husky.sh
│   ├── post-applypatch
│   ├── post-checkout
│   ├── post-commit
│   ├── post-merge
│   ├── post-rewrite
│   ├── pre-applypatch
│   ├── pre-auto-gc
│   ├── pre-commit
│   ├── pre-merge-commit
│   ├── pre-push
│   ├── pre-rebase
│   └── prepare-commit-msg
└── pre-commit                  # Main pre-commit hook
```

### **Git Hooks Directory** (`/.git/hooks/`)
```
/.git/hooks/
├── commit-msg                  # Active commit message hook
├── commit-msg-improved         # Backup/alternative version
├── commit-msg-old              # Old version
├── post-merge                  # Post-merge hook
├── post-push                   # Post-push hook
├── pre-commit                  # Active pre-commit hook
├── pre-commit-improved         # Backup/alternative version
├── pre-commit-old              # Old version
├── pre-commit.backup           # Backup version
└── [various .sample files]     # Git sample hooks
```

## 🔍 **Hook Analysis**

### **1. Pre-Commit Hook** (`/.git/hooks/pre-commit`)

**Purpose:** Comprehensive security and code quality checks

**Key Features:**
- **Security Checks:**
  - Blocks `.env` files, credential files, database files
  - Detects JWT tokens, hardcoded credentials, API keys
  - Scans for Supabase keys, hex-encoded secrets
  - Validates SQL UUIDs and environment variables
  - Warns about log files

- **Code Quality Checks:**
  - Runs ESLint on staged JS/TS files in `web/` directory
  - Batches ESLint runs to avoid argument limits
  - Non-blocking TODO/FIXME warnings

- **File Processing:**
  - Only processes staged files (Added/Copied/Modified/Renamed)
  - Uses null-delimited processing to handle large file sets
  - Focuses on added lines only (ignores deletions)

**Security Patterns Blocked:**
```bash
# JWT tokens (unless marked as example/placeholder)
eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*

# Hardcoded credentials
SUPABASE.*KEY|JWT.*SECRET|ADMIN.*ID

# Database URLs with passwords
postgresql://[^[:space:]]+:[^[:space:]]+@[^[:space:]]+

# Generic secret patterns
api_key|secret_key|private_key|access_token|bearer_token

# Supabase key prefixes
sb_publishable_|sb_secret_

# Long hex strings (≥64 chars)
[A-Fa-f0-9]{64,}

# SQL UUIDs (unless placeholder)
[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}
```

### **2. Commit Message Hook** (`/.git/hooks/commit-msg`)

**Purpose:** Enforces conventional commit format

**Features:**
- Validates commit message format: `type(scope): description`
- Supports types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`
- **Non-blocking** - only provides warnings/suggestions
- Shows examples of proper format

### **3. Pre-Push Hook** (`/.git/hooks/pre-push`)

**Purpose:** Enhanced validation before pushing to remote

**Features:**
- Attempts to run `scripts/ci/enhanced-pre-push-validation.sh`
- **Currently broken** - script doesn't exist (was deleted during cleanup)
- Provides helpful tips on common issues
- Enforces best practices

### **4. Husky Pre-Commit** (`/.husky/pre-commit`)

**Purpose:** Husky-managed pre-commit hook

**Content:**
```bash
# Always run the consolidated hook script from repo root
bash scripts/precommit.sh
```

**Status:** **BROKEN** - References `scripts/precommit.sh` which doesn't exist

## ⚠️ **Issues Identified**

### **1. Duplicate Husky Installation**
- Husky is installed in both root and web package.json
- This creates confusion and potential conflicts
- Only one installation is needed

### **2. Broken Hook References**
- `.husky/pre-commit` references non-existent `scripts/precommit.sh`
- `.git/hooks/pre-push` references non-existent `scripts/ci/enhanced-pre-push-validation.sh`
- These hooks will fail silently or cause errors

### **3. Inconsistent Hook Management**
- Some hooks are managed by Husky (`.husky/`)
- Others are direct Git hooks (`.git/hooks/`)
- This creates maintenance complexity

### **4. Missing Scripts Directory**
- The `scripts/` directory was deleted during aggressive cleanup
- Several hooks depend on scripts that no longer exist
- This breaks the pre-commit system

## 🔧 **Recommendations**

### **1. Consolidate Husky Installation**
```json
// Keep only in root package.json
{
  "devDependencies": {
    "husky": "9.1.7"
  },
  "scripts": {
    "prepare": "husky install"
  }
}
```

### **2. Fix Broken Hook References**
- Update `.husky/pre-commit` to point to the actual working hook
- Remove or fix the broken pre-push validation script reference

### **3. Standardize Hook Management**
- Use Husky for all hook management
- Remove duplicate Git hooks
- Centralize hook logic

### **4. Restore Missing Scripts**
- Recreate essential scripts that were deleted
- Or update hooks to not depend on external scripts

## 🎯 **Proposed Solution**

### **Option A: Minimal Fix (Recommended)**
1. Remove Husky from `web/package.json`
2. Update `.husky/pre-commit` to run the working Git hook directly
3. Fix or remove the broken pre-push validation reference

### **Option B: Complete Restructure**
1. Consolidate all hooks under Husky management
2. Move hook logic into the Husky directory
3. Remove duplicate Git hooks
4. Create a unified hook system

### **Option C: Hybrid Approach**
1. Keep the working Git hooks as-is
2. Update Husky to call the working hooks
3. Remove broken references
4. Maintain current security and quality checks

## 📊 **Current Status**

| Component | Status | Issues |
|-----------|--------|---------|
| Root Husky | ✅ Working | Duplicate installation |
| Web Husky | ⚠️ Unnecessary | Duplicate installation |
| Git Pre-Commit | ✅ Working | Comprehensive security checks |
| Git Commit-Msg | ✅ Working | Conventional commit validation |
| Git Pre-Push | ❌ Broken | Missing validation script |
| Husky Pre-Commit | ❌ Broken | Missing precommit.sh script |

## 🚀 **Next Steps**

1. **Immediate:** Fix broken hook references
2. **Short-term:** Consolidate Husky installation
3. **Medium-term:** Standardize hook management
4. **Long-term:** Consider upgrading to modern pre-commit tools

## 📝 **Conclusion**

The pre-commit system has excellent security and quality checks but suffers from:
- Duplicate installations
- Broken references to deleted scripts
- Inconsistent hook management

The core functionality (security scanning, ESLint, commit message validation) is solid and should be preserved while fixing the structural issues.

---

**Note:** This analysis was conducted after the aggressive cleanup that removed the `scripts/` directory, which explains some of the broken references.
