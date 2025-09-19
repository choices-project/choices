# E2E Test Failure Analysis & Troubleshooting Guide

**Created**: January 18, 2025  
**Updated**: January 18, 2025  
**Status**: Critical - 161/200 tests failing (19% pass rate)

## 🚨 **Executive Summary**

The E2E test suite is experiencing widespread failures across all test categories. The primary issues are:

1. **Registration Form Not Loading** - Core MVP functionality broken
2. **Login Form Elements Missing** - Authentication flow completely broken  
3. **WebAuthn Virtual Authenticator Issues** - All WebAuthn tests failing
4. **Rate Limiting Bypass Not Working** - E2E bypass pattern broken
5. **Dynamic Import Timing Issues** - Dashboard elements not loading

**Current Status**: 39/200 tests passing (19.5% pass rate)

---

## 📊 **Test Results Breakdown**

### **Passing Tests (39/200)**
- ✅ **Rate Limiting Tests**: 4/4 passing (100%) - Desktop Chrome only
- ✅ **WebAuthn API Tests**: 35/35 passing (100%) - All browsers
- ❌ **Authentication Flow Tests**: 0/7 passing (0%) - All browsers
- ❌ **WebAuthn Component Tests**: 0/9 passing (0%) - All browsers  
- ❌ **WebAuthn Flow Tests**: 0/9 passing (0%) - All browsers

### **Failing Tests by Category**

#### **Authentication Flow (7 tests × 5 browsers = 35 failures)**
- `should complete full authentication and onboarding flow`
- `should handle authentication errors gracefully`
- `should handle OAuth authentication errors`
- `should handle network errors during authentication`
- `should preserve onboarding progress on page refresh`
- `should allow going back in onboarding flow`
- `should validate required fields in onboarding`

#### **WebAuthn Components (9 tests × 5 browsers = 45 failures)**
- `should render PasskeyButton components`
- `should render PasskeyControls component`
- `should handle WebAuthn support detection`
- `should render WebAuthn prompts correctly`
- `should handle WebAuthn component interactions`
- `should validate WebAuthn component accessibility`
- `should handle WebAuthn component error states`
- `should validate WebAuthn component responsive design`

#### **WebAuthn Flow (9 tests × 5 browsers = 45 failures)**
- `should complete passkey registration flow`
- `should complete passkey authentication flow`
- `should handle passkey registration cancellation`
- `should handle network errors gracefully`
- `should show passkey management interface`
- `should handle multiple passkey registration`
- `should handle cross-device authentication`
- `should validate WebAuthn support detection`
- `should test WebAuthn API endpoints directly`
- `should test WebAuthn feature flag integration`

#### **Rate Limiting Bypass (2 tests × 4 browsers = 8 failures)**
- `should bypass rate limiting with E2E header` (Mobile Safari only)
- `should show login form elements` (Firefox, WebKit, Mobile Safari)

---

## 🔍 **Root Cause Analysis**

### **1. Registration Form Not Loading (CRITICAL)**

**Error Pattern**:
```
Error: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="register-form"]') to be visible
```

**Root Causes**:
1. **React Hydration Issues**: The register page has a hydration sentinel but tests are timing out
2. **Dynamic Import Problems**: Registration form may not be loading due to disabled onboarding components
3. **Test ID Mismatch**: Tests expect `register-form` but page may not be rendering

**Evidence**:
- Register page exists at `/web/features/auth/pages/register/page.tsx`
- Has proper `data-testid="register-form"` on line 123
- Includes hydration sentinel on line 60: `<div data-testid="register-hydrated" hidden>{hydrated ? '1' : '0'}</div>`

**Questions for Investigation**:
- Is the register page actually loading in the browser?
- Are there JavaScript errors preventing React hydration?
- Is the onboarding redirect on line 45 causing issues?

### **2. Login Form Elements Missing (CRITICAL)**

**Error Pattern**:
```
Error: expect(locator).toBeVisible() failed
Locator: getByTestId('login-email')
Expected: visible
Received: <element(s) not found>
```

**Root Causes**:
1. **Login Page Not Loading**: The login page may not be rendering at all
2. **Test ID Mismatch**: Tests expect `login-email` but page uses different IDs
3. **Authentication Middleware Issues**: Rate limiting or security middleware blocking access

**Evidence**:
- Login page exists at `/web/app/login/page.tsx`
- Uses `data-testid="login-email"` on line 246 (in the form)
- Has proper form structure with `data-testid="login-form"` on line 216

**Questions for Investigation**:
- Is the login page accessible at `/login`?
- Are there 429 (Too Many Requests) errors in the network tab?
- Is the E2E bypass header working correctly?

### **3. WebAuthn Virtual Authenticator Issues (ALL BROWSERS)**

**Error Pattern**:
```
Error: cdpSession.send: Protocol error (WebAuthn.addVirtualAuthenticator): Invalid parameters
```

**Root Causes**:
1. **Playwright WebAuthn API Changes**: The virtual authenticator API may have changed
2. **Browser Compatibility**: Different browsers may require different parameters
3. **CDP Session Issues**: Chrome DevTools Protocol session not properly established

**Evidence**:
- All WebAuthn tests use the same virtual authenticator setup
- Error occurs on line 40 of `webauthn-flow.spec.ts`
- Affects all browsers (Chrome, Firefox, Safari, Mobile)

**Questions for Investigation**:
- What version of Playwright is being used?
- Are there any WebAuthn API changes in recent Playwright versions?
- Should we use a different approach for WebAuthn testing?

### **4. Rate Limiting Bypass Not Working (MOBILE SAFARI)**

**Error Pattern**:
```
Error: expect(received).toBeLessThan(expected)
Expected: < 400
Received: 429
```

**Root Causes**:
1. **E2E Header Not Set**: Tests not sending the bypass header
2. **Middleware Configuration**: Rate limiting not properly bypassed for E2E
3. **Mobile Safari Specific**: Different behavior on mobile browsers

**Evidence**:
- Middleware has E2E bypass logic in `shouldBypassForE2E()` function
- Tests should be sending `x-e2e-bypass: 1` header
- Only affects Mobile Safari, other browsers work

**Questions for Investigation**:
- Are E2E tests actually sending the bypass header?
- Is the middleware properly detecting E2E environment?
- Why does it work on desktop but not mobile?

---

## 🛠️ **Immediate Action Items**

### **Priority 1: Fix Core MVP Authentication (CRITICAL)**

1. **Verify Login Page Accessibility**
   ```bash
   # Check if login page loads
   curl -H "x-e2e-bypass: 1" http://localhost:3000/login
   ```

2. **Check for JavaScript Errors**
   - Open browser dev tools during test runs
   - Look for React hydration errors
   - Check for missing module errors

3. **Test Registration Form Manually**
   - Navigate to `/register` in browser
   - Check if form elements are visible
   - Verify test IDs are present

### **Priority 2: Fix WebAuthn Testing Infrastructure**

1. **Update Playwright WebAuthn Setup**
   - Research current Playwright WebAuthn API
   - Update virtual authenticator parameters
   - Consider using different testing approach

2. **Simplify WebAuthn Tests**
   - Focus on API endpoints first
   - Mock WebAuthn UI interactions
   - Test core functionality without virtual authenticators

### **Priority 3: Fix Rate Limiting Bypass**

1. **Verify E2E Header Implementation**
   - Check if tests are sending headers
   - Verify middleware detection logic
   - Test bypass on different browsers

---

## 🔧 **Technical Investigation Commands**

### **Check Current Build Status**
```bash
cd /Users/alaughingkitsune/src/Choices/web
npm run build
npm run dev
```

### **Test Individual Pages**
```bash
# Test login page
curl -v http://localhost:3000/login

# Test register page  
curl -v http://localhost:3000/register

# Test with E2E bypass
curl -H "x-e2e-bypass: 1" -v http://localhost:3000/login
```

### **Check Playwright Version**
```bash
cd /Users/alaughingkitsune/src/Choices/web
npx playwright --version
```

### **Run Single Test File**
```bash
# Test only authentication flow
npx playwright test tests/e2e/authentication-flow.spec.ts --headed

# Test only rate limiting
npx playwright test tests/e2e/rate-limit-bypass.spec.ts --headed
```

---

## 📋 **Debugging Checklist**

### **For Registration Form Issues**
- [ ] Verify register page loads in browser manually
- [ ] Check browser console for JavaScript errors
- [ ] Verify React hydration is working
- [ ] Check if onboarding redirect is causing issues
- [ ] Test with different browsers

### **For Login Form Issues**
- [ ] Verify login page loads in browser manually
- [ ] Check for 429 rate limiting errors
- [ ] Verify E2E bypass header is working
- [ ] Check middleware configuration
- [ ] Test with different user agents

### **For WebAuthn Issues**
- [ ] Research current Playwright WebAuthn API
- [ ] Check browser compatibility
- [ ] Consider alternative testing approaches
- [ ] Test with different virtual authenticator parameters
- [ ] Focus on API testing first

### **For Rate Limiting Issues**
- [ ] Verify E2E header is being sent
- [ ] Check middleware bypass logic
- [ ] Test on different browsers
- [ ] Check environment variables
- [ ] Verify test configuration

---

## 🎯 **Success Criteria**

### **Phase 1: Core MVP Working (IMMEDIATE)**
- [ ] Login page loads and shows form elements
- [ ] Registration page loads and shows form elements
- [ ] Basic authentication flow works
- [ ] Rate limiting bypass works on all browsers

### **Phase 2: WebAuthn Infrastructure (SHORT TERM)**
- [ ] WebAuthn API tests continue passing
- [ ] WebAuthn component tests work with mocked interactions
- [ ] WebAuthn flow tests work with simplified setup

### **Phase 3: Full Test Suite (MEDIUM TERM)**
- [ ] All authentication tests pass
- [ ] All WebAuthn tests pass
- [ ] All rate limiting tests pass
- [ ] Test suite runs reliably in CI

---

## 🤔 **Questions for AI Troubleshooting**

### **Critical Questions**
1. **Why is the registration form not loading in E2E tests but works manually?**
   - Is this a React hydration timing issue?
   - Are there missing dependencies or imports?
   - Is the onboarding redirect causing problems?

2. **Why are login form elements not found in E2E tests?**
   - Is the page actually loading?
   - Are there JavaScript errors preventing rendering?
   - Is rate limiting blocking the requests?

3. **How should WebAuthn testing be implemented in current Playwright?**
   - What's the correct virtual authenticator setup?
   - Should we use a different testing approach?
   - Are there browser-specific requirements?

4. **Why does rate limiting bypass work on desktop but not mobile?**
   - Are headers being sent correctly?
   - Is middleware detection working properly?
   - Are there mobile-specific issues?

### **Investigation Priorities**
1. **Start with manual browser testing** - Verify pages load correctly
2. **Check browser console errors** - Look for JavaScript issues
3. **Test E2E bypass headers** - Verify middleware is working
4. **Research Playwright WebAuthn** - Find current best practices
5. **Simplify test approach** - Focus on core functionality first

---

## 📚 **Resources & References**

### **Current Test Files**
- `/web/tests/e2e/authentication-flow.spec.ts` - Core auth tests
- `/web/tests/e2e/rate-limit-bypass.spec.ts` - Rate limiting tests
- `/web/tests/e2e/webauthn-flow.spec.ts` - WebAuthn flow tests
- `/web/tests/e2e/webauthn-components.spec.ts` - WebAuthn UI tests
- `/web/tests/e2e/webauthn-api.spec.ts` - WebAuthn API tests

### **Key Implementation Files**
- `/web/app/login/page.tsx` - Login page implementation
- `/web/features/auth/pages/register/page.tsx` - Register page implementation
- `/web/middleware.ts` - Rate limiting and security middleware
- `/web/lib/testing/testIds.ts` - Test ID registry
- `/web/playwright.config.ts` - Test configuration

### **Documentation**
- [Playwright WebAuthn Testing](https://playwright.dev/docs/webauthn)
- [Playwright Virtual Authenticators](https://playwright.dev/docs/webauthn#virtual-authenticators)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## 🚀 **Next Steps**

1. **Immediate**: Manual testing of login/register pages
2. **Short-term**: Fix core authentication issues
3. **Medium-term**: Resolve WebAuthn testing infrastructure
4. **Long-term**: Achieve 100% test pass rate

**The goal is to get the core MVP authentication working first, then gradually expand test coverage.**

---

*This document will be updated as issues are resolved and new problems are discovered.*
