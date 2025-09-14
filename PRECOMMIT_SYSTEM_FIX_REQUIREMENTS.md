# Pre-Commit System Fix Requirements

**Created:** December 19, 2024  
**Updated:** December 19, 2024

## 🎯 **Problem Statement**

The pre-commit system has been partially fixed but is now failing due to false positives. The security checks are detecting patterns in the security script itself, creating a circular problem. We need a clean, working solution that maintains security while avoiding false positives.

## 📋 **Current Status**

### **✅ What's Working:**
- Husky is now single-home (root only)
- `.husky/_/` folder is clean (only husky.sh)
- Manual Git hooks removed
- `scripts/precommit.sh` created with comprehensive security checks
- `.husky/pre-commit` and `.husky/commit-msg` created
- Broken pre-push references removed

### **❌ What's Broken:**
- Security checks are triggering false positives on the script itself
- Script contains patterns it's designed to detect (JWT, Supabase keys, DB URLs, etc.)
- This creates a circular dependency where the security script can't be committed

## 🔍 **Specific Issues**

### **1. Database URL Detection**
**Pattern:** `postgresql://[^[:space:]]+:[^[:space:]]+@[^[:space:]]+`
**Problem:** Script contains this pattern in its grep command
**Current Fix Attempt:** Added `grep.*postgresql` exclusion (insufficient)

### **2. Supabase Key Detection**
**Pattern:** `sb_(publishable|secret)_`
**Problem:** Script contains this pattern in its grep command and error messages
**Current Fix Attempt:** Added `grep.*sb_|err.*sb_` exclusion (insufficient)

### **3. Environment Variable Detection**
**Pattern:** `(JWT_ISSUER|JWT_AUDIENCE|REFRESH_TOKEN_COOKIE).*=.*[A-Za-z0-9]`
**Problem:** Script contains these patterns in its grep commands
**Current Fix Attempt:** None (still failing)

### **4. Generic API Key Detection**
**Pattern:** `(api_key|secret_key|private_key|access_token|bearer_token).*=.*[A-Za-z0-9]{20,}`
**Problem:** Script contains these patterns in its grep commands
**Current Fix Attempt:** None (likely to fail)

## 🎯 **Requirements**

### **Security Requirements:**
1. **MUST scan ALL files** including scripts directory
2. **MUST detect real secrets** in any file type
3. **MUST NOT exclude entire directories** from security scanning
4. **MUST maintain comprehensive security coverage**

### **Functional Requirements:**
1. **MUST allow the security script to be committed** without false positives
2. **MUST detect actual secrets** in the security script if they exist
3. **MUST be maintainable** and not require constant pattern updates
4. **MUST work with the existing Husky setup**

## 🔧 **Proposed Solutions**

### **Option A: Context-Aware Pattern Matching**
- Modify patterns to be more specific about context
- Use line-by-line analysis instead of simple grep
- Distinguish between pattern definitions and actual secrets

### **Option B: Multi-Pass Analysis**
- First pass: Identify potential security issues
- Second pass: Filter out false positives from security scripts
- Use file metadata to determine if it's a security script

### **Option C: Pattern Exclusion Lists**
- Create specific exclusion patterns for security script content
- Maintain a whitelist of allowed patterns in security scripts
- Use more sophisticated regex to avoid false positives

### **Option D: Separate Security Script**
- Move security patterns to a separate configuration file
- Keep the main script clean of security patterns
- Use external pattern definitions

## 📊 **Current Script Analysis**

### **Security Patterns in Script:**
```bash
# JWT tokens
eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*

# Hardcoded credentials
(SUPABASE.*KEY|JWT.*SECRET|ADMIN.*ID).*=.*[A-Za-z0-9]{8,}

# Database URLs
postgresql://[^[:space:]]+:[^[:space:]]+@[^[:space:]]+

# Generic API keys
(api_key|secret_key|private_key|access_token|bearer_token).*=.*[A-Za-z0-9]{20,}

# Supabase keys
sb_(publishable|secret)_

# UUIDs
[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}

# Long hex strings
[A-Fa-f0-9]{64,}

# Environment variables
(JWT_ISSUER|JWT_AUDIENCE|REFRESH_TOKEN_COOKIE).*=.*[A-Za-z0-9]
```

### **File Types Scanned:**
- All staged files (A/C/M)
- TypeScript/JavaScript files in web/
- SQL files
- Any file type (no exclusions)

## 🚀 **Implementation Requirements**

### **For Another AI:**

1. **Analyze the current script** (`scripts/precommit.sh`)
2. **Identify all false positive sources**
3. **Design a solution** that maintains security while avoiding false positives
4. **Implement the fix** without compromising security coverage
5. **Test thoroughly** with various file types and scenarios

### **Success Criteria:**
- ✅ Security script can be committed without false positives
- ✅ Real secrets are still detected in any file
- ✅ No directories are excluded from scanning
- ✅ Script is maintainable and doesn't require constant updates
- ✅ All existing security patterns are preserved

### **Test Scenarios:**
1. **Commit the security script itself** (should pass)
2. **Commit a file with real secrets** (should fail)
3. **Commit a file with placeholder secrets** (should pass)
4. **Commit a file with security-related code** (should pass)
5. **Commit a file with actual credentials** (should fail)

## 📝 **Current Script Location**

The problematic script is located at:
- **File:** `/Users/alaughingkitsune/src/Choices/scripts/precommit.sh`
- **Lines:** 130 lines
- **Status:** Partially working, failing on false positives

## 🔗 **Related Files**

- **Husky config:** `/Users/alaughingkitsune/src/Choices/.husky/pre-commit`
- **Commit message hook:** `/Users/alaughingkitsune/src/Choices/.husky/commit-msg`
- **Root package.json:** `/Users/alaughingkitsune/src/Choices/package.json`
- **Web package.json:** `/Users/alaughingkitsune/src/Choices/web/package.json`

## 🎯 **Expected Outcome**

After the fix:
1. **Security script commits successfully** without false positives
2. **Real secrets are detected** in any file type
3. **Security coverage is maintained** at current level
4. **System is maintainable** and doesn't require constant pattern updates
5. **Pre-commit system works reliably** for all developers

---

**Note:** This is a critical security system that must work correctly. The solution should prioritize security while solving the false positive issue elegantly.
