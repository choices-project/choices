# Environment Variables Documentation

**Last Updated:** January 29, 2025  
**Status:** ✅ Production-Ready Reference

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

- `SUPABASE_SECRET_KEY` (required)
  - Supabase service role key
  - Used for: Server-side operations requiring elevated permissions
  - Security: ⚠️ NEVER expose in client-side code, server-only

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

- `NEXT_PUBLIC_APP_URL` (optional)
  - Application public URL
  - Used by: PWA manifest, canonical URLs
  - Default: Auto-detected

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

### Cron Jobs
- `CRON_SECRET` (optional but recommended)
  - Secret key for authenticating cron job requests
  - Used by: `/api/cron/candidate-reminders`
  - Security: Prevents unauthorized access to cron endpoints
  - Generate: Random secure string

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
- **Write Operations**: `SUPABASE_SECRET_KEY` (via `getSupabaseServerClient()`)

### Authentication
- **Supabase Auth**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Session Management**: Automatically handled by Supabase client

### Monitoring & Admin
- **Sentry**: `NEXT_PUBLIC_SENTRY_DSN`
- **Admin Monitoring**: `ADMIN_MONITORING_KEY`, `NEXT_PUBLIC_BASE_URL`

## Security Best Practices

1. **Never expose secrets in client-side code**
   - `SUPABASE_SECRET_KEY` - Server-only
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
SUPABASE_SECRET_KEY=your-service-role-key

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_VERSION=1.0.0

# Optional: Sentry
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Optional: Admin
ADMIN_MONITORING_KEY=your-admin-key
```


