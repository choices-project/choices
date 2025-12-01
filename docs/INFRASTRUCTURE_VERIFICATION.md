# Infrastructure Verification & Key Rotation

**Date:** November 30, 2025  
**Status:** Documentation Complete

## Overview

This document provides verification procedures for Vercel environment configuration and references the key rotation runbook.

## Vercel Environment Verification

### Required Environment Variables

Verify all required environment variables are set in Vercel:

#### Production Environment
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Rate Limiting
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

# Email
RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_WEBHOOK_SECRET

# APIs
GOOGLE_CIVIC_API_KEY

# Security
CRON_SECRET
ADMIN_MONITORING_KEY

# Optional
NEXT_PUBLIC_SENTRY_DSN
NEXT_PUBLIC_APP_VERSION
NEXT_PUBLIC_BASE_URL
NEXT_PUBLIC_MAINTENANCE
```

### Verification Steps

1. **Access Vercel Dashboard**
   - Navigate to project settings
   - Go to Environment Variables section
   - Verify all required variables are present

2. **Check Environment-Specific Variables**
   - Production: All variables should be set
   - Preview: Critical variables should be set (Supabase, Redis)
   - Development: Local `.env.local` should be used

3. **Verify Variable Formats**
   - `NEXT_PUBLIC_SUPABASE_URL`: Should start with `https://` and end with `.supabase.co`
   - `RESEND_API_KEY`: Should start with `re_`
   - `UPSTASH_REDIS_REST_URL`: Should be a valid Upstash REST API URL
   - `CRON_SECRET`: Should be base64-encoded (32+ characters)

4. **Test Environment Access**
   ```bash
   # In Vercel CLI or dashboard
   vercel env ls
   vercel env pull .env.local  # For local testing
   ```

5. **Verify Region Configuration**
   - Check Vercel project settings → General
   - Verify deployment region matches requirements
   - Default: US (can be changed to EU or other regions)

### Health Check Verification

After deployment, verify endpoints:

```bash
# Basic health check
curl https://your-domain.com/api/health

# Civics service health
curl https://your-domain.com/api/health?service=civics

# Expected response: {"status":"ok","timestamp":"..."}
```

## Key Rotation Runbook

### Reference Documentation

The comprehensive secrets management and key rotation runbook is located at:
- **Location:** `docs/archive/runbooks/operations/secrets-management-rotation.md`
- **Status:** ✅ Complete (created November 2025)

### Quick Reference

The runbook covers:

1. **Rotation Procedures**
   - Admin keys (`ADMIN_MONITORING_KEY`)
   - Cron secrets (`CRON_SECRET`)
   - API keys (Resend, Upstash, Google Civic)
   - Database credentials (Supabase service role)
   - Webhook secrets (`RESEND_WEBHOOK_SECRET`)

2. **Rotation Schedules**
   - Admin keys: 90 days
   - Cron secrets: 180 days
   - API keys: 365 days (or per provider policy)
   - Database credentials: 90 days
   - Webhook secrets: 180 days

3. **Zero-Downtime Strategies**
   - Dual-key support where possible
   - Gradual rollout procedures
   - Rollback procedures

4. **Emergency Rotation**
   - Incident response procedures
   - Immediate rotation protocols
   - Post-rotation verification

5. **Monitoring & Alerts**
   - Automated secret age tracking
   - Alert thresholds
   - Rotation reminders

### Automated Monitoring

The runbook includes an automated monitoring script:
- **Script:** `scripts/operations/check-secret-rotation.ts`
- **Command:** `npm run secrets:check`
- **Purpose:** Tracks secret age and alerts when rotation is due

## Vercel-Specific Configuration

### Deployment Regions

Verify deployment region in Vercel:
1. Project Settings → General
2. Check "Deployment Region"
3. Default: US (can be changed to EU, Asia, etc.)

### Build Settings

Verify build configuration:
- **Framework Preset:** Next.js
- **Build Command:** `cd web && npm run build`
- **Output Directory:** `web/.next`
- **Install Command:** `cd web && npm install`

### Environment Variable Scopes

Ensure variables are scoped correctly:
- **Production:** Production deployments only
- **Preview:** Preview deployments (PRs, branches)
- **Development:** Local development (`.env.local`)

## Verification Checklist

- [ ] All required environment variables set in Vercel
- [ ] Variable formats verified
- [ ] Region configuration verified
- [ ] Health check endpoints responding
- [ ] Key rotation runbook reviewed
- [ ] Monitoring script configured (if applicable)
- [ ] Emergency rotation procedures understood
- [ ] Team access to Vercel dashboard verified

## Related Documentation

- `docs/ENVIRONMENT_VARIABLES.md` - Complete environment variable reference
- `docs/archive/runbooks/operations/secrets-management-rotation.md` - Key rotation runbook
- `docs/DEPLOYMENT.md` - Deployment procedures
- `docs/ROADMAP_SINGLE_SOURCE.md` - Main roadmap

## Notes

- Key rotation runbook was created in November 2025 and is comprehensive
- Vercel environment variables should be reviewed quarterly
- All secrets should follow rotation schedules in the runbook
- Emergency rotation procedures should be tested annually

