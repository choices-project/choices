# Practical Security Implementation Plan - Phase 2

**Created:** January 27, 2025  
**Last Updated:** January 27, 2025  
**Status:** 🚀 **READY FOR IMPLEMENTATION**

## 🎯 Executive Summary

After analyzing the comprehensive security review feedback, we've identified a **minimum-viable hardening approach** that provides real security improvements without over-engineering. This plan focuses on practical, copy-pasteable improvements that can be implemented as a single PR.

## 🔍 **Why This Approach is Superior**

### **Previous Review Analysis**
The comprehensive security review provided excellent recommendations but included some features that may be overkill for the current threat model:
- **JWT KID implementation** - Complex key rotation system
- **Refresh token architecture** - Full token rotation infrastructure
- **Advanced JWT claims** - Comprehensive JWT standardization

### **Our Practical Approach**
Instead of implementing everything at once, we're focusing on:
1. **High-impact, low-risk improvements** that solve real problems
2. **Incremental security** that can be implemented today
3. **Simple rules** that are easier to maintain and debug
4. **Production-ready** without development complexity

## 🛡️ **Phase 2 Implementation Plan**

### **1. Cookie Security Hardening**
**Goal:** Use `__Host-` prefixed cookies in production only

**Why This Makes Sense:**
- `__Host-` requires `secure: true` and `path: "/"` (automatic security)
- Prevents subdomain cookie manipulation
- Only applies in production (localhost development unaffected)

**Implementation:**
```typescript
// web/app/api/auth/_shared/cookies.ts
const isProd = process.env.NODE_ENV === "production";

export const SESSION_COOKIE = isProd ? "__Host-choices_session" : "choices_session";
export const CSRF_COOKIE    = isProd ? "__Host-choices_csrf"    : "choices_csrf";
```

**Benefits:**
- ✅ Automatic HTTPS enforcement in production
- ✅ No development environment breaking
- ✅ Drop-in replacement for existing cookie logic

### **2. CSRF Protection for All Non-GET Methods**
**Goal:** Simple rule: require CSRF token for any state-changing operation

**Why This Makes Sense:**
- **Simple rule:** All non-GET methods require CSRF
- **Safer than exceptions:** No risk of forgetting to add CSRF to a new endpoint
- **Easy to implement:** Copy-paste pattern for all API routes

**Implementation:**
```typescript
// web/app/api/auth/_shared/csrf.ts
export function requireCsrf(req: Request) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return true;
  const header = req.headers.get("x-csrf-token");
  const cookie = cookies().get(CSRF_COOKIE)?.value;
  return Boolean(header && cookie && header === cookie);
}
```

**Usage Pattern:**
```typescript
// In any non-GET API route
if (!requireCsrf(request)) {
  return NextResponse.json({ error: "CSRF" }, { status: 403 });
}
```

**Benefits:**
- ✅ Protects all state-changing operations
- ✅ Simple to implement and maintain
- ✅ No complex allowlist management

### **3. JWT Token Lifecycle Management**
**Goal:** Shorter access tokens (4 hours) with simple rotation capability

**Why This Makes Sense:**
- **4-hour tokens:** Balance between security and user experience
- **Simple rotation:** Accept current + old secret during transition
- **No KID complexity:** Can be added later if needed

**Implementation:**
```typescript
// web/lib/jwt.ts
const CURRENT = process.env.JWT_SECRET_CURRENT!;
const OLD     = process.env.JWT_SECRET_OLD;

// Try current secret first, fall back to old during rotation
const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, CURRENT, { issuer: ISSUER, audience: AUDIENCE });
  } catch (error) {
    if (OLD) {
      try {
        return jwt.verify(token, OLD, { issuer: ISSUER, audience: AUDIENCE });
      } catch (fallbackError) {
        throw error; // Throw original error for better debugging
      }
    }
    throw error;
  }
};
```

**Benefits:**
- ✅ Shorter token lifetime reduces exposure window
- ✅ Simple rotation without database changes
- ✅ Can be enhanced with KID later if needed

## 📋 **Implementation Checklist**

### **Phase 2A: Cookie & CSRF (Week 1)**
- [ ] Create `web/app/api/auth/_shared/cookies.ts`
- [ ] Create `web/app/api/auth/_shared/csrf.ts`
- [ ] Update all auth endpoints to use new cookie functions
- [ ] Add CSRF protection to all non-GET API routes
- [ ] Test in development environment
- [ ] Test in production environment

### **Phase 2B: JWT Hardening (Week 2)**
- [ ] Update JWT library with rotation support
- [ ] Reduce token lifetime to 4 hours
- [ ] Add environment variables for secret rotation
- [ ] Update token generation and verification
- [ ] Test token rotation process

### **Phase 2C: Testing & Documentation (Week 3)**
- [ ] Comprehensive testing of all security features
- [ ] Update security documentation
- [ ] Create deployment checklist
- [ ] Document rollback procedures

## 🚨 **Pre-Commit Hook Implementation**

### **Critical Security Measure**
**Goal:** Prevent accidental credential leaks in commits

**Implementation:**
```bash
# .git/hooks/pre-commit
#!/bin/sh

# Check for potential credential leaks
if git diff --cached | grep -i "password\|secret\|key\|token" | grep -v "example\|test\|mock"; then
  echo "⚠️  WARNING: Potential credentials detected in commit!"
  echo "Please review the following lines:"
  git diff --cached | grep -i "password\|secret\|key\|token" | grep -v "example\|test\|mock"
  echo ""
  echo "If these are legitimate, add them to .gitignore or use environment variables."
  echo "To proceed anyway, use: git commit --no-verify"
  exit 1
fi
```

**Benefits:**
- ✅ Catches accidental credential commits
- ✅ Prevents security incidents
- ✅ Educates team on security practices

## 🔄 **Migration Strategy**

### **Step 1: Create New Shared Modules**
- Implement cookie and CSRF modules
- Test thoroughly in development

### **Step 2: Gradual API Route Updates**
- Update auth endpoints first
- Then update other state-changing endpoints
- Maintain backward compatibility during transition

### **Step 3: JWT Updates**
- Deploy new JWT library
- Set shorter token lifetime
- Monitor for any authentication issues

### **Step 4: Production Deployment**
- Deploy during low-traffic period
- Monitor logs for errors
- Have rollback plan ready

## 📊 **Risk Assessment**

### **Low Risk Changes**
- ✅ Cookie security hardening
- ✅ CSRF protection addition
- ✅ JWT lifetime reduction

### **Medium Risk Changes**
- ⚠️ JWT secret rotation process
- ⚠️ Cookie name changes in production

### **Mitigation Strategies**
- Comprehensive testing in staging environment
- Gradual rollout with monitoring
- Clear rollback procedures
- Team training on new security features

## 🎯 **Success Metrics**

### **Security Improvements**
- [ ] All non-GET API routes protected by CSRF
- [ ] Production cookies use `__Host-` prefix
- [ ] JWT tokens expire in 4 hours
- [ ] No accidental credential leaks in commits

### **Operational Metrics**
- [ ] Zero security incidents during implementation
- [ ] No user authentication disruptions
- [ ] Improved security audit scores
- [ ] Team confidence in security practices

## 🔮 **Future Considerations**

### **Phase 3 Possibilities**
- JWT KID implementation for advanced key rotation
- Refresh token architecture
- Advanced JWT claims standardization
- Rate limiting and DDoS protection

### **When to Consider Phase 3**
- After Phase 2 is stable and tested
- When threat model requires additional security
- When team capacity allows for complex implementations
- When compliance requirements demand advanced features

## 📝 **Next Steps**

1. **Review this plan** and provide feedback
2. **Prioritize implementation order** based on your timeline
3. **Set up pre-commit hooks** immediately
4. **Begin Phase 2A implementation** (cookies and CSRF)
5. **Schedule Phase 2B** (JWT hardening)

## 🤝 **Team Coordination**

### **Roles & Responsibilities**
- **Security Lead:** Implementation oversight and testing
- **Development Team:** Code implementation and testing
- **DevOps:** Deployment and monitoring
- **QA:** Security testing and validation

### **Communication Plan**
- Weekly progress updates
- Immediate notification of any issues
- Clear escalation procedures
- Documentation updates as features are implemented

---

**This plan provides a practical path to significantly improve security without overwhelming complexity. Each phase builds on the previous one, ensuring steady progress toward a more secure platform.**
