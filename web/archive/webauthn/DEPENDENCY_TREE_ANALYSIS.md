# WebAuthn Dependency Tree Analysis

**Created:** October 2, 2025  
**Status:** ✅ **ANALYSIS COMPLETE**  
**Purpose:** Identify all files dependent on inferior WebAuthn implementations

---

## 🎯 **Problem: Multiple WebAuthn Implementations**

The codebase has **multiple conflicting WebAuthn implementations** with **complex dependency trees**:

### **1. PRODUCTION-READY: `/api/v1/auth/webauthn/`** ✅ **KEEP**
- Uses `@simplewebauthn/server` - Industry standard
- Proper WebAuthn verification
- Security features
- E2E test support

### **2. INFERIOR: `/api/auth/webauthn/`** ❌ **ARCHIVE**
- Redirects to v1 (redundant)
- Inconsistent implementation
- Creates confusion

### **3. INCOMPLETE: `/api/webauthn/`** ❌ **ARCHIVE**  
- Basic validation only
- TODO comments for proper verification
- Feature flag dependent

---

## 🔍 **Dependency Tree Analysis**

### **Files Using INFERIOR Endpoints (Need Updates)**

#### **1. `/app/login/page.tsx`** ❌ **NEEDS UPDATE**
**Current calls:**
- `GET /api/auth/webauthn/credentials` 
- `POST /api/auth/webauthn/authenticate`

**Should use:**
- `GET /api/v1/auth/webauthn/credentials` (if exists)
- `POST /api/v1/auth/webauthn/authenticate/options`
- `POST /api/v1/auth/webauthn/authenticate/verify`

#### **2. `/app/(app)/profile/page.tsx`** ❌ **NEEDS UPDATE**
**Current calls:**
- `GET /api/auth/webauthn/credentials`
- `GET /api/auth/webauthn/trust-score`
- `DELETE /api/auth/webauthn/credentials/{id}`

**Should use:**
- `GET /api/v1/auth/webauthn/credentials` (if exists)
- `GET /api/v1/auth/webauthn/trust-score` (if exists)
- `DELETE /api/v1/auth/webauthn/credentials/{id}` (if exists)

#### **3. `/app/(app)/profile/biometric-setup/page.tsx`** ❌ **NEEDS UPDATE**
**Current calls:**
- `POST /api/auth/webauthn/register` (2 calls)

**Should use:**
- `POST /api/v1/auth/webauthn/register/options`
- `POST /api/v1/auth/webauthn/register/verify`

#### **4. `/components/PasskeyManagement.tsx`** ❌ **NEEDS UPDATE**
**Current calls:**
- `GET /api/auth/webauthn/credentials`

**Should use:**
- `GET /api/v1/auth/webauthn/credentials` (if exists)

#### **5. `/components/auth/PasskeyLogin.tsx`** ❌ **NEEDS UPDATE**
**Current calls:**
- `POST /api/auth/webauthn/authenticate/begin`
- `POST /api/auth/webauthn/authenticate/complete`

**Should use:**
- `POST /api/v1/auth/webauthn/authenticate/options`
- `POST /api/v1/auth/webauthn/authenticate/verify`

### **Files Using CORRECT Endpoints (Already Updated)**

#### **1. `/components/auth/PasskeyRegister.tsx`** ✅ **CORRECT**
**Current calls:**
- `POST /api/v1/auth/webauthn/register/options` ✅
- `POST /api/v1/auth/webauthn/register/verify` ✅

#### **2. `/lib/webauthn/client.ts`** ✅ **CORRECT**
**Current calls:**
- `POST /api/v1/auth/webauthn/register/options` ✅
- `POST /api/v1/auth/webauthn/register/verify` ✅
- `POST /api/v1/auth/webauthn/authenticate/options` ✅
- `POST /api/v1/auth/webauthn/authenticate/verify` ✅

---

## 🚨 **Missing Endpoints in Production Implementation**

The production `/api/v1/auth/webauthn/` implementation is **missing some endpoints** that the frontend expects:

### **Missing Endpoints:**
1. `GET /api/v1/auth/webauthn/credentials` - List user credentials
2. `GET /api/v1/auth/webauthn/trust-score` - Get trust score
3. `DELETE /api/v1/auth/webauthn/credentials/{id}` - Delete credential

### **Solution Options:**
1. **Create missing endpoints** in `/api/v1/auth/webauthn/`
2. **Update frontend** to use existing endpoints
3. **Hybrid approach** - Create missing endpoints + update frontend

---

## 📋 **Consolidation Plan**

### **Phase 1: Create Missing Production Endpoints**
1. Create `GET /api/v1/auth/webauthn/credentials`
2. Create `GET /api/v1/auth/webauthn/trust-score` 
3. Create `DELETE /api/v1/auth/webauthn/credentials/{id}`

### **Phase 2: Update Frontend Files**
1. Update `/app/login/page.tsx` to use v1 endpoints
2. Update `/app/(app)/profile/page.tsx` to use v1 endpoints
3. Update `/app/(app)/profile/biometric-setup/page.tsx` to use v1 endpoints
4. Update `/components/PasskeyManagement.tsx` to use v1 endpoints
5. Update `/components/auth/PasskeyLogin.tsx` to use v1 endpoints

### **Phase 3: Archive Inferior Implementations**
1. ✅ **COMPLETED** - Archived `/api/auth/webauthn/`
2. ✅ **COMPLETED** - Archived `/api/webauthn/`

### **Phase 4: Clean Up Archive References**
1. Remove references to archived endpoints
2. Update documentation
3. Update tests

---

## 🎯 **Expected Result**

**Single WebAuthn Implementation:**
- ✅ **`/api/v1/auth/webauthn/`** - Complete production-ready system
- ✅ **All frontend files** use correct endpoints
- ✅ **No more confusion** about which endpoints to use
- ✅ **Easier maintenance** with single implementation
- ✅ **Fewer bugs** from conflicting implementations

---

**Status:** ✅ **ANALYSIS COMPLETE**  
**Next Steps:** Create missing endpoints and update frontend files
