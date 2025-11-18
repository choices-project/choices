# Secrets Management & Rotation Runbook

**Last Updated:** November 2025  
**Status:** Production Ready

This runbook provides procedures for rotating secrets, API keys, and credentials used by the Choices platform. Regular rotation is critical for security and compliance.

## Overview

The Choices platform uses several types of secrets:
- **Admin Keys:** Authentication for admin endpoints
- **Cron Secrets:** Authentication for scheduled jobs
- **API Keys:** Third-party service credentials (Resend, Upstash, Google Civic)
- **Database Credentials:** Supabase connection strings
- **Webhook Secrets:** Signing secrets for webhook verification

## Prerequisites

- Access to Vercel environment variables
- Access to Supabase dashboard (for database credentials)
- Admin access to third-party services (Resend, Upstash, etc.)
- Ability to coordinate deployments (zero-downtime rotation)

## Rotation Schedule

| Secret Type | Rotation Frequency | Priority |
|------------|-------------------|----------|
| `ADMIN_MONITORING_KEY` | Every 90 days | High |
| `CRON_SECRET` | Every 90 days | High |
| `RESEND_API_KEY` | Every 180 days | Medium |
| `RESEND_WEBHOOK_SECRET` | When compromised or every 180 days | High |
| `UPSTASH_REDIS_REST_TOKEN` | Every 180 days | Medium |
| `GOOGLE_CIVIC_API_KEY` | Every 365 days | Low |
| Database credentials | Every 90 days | High |

## General Rotation Procedure

### Pre-Rotation Checklist

- [ ] Identify all services using the secret
- [ ] Document current secret value (for rollback)
- [ ] Schedule maintenance window if needed
- [ ] Notify team members
- [ ] Prepare new secret value
- [ ] Test new secret in staging environment (if available)

### Rotation Steps

1. **Generate New Secret**
   - Use cryptographically secure random generator
   - Minimum length: 32 characters
   - Include alphanumeric and special characters

2. **Update in Vercel**
   - Log into [Vercel Dashboard](https://vercel.com/dashboard)
   - Navigate to project → Settings → Environment Variables
   - Update the secret value
   - Deploy to production (or wait for next deployment)

3. **Verify Functionality**
   - Test affected endpoints/services
   - Monitor error logs for authentication failures
   - Verify scheduled jobs still run

4. **Document Rotation**
   - Record rotation date
   - Update rotation schedule
   - Archive old secret (securely, for rollback if needed)

### Rollback Procedure

If rotation causes issues:
1. Revert to previous secret value in Vercel
2. Redeploy or wait for automatic deployment
3. Investigate root cause
4. Retry rotation after fixing issues

## Secret-Specific Rotation Procedures

### 1. ADMIN_MONITORING_KEY

**Used By:**
- `/api/admin/*` endpoints
- `/api/security/monitoring/*` endpoints
- Admin dashboard authentication

**Rotation Steps:**

1. **Generate New Key:**
   ```bash
   openssl rand -base64 32
   # or
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. **Update in Vercel:**
   - Project → Settings → Environment Variables
   - Find `ADMIN_MONITORING_KEY`
   - Update value
   - Save (triggers deployment)

3. **Update All Admin Clients:**
   - Update any scripts/tools using this key
   - Update monitoring dashboards
   - Update CI/CD pipelines that call admin endpoints

4. **Verify:**
   ```bash
   curl -H "x-admin-key: NEW_KEY" https://yourdomain.com/api/admin/candidates/stats
   ```

5. **Archive Old Key:**
   - Store securely for 7 days (for rollback)
   - Delete after verification period

**Zero-Downtime Rotation:**
- Vercel deployments are atomic
- Old key works until deployment completes
- No downtime if clients update simultaneously

### 2. CRON_SECRET

**Used By:**
- `/api/cron/candidate-reminders`
- `/api/cron/hashtag-trending-notifications`
- `/api/cron/backfill-poll-insights`

**Rotation Steps:**

1. **Generate New Secret:**
   ```bash
   openssl rand -base64 32
   ```

2. **Update in Vercel:**
   - Update `CRON_SECRET` environment variable
   - Save (triggers deployment)

3. **Update Cron Job Configuration:**
   - If using Vercel Cron Jobs, update the secret in cron configuration
   - If using external scheduler (e.g., GitHub Actions), update there
   - Verify cron jobs are configured to send the secret in requests

4. **Verify:**
   - Wait for next scheduled cron execution
   - Check logs for successful execution
   - Verify no authentication errors

**Important:** Coordinate with cron schedule to avoid missing executions during rotation.

### 3. RESEND_API_KEY

**Used By:**
- Email sending (`lib/integrations/email/resend.ts`)
- Candidate journey emails
- Transactional emails

**Rotation Steps:**

1. **Generate New Key in Resend:**
   - Log into [Resend Dashboard](https://resend.com/api-keys)
   - Click "Create API Key"
   - Name it (e.g., "Production Key - 2025-11")
   - Copy the key immediately (shown only once)

2. **Update in Vercel:**
   - Update `RESEND_API_KEY` environment variable
   - Save (triggers deployment)

3. **Verify:**
   - Send test email via admin interface
   - Check Resend dashboard for delivery status
   - Monitor error logs

4. **Revoke Old Key:**
   - After 24 hours of successful operation
   - Go to Resend Dashboard → API Keys
   - Revoke the old key

**Note:** Old key remains valid until revoked. Rotate during low-traffic period if possible.

### 4. RESEND_WEBHOOK_SECRET

**Used By:**
- `/api/webhooks/resend` endpoint
- Webhook signature verification

**Rotation Steps:**

1. **Generate New Secret in Resend:**
   - Log into [Resend Dashboard](https://resend.com/webhooks)
   - Edit webhook endpoint
   - Generate new signing secret
   - Copy the secret

2. **Update in Vercel:**
   - Update `RESEND_WEBHOOK_SECRET` environment variable
   - Save (triggers deployment)

3. **Verify:**
   - Trigger test webhook from Resend
   - Check webhook endpoint logs
   - Verify signature validation passes

4. **Update Resend Webhook Configuration:**
   - Ensure webhook URL matches production URL
   - Test webhook delivery

**Critical:** Webhook signature verification will fail if secret doesn't match. Coordinate carefully.

### 5. UPSTASH_REDIS_REST_TOKEN

**Used By:**
- Rate limiting system
- Cache operations (if implemented)

**Rotation Steps:**

1. **Generate New Token in Upstash:**
   - Log into [Upstash Console](https://console.upstash.com)
   - Navigate to your Redis database
   - Go to "REST API" section
   - Click "Create Token" or "Regenerate Token"
   - Copy the new token

2. **Update in Vercel:**
   - Update `UPSTASH_REDIS_REST_TOKEN` environment variable
   - Also update `UPSTASH_REDIS_REST_URL` if it changed
   - Save (triggers deployment)

3. **Verify:**
   - Test rate limiting on a test endpoint
   - Check rate limit metrics
   - Verify no rate limit errors

**Note:** Upstash tokens are long-lived. Only rotate if compromised or for compliance.

### 6. GOOGLE_CIVIC_API_KEY

**Used By:**
- `/api/v1/civics/address-lookup` endpoint
- District resolution service

**Rotation Steps:**

1. **Create New Key in Google Cloud:**
   - Log into [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to APIs & Services → Credentials
   - Create new API key or regenerate existing
   - Apply same restrictions (HTTP referrers, IP addresses)

2. **Update in Vercel:**
   - Update `GOOGLE_CIVIC_API_KEY` environment variable
   - Save (triggers deployment)

3. **Verify:**
   - Test address lookup endpoint
   - Check API quota usage
   - Monitor for errors

4. **Disable Old Key:**
   - After 7 days of successful operation
   - Disable (don't delete) old key in Google Cloud
   - Keep disabled for 30 days, then delete

### 7. Database Credentials (Supabase)

**Used By:**
- All database operations
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (rarely rotated)

**Rotation Steps:**

1. **Generate New Service Role Key:**
   - Log into [Supabase Dashboard](https://app.supabase.com)
   - Navigate to Project Settings → API
   - Click "Reset" next to service_role key
   - **WARNING:** This immediately invalidates the old key
   - Copy the new key immediately

2. **Update in Vercel:**
   - Update `SUPABASE_SERVICE_ROLE_KEY` environment variable
   - Save (triggers deployment)

3. **Verify:**
   - Test database operations
   - Check application logs
   - Verify no authentication errors

**Critical:** Service role key rotation causes immediate invalidation. Coordinate carefully and have rollback plan.

**Anon Key Rotation:**
- Anon key rotation is rare (only if compromised)
- Requires client-side deployment
- Coordinate with frontend deployment

## Automated Rotation (Where Possible)

### Vercel Environment Variables

Vercel doesn't support automated rotation, but you can:

1. **Set Up Reminders:**
   - Use calendar reminders for rotation dates
   - Set up GitHub Issues for rotation tasks
   - Use project management tools

2. **Rotation Scripts:**
   - Create scripts to generate new secrets
   - Store in secure password manager
   - Use for batch rotation

3. **Monitoring:**
   - Track secret age in monitoring dashboard
   - Set up alerts for approaching rotation dates
   - Document rotation history

### Third-Party Services

Some services support automated rotation:

- **Resend:** Manual rotation only
- **Upstash:** Manual rotation only
- **Google Cloud:** Supports key rotation policies (advanced)
- **Supabase:** Manual rotation only

## Monitoring & Alerts

### Automated Secret Age Tracking

A monitoring script is available to track secret rotation dates and alert when rotation is due:

**Script:** `web/scripts/operations/check-secret-rotation.ts`

**Usage:**
```bash
npm run secrets:check
```

**What it does:**
- Tracks last rotation date for each secret
- Calculates age and days until next rotation
- Alerts if secret is overdue or due soon (within 7 days)
- Exits with error code if any secrets are overdue
- Stores rotation history in `.secrets-rotation.json`

**Initial Setup:**
1. Run the script once to initialize tracking:
   ```bash
   npm run secrets:check
   ```
2. Update `.secrets-rotation.json` with actual last rotation dates:
   ```json
   {
     "ADMIN_MONITORING_KEY": {
       "secretName": "ADMIN_MONITORING_KEY",
       "lastRotation": "2025-11-17T00:00:00.000Z",
       "nextRotation": "2026-02-15T00:00:00.000Z",
       "maxAgeDays": 90
     }
   }
   ```

**Automated Monitoring:**

1. **Weekly Cron Job:**
   ```bash
   # Add to crontab or GitHub Actions
   0 9 * * 1 cd /path/to/project && npm run secrets:check
   ```

2. **CI Integration:**
   - Add to GitHub Actions weekly workflow
   - Fails build if secrets are overdue
   - Sends notifications to team

3. **Calendar Reminders:**
   - Set reminders 7 days before rotation due date
   - Include rotation checklist

4. **Monitoring Dashboard:**
   - Integrate script output into monitoring system
   - Display rotation status
   - Show last rotation date

## Emergency Rotation (Compromised Secrets)

If a secret is compromised:

1. **Immediate Actions:**
   - Rotate secret immediately (don't wait for maintenance window)
   - Revoke old secret in source system
   - Update Vercel environment variable
   - Deploy immediately

2. **Investigation:**
   - Review access logs
   - Check for unauthorized usage
   - Identify compromise vector
   - Document incident

3. **Post-Incident:**
   - Rotate all related secrets
   - Review security practices
   - Update rotation procedures if needed
   - Conduct security audit

## Best Practices

1. **Never Commit Secrets:**
   - Use environment variables only
   - Use `.env.example` for documentation
   - Never commit `.env` files

2. **Use Strong Secrets:**
   - Minimum 32 characters
   - Cryptographically random
   - Include alphanumeric + special characters

3. **Limit Secret Scope:**
   - Use least privilege principle
   - Rotate frequently
   - Monitor usage

4. **Document Everything:**
   - Record rotation dates
   - Document procedures
   - Keep runbook updated

5. **Test Rotations:**
   - Test in staging first
   - Have rollback plan
   - Coordinate with team

## Rotation Checklist Template

```markdown
## Secret Rotation: [SECRET_NAME] - [DATE]

### Pre-Rotation
- [ ] Identified all services using secret
- [ ] Generated new secret value
- [ ] Documented current secret (for rollback)
- [ ] Scheduled maintenance window (if needed)
- [ ] Notified team members

### Rotation
- [ ] Updated secret in Vercel
- [ ] Updated secret in source system (if applicable)
- [ ] Deployed to production
- [ ] Verified functionality
- [ ] Tested affected endpoints/services

### Post-Rotation
- [ ] Documented rotation date
- [ ] Archived old secret (securely)
- [ ] Updated rotation schedule
- [ ] Revoked old secret (after verification period)
- [ ] Updated any client configurations

### Verification
- [ ] All tests passing
- [ ] No errors in logs
- [ ] Services functioning normally
- [ ] Monitoring shows healthy status
```

## References

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Resend API Keys](https://resend.com/docs/dashboard/api-keys)
- [Upstash Redis](https://docs.upstash.com/redis)
- [Supabase API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Google Cloud API Keys](https://cloud.google.com/docs/authentication/api-keys)

