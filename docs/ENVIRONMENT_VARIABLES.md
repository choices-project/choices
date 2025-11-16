# Environment Variables Documentation

**Last Updated:** November 16, 2025  
**Status:** ✅ Current (verified against codebase)

This document lists all environment variables required for the Choices application.

## Required Environment Variables

### Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL` (required)
  - Supabase project URL
  - Format: `https://[project-id].supabase.co`
  - Used by: All API routes, client components

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required)
  - Supabase anonymous/public key
  - Used for: Public read access to representative data
  - Security: Safe to expose in client-side code (protected by RLS)

- `SUPABASE_SERVICE_ROLE_KEY` (required)
  - Supabase service role key (standardized name)
  - Used for: Server-side operations requiring elevated permissions
  - Security: ⚠️ NEVER expose in client-side code, server-only
  - Note: Replaces legacy `SUPABASE_SECRET_KEY`

### Rate Limiting (Upstash Redis)
- `UPSTASH_REDIS_REST_URL` (required)
  - Upstash Redis REST API URL
  - Used by: Rate limiting system

- `UPSTASH_REDIS_REST_TOKEN` (required)
  - Upstash Redis REST API token
  - Security: ⚠️ Server-only, never expose

### Application Configuration
- `NEXT_PUBLIC_BASE_URL` (optional)
  - Base URL for the application
  - Used by: Admin monitoring, SSR/server actions
  - Default: Auto-detected from request headers

> Note: `NEXT_PUBLIC_APP_URL` is not required; rely on detected origins unless explicitly needed for canonical URLs in production.

- `NEXT_PUBLIC_APP_VERSION` (optional)
  - Application version string
  - Used by: Health checks, Sentry error tracking
  - Default: `1.0.0`

### Error Monitoring (Sentry)
- `NEXT_PUBLIC_SENTRY_DSN` (optional)
  - Sentry DSN for error tracking
  - Format: `https://[key]@[org].ingest.sentry.io/[project-id]`
  - Used by: Error monitoring and tracking

### Email Service (Resend)
- `RESEND_API_KEY` (required for candidate journey emails)
  - Resend API key for sending emails
  - Format: `re_...`
  - Used by: Candidate journey reminder emails
  - Security: ⚠️ Server-only, never expose
  - Get from: https://resend.com/api-keys

- `RESEND_FROM_EMAIL` (optional)
  - Email address to send from
  - Default: `onboarding@resend.dev` (test email)
  - Production: Should use verified domain (e.g., `candidates@yourdomain.com`)
  - Used by: Candidate journey emails

### Google Civic Information API
- `GOOGLE_CIVIC_API_KEY` (required for address lookup)
  - Google Civic Information API key for district resolution
  - Used by: `/api/v1/civics/address-lookup` endpoint (server proxy)
  - Client modules call the proxy; the key is never exposed to the browser
  - Endpoint includes per-IP rate limiting and a short-term response cache
  - Security: ⚠️ Server-only, never expose to client
  - Purpose: Convert address → district (no full addresses stored)
  - Get from: https://console.cloud.google.com/apis/credentials
  - Enable API: Google Civic Information API
  - Restrict key: HTTP referrers (production domain) OR IP addresses (server)
  - Note: Address is used once for lookup, only district is stored

### Cron Jobs
- `CRON_SECRET` (required for production)
  - Secret key for authenticating cron job requests
  - Used by: `/api/cron/candidate-reminders`, `/api/cron/hashtag-trending-notifications`
  - Security: Prevents unauthorized access to cron endpoints
  - Generate: `openssl rand -base64 32`
  - Must be set in Vercel environment variables

### Admin & Security
- `ADMIN_MONITORING_KEY` (optional)
  - Key required to access admin monitoring endpoints
  - Used by: `/api/security/monitoring/clear`
  - Security: ⚠️ Server-only, protects admin operations

### Maintenance Mode
- `NEXT_PUBLIC_MAINTENANCE` (optional)
  - Set to `1` to enable maintenance mode
  - Used by: Health check endpoint

## Environment Variable Usage by Feature

### Civics Integration
- **Read Operations**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Rate Limiting**: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **Write Operations**: `SUPABASE_SERVICE_ROLE_KEY` (via `getSupabaseAdminClient()`)
- **Address Lookup**: `GOOGLE_CIVIC_API_KEY` (converts address to district only)

### Authentication
- **Supabase Auth**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Session Management**: Automatically handled by Supabase client

### Monitoring & Admin
- **Sentry**: `NEXT_PUBLIC_SENTRY_DSN`
- **Admin Monitoring**: `ADMIN_MONITORING_KEY`, `NEXT_PUBLIC_BASE_URL`

## Security Best Practices

1. **Never expose secrets in client-side code**
   - `SUPABASE_SERVICE_ROLE_KEY` - Server-only
   - `UPSTASH_REDIS_REST_TOKEN` - Server-only
   - `ADMIN_MONITORING_KEY` - Server-only

2. **Public variables are safe for client**
   - `NEXT_PUBLIC_*` variables can be exposed in client-side bundles
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` is protected by RLS policies

3. **Use environment variable validation**
   - Check for required variables on startup
   - Provide clear error messages for missing variables

4. **Production vs Development**
   - Use `.env.local` for local development (git-ignored)
   - Configure production variables in deployment platform (Vercel, etc.)

## Verification Checklist

Before deploying to production, verify:

- [ ] All required variables are set in production environment
- [ ] No secret keys are exposed in client-side code
- [ ] Supabase RLS policies are properly configured
- [ ] Rate limiting Redis connection is working
- [ ] Error monitoring (Sentry) is configured (optional but recommended)

## Example `.env.local` (Development)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Google Civic API (Address Lookup)
GOOGLE_CIVIC_API_KEY=your-google-civic-api-key

# Email Service (Resend)
RESEND_API_KEY=re_your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_VERSION=1.0.0

# Cron Jobs
CRON_SECRET=your-cron-secret

# Optional: Sentry
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Optional: Admin
ADMIN_MONITORING_KEY=your-admin-key

# Privacy Peppers (Development)
PRIVACY_PEPPER_DEV=dev-pepper-for-hmac-hashing
```


