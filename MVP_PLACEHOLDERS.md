# MVP Placeholders Documentation

**Created:** January 19, 2025  
**Purpose:** Track all mock data, placeholder implementations, and temporary code that should be replaced with real implementations post-MVP

---

## 🎯 **Overview**

This document tracks all placeholder implementations, mock data, and temporary code that exists in the codebase but should not be considered production-ready. These are marked for future implementation once MVP is complete.

---

## 📋 **Placeholder Categories**

### **🔴 CRITICAL - Security/Privacy Placeholders**
*These could pose security risks if not addressed*

| File | Line | Description | Risk Level | Notes |
|------|------|-------------|------------|-------|
| `web/lib/electoral/geographic-feed.ts` | 503-508 | Mock hash-based "Walk the Talk" analysis | Medium | Uses deterministic hash instead of real analysis - should implement comprehensive representative accountability tracking |

### **🟡 MEDIUM - Feature Placeholders**
*Non-critical but misleading functionality*

| File | Line | Description | Implementation Needed | Notes |
|------|------|-------------|----------------------|-------|
| `web/shared/core/services/lib/poll-service.ts` | 58-217 | Extensive mock poll data (6 mock polls) | Real poll data integration | Contains mockPolls array with fake data for testing |
| `web/shared/core/services/lib/poll-service.ts` | 362 | Comment: "In real implementation, this would call the verification API" | API integration for poll verification | Currently just a comment, needs real implementation |
| `web/shared/core/services/lib/poll-service.ts` | 386 | Comment: "In real implementation, this would fetch from API" | API integration for data fetching | Currently just a comment, needs real implementation |
| `web/shared/core/services/lib/poll-service.ts` | 392 | TODO: "Implement with Supabase auth" | Supabase authentication integration | TODO comment for auth implementation |
| `web/lib/core/feature-flags.ts` | 35-36 | Disabled features: MEDIA_BIAS_ANALYSIS, POLL_NARRATIVE_SYSTEM | Complete feature implementations | Features marked as "not MVP ready" |
| `web/lib/core/feature-flags.ts` | 153 | Comment: "Experimental features removed - not actually implemented" | Remove or implement experimental features | Comment indicates incomplete feature removal |
| `web/lib/integrations/google-civic/transformers.ts` | 20 | Comment: "DISABLED: civics features disabled for MVP" | Re-enable civics features | Import commented out for MVP |

### **🟢 LOW - UI/UX Placeholders**
*Cosmetic or minor functionality*

| File | Line | Description | Implementation Needed | Notes |
|------|------|-------------|----------------------|-------|
| TBD | TBD | TBD | TBD | TBD |

---

## 🔍 **Discovery Process**

As we continue linting fixes, we'll systematically document:

1. **Mock data generators** - Functions that return fake data
2. **Placeholder algorithms** - Simplified implementations of complex features  
3. **TODO comments** - Code marked for future implementation
4. **Feature flags** - Disabled features with incomplete implementations
5. **Stub functions** - Functions that throw errors or return empty data

---

## 📝 **Documentation Standards**

### **For Each Placeholder:**
- **File path and line number**
- **Brief description of what it does**
- **What the real implementation should do**
- **Risk level (Critical/Medium/Low)**
- **Estimated implementation effort**
- **Dependencies on other features**

### **Risk Levels:**
- **🔴 CRITICAL**: Security, privacy, or data integrity risks
- **🟡 MEDIUM**: Misleading functionality or poor UX
- **🟢 LOW**: Cosmetic or minor functionality

---

## 🚀 **Post-MVP Implementation Plan**

1. **Phase 1**: Address all CRITICAL placeholders
2. **Phase 2**: Implement MEDIUM priority features  
3. **Phase 3**: Complete LOW priority enhancements

---

**Last Updated:** January 19, 2025  
**Status:** Active documentation during linting fixes
