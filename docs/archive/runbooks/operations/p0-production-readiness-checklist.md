# P0 Production Readiness Checklist

**Last Updated:** December 2025  
**Status:** Active Verification  
**Purpose:** Comprehensive checklist for all P0 production readiness items

## Overview

This checklist consolidates all P0 (blocking) production readiness items that must be completed before launch. Each item includes verification steps and success criteria.

## 1. Infrastructure & Domain Verification

**Status:** ⏭️ Pending Verification  
**Owner:** DevOps/Infrastructure Team  
**Reference:** `docs/archive/runbooks/operations/infrastructure-verification.md`

### Checklist
- [ ] All critical environment variables verified in Vercel
- [ ] Secret management verified (no secrets in code)
- [ ] Region settings verified and optimal
- [ ] Key rotation runbook documented and tested
- [ ] Deployment verification completed
- [ ] Monitoring and alerts configured

**Action Required:** Execute infrastructure verification guide

---

## 2. Email Deliverability - DMARC DNS Configuration

**Status:** ⚠️ Manual DNS Setup Required  
**Owner:** DevOps/Infrastructure Team  
**Reference:** `docs/archive/runbooks/operations/email-deliverability-setup.md`

### Current Status
- ✅ Webhook signature verification implemented in code
- ✅ DNS configuration documented (SPF, DKIM, DMARC)
- ✅ Email deliverability setup guide updated
- ⚠️ **Action Required:** Configure DMARC DNS records (manual DNS setup)

### Checklist
- [ ] Access domain DNS provider (Cloudflare, GoDaddy, Namecheap, Route 53, etc.)
- [ ] Add SPF record (if not already present)
- [ ] Add DKIM records (provided by Resend)
- [ ] **Add DMARC record** (TXT record at `_dmarc` subdomain)
  - Start with `p=none` (monitoring only)
  - Set `rua=mailto:dmarc@yourdomain.com` (aggregate reports)
  - Set `ruf=mailto:dmarc-forensics@yourdomain.com` (forensic reports, optional)
- [ ] Verify DNS records using online tools:
  - [MXToolbox SPF Check](https://mxtoolbox.com/spf.aspx)
  - [DKIM Validator](https://dkimvalidator.com/)
  - [DMARC Analyzer](https://dmarcian.com/dmarc-xml-parser/)
- [ ] Wait for DNS propagation (24-48 hours)
- [ ] Verify domain in Resend dashboard
- [ ] Test email delivery to major providers (Gmail, Outlook, Yahoo)
- [ ] Monitor DMARC reports (check email inbox for reports)
- [ ] After monitoring period, upgrade to `p=quarantine` or `p=reject`

### DMARC Record Example

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@choices-app.com; pct=100
TTL: 3600
```

**Action Required:** Configure DMARC DNS record in domain registrar/DNS provider

---

## 3. Admin Observability - Field-Level Revert Verification

**Status:** ⏭️ Production Testing Required  
**Owner:** Backend/Admin Team  
**Reference:** `web/app/api/admin/audit/candidates/route.ts`, `web/app/api/admin/audit/representatives/route.ts`

### Current Status
- ✅ Audit list/diff functionality enhanced
- ✅ Both endpoints return structured diff information
- ✅ Revert functionality already implemented
- ⚠️ **Action Required:** Test revert functionality in production

### Checklist
- [ ] Access production admin dashboard
- [ ] Navigate to audit logs (candidates or representatives)
- [ ] Identify a test audit entry with a change
- [ ] Verify diff information displays correctly (old_value → new_value)
- [ ] Execute revert operation for a test field
- [ ] Verify data integrity after revert:
  - [ ] Original value restored correctly
  - [ ] No data corruption
  - [ ] Related records unaffected
  - [ ] Audit log entry created for revert
- [ ] Test revert for different field types:
  - [ ] String fields
  - [ ] Numeric fields
  - [ ] Boolean fields
  - [ ] Date fields
  - [ ] JSON fields
- [ ] Test error handling:
  - [ ] Invalid audit entry ID
  - [ ] Missing permissions
  - [ ] Concurrent modifications
- [ ] Document any issues found
- [ ] Create runbook for revert procedure

**Action Required:** Execute production testing of revert functionality

---

## 4. Security Baseline - Rate Limit Production Verification

**Status:** ⏭️ Execution Required  
**Owner:** Security/Backend Team  
**Reference:** `docs/archive/runbooks/operations/rate-limit-production-verification.md`

### Current Status
- ✅ Comprehensive verification guide created
- ✅ Includes verification checklist, testing scripts, monitoring setup
- ⚠️ **Action Required:** Execute verification in production environment

### Checklist
- [ ] Review rate limit verification guide
- [ ] Verify Upstash Redis configuration
- [ ] Test auth endpoint rate limiting (10 requests per 15 minutes)
- [ ] Test registration endpoint rate limiting (5 requests per hour)
- [ ] Verify rate limit headers in responses
- [ ] Check Upstash Redis for rate limit data
- [ ] Verify violation tracking
- [ ] Test Redis failure fallback
- [ ] Verify IP address handling
- [ ] Set up monitoring and alerting
- [ ] Document actual limits in production
- [ ] Schedule regular verification (monthly)

**Action Required:** Execute rate limit verification using provided guide

---

## 5. Security Baseline - Input Validation Audit

**Status:** ⏭️ Audit Required  
**Owner:** Security/Backend Team

### Checklist
- [ ] Audit all API endpoints for input validation
- [ ] Create inventory of all API routes
- [ ] For each endpoint, verify:
  - [ ] Required fields validated
  - [ ] Field types validated (string, number, boolean, etc.)
  - [ ] Field lengths validated (min/max)
  - [ ] Field formats validated (email, URL, etc.)
  - [ ] Enum values validated
  - [ ] SQL injection prevention
  - [ ] XSS prevention
  - [ ] CSRF protection (for state-changing operations)
- [ ] Document missing validation
- [ ] Add validation where missing
- [ ] Add tests for validation
- [ ] Verify validation in production

### Priority Endpoints to Audit

1. **Authentication:**
   - `/api/auth/login`
   - `/api/auth/register`
   - `/api/auth/reset-password`

2. **User Input:**
   - `/api/feedback`
   - `/api/contact/messages`
   - `/api/contact/threads`
   - `/api/profile`

3. **Admin:**
   - `/api/admin/users`
   - `/api/admin/audit/*`
   - `/api/admin/feedback/*`

4. **Civics:**
   - `/api/v1/civics/address-lookup`
   - `/api/v1/civics/by-state`

**Action Required:** Execute comprehensive input validation audit

---

## 6. Security Baseline - Sensitive Log Audit

**Status:** ⏭️ Audit Required  
**Owner:** Security/Backend Team

### Checklist
- [ ] Audit all logging statements for sensitive data
- [ ] Check for exposure of:
  - [ ] Passwords (even hashed)
  - [ ] API keys
  - [ ] Tokens (auth tokens, session tokens)
  - [ ] Personal information (SSN, credit cards)
  - [ ] Email addresses (in some contexts)
  - [ ] IP addresses (in some contexts)
  - [ ] Full request/response bodies
- [ ] Implement redaction for sensitive data:
  - [ ] Replace with `[REDACTED]` or `***`
  - [ ] Use structured logging with field-level redaction
  - [ ] Hash sensitive values for debugging
- [ ] Verify error messages don't expose sensitive data
- [ ] Check exception stack traces
- [ ] Review third-party logging services (Sentry, etc.)
- [ ] Document logging standards
- [ ] Add linting rules to prevent sensitive data logging

### Common Patterns to Check

```typescript
// ❌ BAD - Exposes sensitive data
logger.error('Login failed', { email, password });

// ✅ GOOD - Redacts sensitive data
logger.error('Login failed', { email, password: '[REDACTED]' });

// ❌ BAD - Exposes tokens
logger.debug('Request', { headers });

// ✅ GOOD - Redacts tokens
logger.debug('Request', { 
  headers: { 
    ...headers, 
    authorization: '[REDACTED]' 
  } 
});
```

**Action Required:** Execute comprehensive sensitive log audit

---

## 7. Testing & CI - Contract Tests Verification

**Status:** ⏭️ CI Verification Required  
**Owner:** QA/Backend Team  
**Reference:** `web/tests/contracts/`

### Current Status
- ✅ Contract tests exist for multiple routes
- ⚠️ **Action Required:** Verify contract tests passing in CI

### Checklist
- [ ] Review CI configuration (`.github/workflows/test.yml`)
- [ ] Verify contract tests run in CI pipeline
- [ ] Check contract tests for candidate routes:
  - [ ] `candidate-journey.contract.test.ts`
  - [ ] `cron-candidate-reminders.contract.test.ts`
- [ ] Check contract tests for civics routes:
  - [ ] `civics.contract.test.ts`
  - [ ] `civics-address.contract.test.ts`
  - [ ] `civics-elections.contract.test.ts`
- [ ] Check contract tests for admin routes:
  - [ ] `admin-breaking-news.contract.test.ts`
- [ ] Verify all contract tests pass in CI
- [ ] Fix any failing contract tests
- [ ] Ensure fixtures are shared across MSW/Playwright
- [ ] Document contract test coverage

**Action Required:** Verify contract tests run and pass in CI

---

## 8. Testing & CI - E2E Smoke Tests Verification

**Status:** ⏭️ CI Verification Required  
**Owner:** QA/Backend Team  
**Reference:** `web/tests/e2e/specs/production/production-smoke.spec.ts`, `web/tests/e2e/specs/smoke-critical.spec.ts`

### Current Status
- ✅ Critical smoke tests exist
- ✅ Production smoke tests exist
- ⚠️ **Action Required:** Verify critical E2E smoke tests passing in CI

### Checklist
- [ ] Review CI configuration for E2E tests
- [ ] Verify smoke tests run in CI pipeline
- [ ] Check critical smoke tests:
  - [ ] `smoke-critical.spec.ts` - Critical user journeys
  - [ ] `production-smoke.spec.ts` - Production verification
- [ ] Verify smoke tests cover:
  - [ ] Authentication flow
  - [ ] Dashboard functionality
  - [ ] Feed loading
  - [ ] API endpoints
  - [ ] Security headers
  - [ ] Error handling
- [ ] Ensure smoke tests run against production or staging
- [ ] Fix any failing smoke tests
- [ ] Document smoke test coverage
- [ ] Set up alerts for smoke test failures

**Action Required:** Verify E2E smoke tests run and pass in CI

---

## Summary

### Completed ✅
- Email deliverability code/documentation
- Admin audit list/diff functionality
- Rate limit verification guide
- Contract tests exist
- E2E smoke tests exist

### Pending ⏭️
- Infrastructure verification execution
- DMARC DNS configuration (manual)
- Field-level revert production testing
- Rate limit production verification execution
- Input validation audit
- Sensitive log audit
- Contract tests CI verification
- E2E smoke tests CI verification

## Next Steps

1. Assign owners to each pending item
2. Execute verification for each item
3. Document findings and fixes
4. Update status as items are completed
5. Schedule regular re-verification

## References

- Infrastructure Verification: `docs/archive/runbooks/operations/infrastructure-verification.md`
- Email Deliverability: `docs/archive/runbooks/operations/email-deliverability-setup.md`
- Rate Limit Verification: `docs/archive/runbooks/operations/rate-limit-production-verification.md`
- Roadmap: `docs/ROADMAP_SINGLE_SOURCE.md`

