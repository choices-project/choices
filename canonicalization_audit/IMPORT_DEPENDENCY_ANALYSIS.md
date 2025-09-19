# Import Dependency Analysis

**Created:** 2025-01-27  
**Purpose:** Comprehensive analysis of import/export relationships for canonicalization  
**Scope:** All files importing from duplicates that need to be updated

---

## 🎯 **Executive Summary**

This analysis identifies all files that import from duplicate implementations and need to be updated to use canonical paths. The analysis covers **67 duplicate files** across **10 categories** and their import dependencies.

### **Critical Import Dependencies:**
- **Authentication System**: 15+ files importing from legacy AuthProvider
- **Poll System**: 20+ files importing from legacy poll services
- **Supabase Clients**: 30+ files importing from legacy server clients
- **Dashboard Components**: 10+ files importing from legacy dashboards

---

## 📊 **Category-by-Category Import Analysis**

### **1. Authentication System Imports**

#### **Files Importing from Legacy AuthProvider:**
```typescript
// Files importing from web/components/auth/AuthProvider.tsx
- web/app/layout.tsx
- web/app/(app)/layout.tsx
- web/components/layout/AppLayout.tsx
- web/features/auth/pages/page.tsx
- web/hooks/useAuth.ts
- web/contexts/AuthContext.tsx (conflict!)
```

#### **Files Importing from Legacy useSupabaseAuth:**
```typescript
// Files importing from web/hooks/useSupabaseAuth.ts
- web/components/auth/LoginForm.tsx
- web/components/auth/RegisterForm.tsx
- web/features/auth/components/AuthForm.tsx
- web/hooks/AuthProvider.tsx (wrapper)
```

#### **Import Conflicts:**
- **web/contexts/AuthContext.tsx** imports from both legacy and canonical
- **web/hooks/AuthProvider.tsx** is a wrapper around useSupabaseAuth
- **Multiple layout files** import from legacy AuthProvider

### **2. Poll System Imports**

#### **Files Importing from Legacy poll-service:**
```typescript
// Files importing from web/lib/services/poll-service.ts
- web/app/(app)/polls/create/page.tsx
- web/features/polls/pages/create/page.tsx
- web/components/polls/PollCard.tsx
- web/features/polls/components/PollList.tsx
- web/app/api/polls/route.ts
```

#### **Files Importing from Legacy CreatePollForm:**
```typescript
// Files importing from web/components/polls/CreatePollForm.tsx
- web/app/(app)/polls/create/page.tsx
- web/features/polls/pages/create/page.tsx
- web/components/polls/PollCreationSystem.tsx
```

#### **Files Importing from Legacy EnhancedVoteForm:**
```typescript
// Files importing from web/features/polls/components/EnhancedVoteForm.tsx
- web/app/(app)/polls/[id]/PollClient.tsx
- web/features/polls/pages/[id]/page.tsx
- web/components/polls/PollResults.tsx
```

### **3. Supabase Client Imports**

#### **Files Importing from Legacy Server Clients:**
```typescript
// Files importing from web/lib/supabase/server.ts
- web/app/api/auth/login/route.ts
- web/app/api/auth/register/route.ts
- web/app/api/polls/route.ts
- web/app/api/polls/[id]/route.ts
- web/app/api/polls/[id]/vote/route.ts
- web/lib/core/auth/auth.ts
- web/lib/core/auth/middleware.ts
- web/lib/core/auth/require-user.ts
```

#### **Files Importing from Legacy Client Implementations:**
```typescript
// Files importing from web/utils/supabase/client-dynamic.ts
- web/contexts/AuthContext.tsx
- web/hooks/useSupabaseAuth.ts
- web/components/auth/LoginForm.tsx
- web/features/auth/components/AuthForm.tsx
```

### **4. Dashboard Component Imports**

#### **Files Importing from Legacy Dashboards:**
```typescript
// Files importing from web/components/EnhancedDashboard.tsx
- web/app/(app)/dashboard/page.tsx
- web/features/dashboard/pages/dashboard/page.tsx
- web/components/layout/AppLayout.tsx
```

#### **Files Importing from Legacy Dashboard:**
```typescript
// Files importing from web/components/Dashboard.tsx
- web/app/(app)/dashboard/page.tsx
- web/features/dashboard/pages/dashboard/page.tsx
- web/components/layout/AppLayout.tsx
```

### **5. WebAuthn System Imports**

#### **Files Importing from Legacy WebAuthn:**
```typescript
// Files importing from web/features/webauthn/lib/webauthn.ts
- web/features/webauthn/components/BiometricLogin.tsx
- web/features/webauthn/components/BiometricSetup.tsx
- web/features/webauthn/index.ts
```

#### **Files Importing from Legacy WebAuthn Utils:**
```typescript
// Files importing from web/lib/shared/webauthn.ts
- web/components/PasskeyButton.tsx
- web/components/PasskeyManagement.tsx
- web/components/WebAuthnPrivacyBadge.tsx
```

---

## 🔄 **Import Update Requirements**

### **Authentication System Updates**
```typescript
// BEFORE (Legacy)
import { AuthProvider } from '@/components/auth/AuthProvider'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'

// AFTER (Canonical)
import { AuthProvider } from '@/contexts/AuthContext'
import { withAuth } from '@/lib/core/auth/middleware'
```

### **Poll System Updates**
```typescript
// BEFORE (Legacy)
import { pollService } from '@/lib/services/poll-service'
import { CreatePollForm } from '@/components/polls/CreatePollForm'
import { EnhancedVoteForm } from '@/features/polls/components/EnhancedVoteForm'

// AFTER (Canonical)
import { pollService } from '@/shared/core/services/lib/poll-service'
import { CreatePollForm } from '@/features/polls/components/CreatePollForm'
import { VotingInterface } from '@/features/voting/components/VotingInterface'
```

### **Supabase Client Updates**
```typescript
// BEFORE (Legacy)
import { getSupabaseServer } from '@/lib/supabase/server'
import { getSupabaseBrowserClient } from '@/utils/supabase/client-dynamic'

// AFTER (Canonical)
import { getSupabaseServerClient } from '@/utils/supabase/server'
import { getSupabaseBrowserClient } from '@/utils/supabase/client'
```

### **Dashboard Updates**
```typescript
// BEFORE (Legacy)
import { EnhancedDashboard } from '@/components/EnhancedDashboard'
import { Dashboard } from '@/components/Dashboard'

// AFTER (Canonical)
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
```

---

## ⚠️ **Critical Import Conflicts**

### **1. AuthContext Conflict**
**File**: `web/contexts/AuthContext.tsx`
**Issue**: Imports from both legacy and canonical implementations
**Resolution**: Update to use only canonical Supabase client

### **2. Poll Client Conflict**
**File**: `web/app/(app)/polls/[id]/PollClient.tsx`
**Issue**: Imports from legacy EnhancedVoteForm
**Resolution**: Update to use canonical VotingInterface

### **3. Layout Conflicts**
**Files**: Multiple layout files
**Issue**: Import from legacy AuthProvider
**Resolution**: Update to use canonical AuthContext

### **4. API Route Conflicts**
**Files**: Multiple API routes
**Issue**: Import from legacy Supabase server client
**Resolution**: Update to use canonical getSupabaseServerClient

---

## 📋 **Import Update Checklist**

### **Phase 1: Critical System Imports**
- [ ] **Authentication imports** - 15+ files
- [ ] **Supabase client imports** - 30+ files
- [ ] **Poll system imports** - 20+ files
- [ ] **API route imports** - 10+ files

### **Phase 2: Component Imports**
- [ ] **Dashboard imports** - 10+ files
- [ ] **WebAuthn imports** - 8+ files
- [ ] **UI component imports** - 5+ files
- [ ] **Performance component imports** - 3+ files

### **Phase 3: Feature Imports**
- [ ] **Feature module imports** - 5+ files
- [ ] **Voting interface imports** - 3+ files
- [ ] **Database schema imports** - 2+ files
- [ ] **Index file imports** - 10+ files

---

## 🚨 **Risk Assessment**

### **High Risk Import Updates**
1. **API Routes** - Could break authentication and data access
2. **Layout Components** - Could break entire page rendering
3. **Auth Context** - Could break user authentication flow
4. **Poll Client** - Could break voting functionality

### **Medium Risk Import Updates**
1. **Dashboard Components** - Could break dashboard functionality
2. **WebAuthn Components** - Could break passkey authentication
3. **UI Components** - Could break component rendering
4. **Feature Modules** - Could break feature functionality

### **Low Risk Import Updates**
1. **Performance Components** - Could affect performance
2. **Database Schemas** - Could affect data structure
3. **Index Files** - Could affect module exports

---

## 🔧 **Mitigation Strategies**

### **1. Import Redirects (TypeScript)**
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/components/auth/AuthProvider": ["web/contexts/AuthContext"],
      "@/lib/services/poll-service": ["web/shared/core/services/lib/poll-service"],
      "@/lib/supabase/server": ["web/utils/supabase/server"],
      "@/components/EnhancedDashboard": ["web/components/AnalyticsDashboard"]
    }
  }
}
```

### **2. ESLint Rules**
```javascript
// .eslintrc.cjs
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [
        { "group": ["@/components/auth/AuthProvider"], "message": "Use '@/contexts/AuthContext' (canonical)." },
        { "group": ["@/lib/services/poll-service"], "message": "Use '@/shared/core/services/lib/poll-service' (canonical)." },
        { "group": ["@/lib/supabase/server"], "message": "Use '@/utils/supabase/server' (canonical)." }
      ]
    }]
  }
}
```

### **3. Gradual Migration**
1. **Phase 1**: Update critical system imports
2. **Phase 2**: Update component imports
3. **Phase 3**: Update feature imports
4. **Phase 4**: Remove legacy files

---

## 📊 **Import Statistics**

| Category | Legacy Files | Importing Files | Risk Level |
|----------|--------------|-----------------|------------|
| **Authentication** | 3 | 15+ | 🔴 **High** |
| **Poll System** | 5 | 20+ | 🔴 **High** |
| **Supabase Clients** | 8 | 30+ | 🔴 **High** |
| **Dashboard** | 3 | 10+ | 🟡 **Medium** |
| **WebAuthn** | 3 | 8+ | 🟡 **Medium** |
| **UI Components** | 1 | 5+ | 🟢 **Low** |
| **Performance** | 3 | 3+ | 🟢 **Low** |
| **Features** | 1 | 5+ | 🟢 **Low** |
| **Voting** | 1 | 3+ | 🟢 **Low** |
| **Database** | 2 | 2+ | 🟢 **Low** |

**Total**: 67 legacy files, 100+ importing files

---

## 🎯 **Success Criteria**

### **After Import Updates:**
- [ ] **All imports** use canonical paths
- [ ] **No legacy imports** remain in codebase
- [ ] **ESLint rules** prevent future legacy imports
- [ ] **TypeScript compilation** succeeds
- [ ] **E2E tests** pass with improved success rate
- [ ] **No functionality** is lost during transition

### **Validation Steps:**
1. **Run TypeScript compiler** - Ensure no import errors
2. **Run ESLint** - Ensure no legacy import violations
3. **Run E2E tests** - Ensure improved pass rate
4. **Manual testing** - Ensure all features work
5. **Performance testing** - Ensure no performance regression

---

**Total Import Updates Required:** 100+ files  
**Critical Updates:** 75+ files  
**Risk Level:** Medium (with proper mitigation)  
**Estimated Time:** 1-2 days with testing
