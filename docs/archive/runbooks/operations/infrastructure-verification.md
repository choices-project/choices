# Infrastructure & Domain Verification Guide

**Last Updated:** December 2025  
**Status:** P0 Production Readiness  
**Purpose:** Verify Vercel environment configuration, document key rotation runbook, verify region settings, check secret management

## Overview

This guide provides a comprehensive checklist for verifying infrastructure configuration in production, including environment variables, secrets management, region settings, and key rotation procedures.

## Prerequisites

- Access to Vercel dashboard
- Access to production environment
- Admin credentials for verification
- Access to secret management systems

## 1. Environment Variables Verification

### Critical Variables Checklist

Verify all required environment variables are set in Vercel production environment:

#### Supabase Configuration
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Set and correct format (`https://[project-id].supabase.co`)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set and valid
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Set and valid (server-only, never exposed)

**Verification:**
```bash
# Check via Vercel CLI or dashboard
vercel env ls production | grep SUPABASE
```

#### Rate Limiting (Upstash Redis)
- [ ] `UPSTASH_REDIS_REST_URL` - Set and valid
- [ ] `UPSTASH_REDIS_REST_TOKEN` - Set and valid (server-only)

**Verification:**
```bash
# Test Redis connection
curl "$UPSTASH_REDIS_REST_URL/ping" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

#### Email Service (Resend)
- [ ] `RESEND_API_KEY` - Set and valid
- [ ] `RESEND_FROM_EMAIL` - Set to verified domain
- [ ] `RESEND_WEBHOOK_SECRET` - Set and matches Resend dashboard

**Verification:**
```bash
# Test Resend API
curl https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json"
```

#### Google Civic API
- [ ] `GOOGLE_CIVIC_API_KEY` - Set and valid
- [ ] API key restrictions configured (HTTP referrers or IP addresses)

#### Cron Jobs
- [ ] `CRON_SECRET` - Set and secure (32+ characters)
- [ ] Secret matches cron job configuration

#### Push Notifications (if enabled)
- [ ] `WEB_PUSH_VAPID_PUBLIC_KEY` - Set (server-side)
- [ ] `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` - Set (client-side, same value)
- [ ] `WEB_PUSH_VAPID_PRIVATE_KEY` - Set (server-only, secret)
- [ ] `WEB_PUSH_VAPID_SUBJECT` - Set to contact email

#### Admin & Security
- [ ] `ADMIN_MONITORING_KEY` - Set and secure
- [ ] `PRIVACY_PEPPER_CURRENT` - Set and secure (32+ bytes)

### Optional Variables
- [ ] `NEXT_PUBLIC_BASE_URL` - Set if needed for canonical URLs
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Set if using Sentry
- [ ] `NEXT_PUBLIC_APP_VERSION` - Set for version tracking

### Verification Script

Create a script to verify all critical variables:

```bash
#!/bin/bash
# verify-env-vars.sh

echo "Verifying critical environment variables..."

# Check Supabase
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_URL not set"
else
  echo "✅ NEXT_PUBLIC_SUPABASE_URL is set"
fi

# Check Redis
if [ -z "$UPSTASH_REDIS_REST_URL" ]; then
  echo "❌ UPSTASH_REDIS_REST_URL not set"
else
  echo "✅ UPSTASH_REDIS_REST_URL is set"
fi

# Add checks for all critical variables...
```

## 2. Secret Management

### Secret Storage
- [ ] All secrets stored in Vercel environment variables (not in code)
- [ ] No secrets committed to git repository
- [ ] Secrets are marked as "sensitive" in Vercel dashboard
- [ ] Different secrets for production vs staging/development

### Secret Access Control
- [ ] Only authorized team members have access to production secrets
- [ ] Secret access is logged and auditable
- [ ] Secrets are rotated regularly (see Key Rotation section)

### Secret Verification
- [ ] Verify secrets are not exposed in:
  - Client-side bundles (check `NEXT_PUBLIC_*` prefix usage)
  - Error messages
  - Logs
  - API responses

**Check for exposed secrets:**
```bash
# Search for potential secret exposure
grep -r "SUPABASE_SERVICE_ROLE_KEY\|UPSTASH_REDIS_REST_TOKEN\|RESEND_API_KEY" web/ --exclude-dir=node_modules
```

## 3. Region Settings

### Vercel Region Configuration
- [ ] Production region set appropriately (closest to users)
- [ ] Edge functions deployed to correct regions
- [ ] Database region matches application region (if applicable)

**Check Vercel region:**
```bash
# Via Vercel CLI
vercel project ls
vercel inspect [deployment-url]
```

### Performance Verification
- [ ] TTFB (Time to First Byte) acceptable for region
- [ ] Edge function latency acceptable
- [ ] Database connection latency acceptable

## 4. Key Rotation Runbook

### When to Rotate Keys

Rotate keys immediately if:
- Key is suspected to be compromised
- Employee with access leaves the team
- Key has been exposed in logs, commits, or public channels
- Regular rotation schedule (quarterly recommended)

### Rotation Procedure

#### 1. Supabase Service Role Key

**Steps:**
1. Generate new service role key in Supabase dashboard
2. Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel (production)
3. Verify application still works
4. Keep old key for 24-48 hours (rollback window)
5. Revoke old key after verification period

**Verification:**
```bash
# Test Supabase connection with new key
curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/test" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

#### 2. Upstash Redis Token

**Steps:**
1. Generate new REST token in Upstash dashboard
2. Update `UPSTASH_REDIS_REST_TOKEN` in Vercel
3. Verify rate limiting still works
4. Keep old token for 24-48 hours
5. Revoke old token after verification

**Verification:**
```bash
# Test Redis connection
curl "$UPSTASH_REDIS_REST_URL/ping" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

#### 3. Resend API Key

**Steps:**
1. Generate new API key in Resend dashboard
2. Update `RESEND_API_KEY` in Vercel
3. Verify email sending still works
4. Keep old key for 24-48 hours
5. Revoke old key after verification

**Verification:**
```bash
# Test Resend API
curl https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"test@yourdomain.com","to":"test@example.com","subject":"Test"}'
```

#### 4. Admin Monitoring Key

**Steps:**
1. Generate new key: `openssl rand -base64 32`
2. Update `ADMIN_MONITORING_KEY` in Vercel
3. Update any scripts/tools that use this key
4. Verify admin endpoints still work
5. Keep old key for 24-48 hours
6. Remove old key after verification

#### 5. Cron Secret

**Steps:**
1. Generate new secret: `openssl rand -base64 32`
2. Update `CRON_SECRET` in Vercel
3. Update cron job configuration (Vercel cron jobs)
4. Verify cron jobs still execute
5. Keep old secret for 24-48 hours
6. Remove old secret after verification

#### 6. Privacy Pepper

**Steps:**
1. Generate new pepper: `openssl rand -base64 32`
2. Update `PRIVACY_PEPPER_CURRENT` in Vercel
3. **Important:** This affects data hashing - coordinate with data migration if needed
4. Verify privacy features still work
5. Keep old pepper for extended period (data migration may be needed)

### Rotation Checklist Template

For each key rotation:

- [ ] Generate new key/secret
- [ ] Update in Vercel production environment
- [ ] Deploy and verify application works
- [ ] Test critical functionality
- [ ] Document rotation date and reason
- [ ] Keep old key for rollback window (24-48 hours)
- [ ] Revoke old key after verification
- [ ] Update team documentation

### Emergency Rollback

If rotation causes issues:

1. **Immediate:** Revert to old key in Vercel
2. **Investigate:** Identify why new key failed
3. **Fix:** Resolve issue before retrying rotation
4. **Document:** Record issue and resolution

## 5. Deployment Verification

### Post-Deployment Checks

After any deployment:

- [ ] Application builds successfully
- [ ] All environment variables accessible
- [ ] Database connections work
- [ ] External API connections work (Resend, Google Civic, etc.)
- [ ] Rate limiting works
- [ ] Health endpoints respond correctly

**Health Check:**
```bash
curl https://www.choices-app.com/api/health
```

### Monitoring

- [ ] Set up alerts for:
  - Missing environment variables
  - Failed deployments
  - High error rates
  - Database connection failures
  - External API failures

## 6. Documentation

### Required Documentation

- [ ] Environment variables documented in `docs/ENVIRONMENT_VARIABLES.md`
- [ ] Key rotation procedures documented
- [ ] Secret management procedures documented
- [ ] Region configuration documented
- [ ] Emergency contact information documented

## Success Criteria

Infrastructure is verified when:

- ✅ All critical environment variables are set
- ✅ Secrets are properly managed (not in code)
- ✅ Region settings are optimal
- ✅ Key rotation procedures are documented and tested
- ✅ Monitoring and alerts are configured
- ✅ Documentation is up to date

## Next Steps

1. Execute verification checklist
2. Document any issues found
3. Fix any configuration problems
4. Schedule regular verification (monthly recommended)
5. Schedule key rotation (quarterly recommended)

## References

- Environment Variables: `docs/ENVIRONMENT_VARIABLES.md`
- Vercel Documentation: https://vercel.com/docs
- Supabase Documentation: https://supabase.com/docs
- Upstash Documentation: https://docs.upstash.com

