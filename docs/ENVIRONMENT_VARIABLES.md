# Environment Variables Documentation

**Last Updated:** December 2024  
**Status:** ✅ **ALL CRITICAL VARIABLES CONFIGURED** (Production Ready)

This document lists all environment variables required for the Choices application.

> **Current Status:** All 6 critical (P0) environment variables are configured in Vercel.  
> See `ENV_VARS_STATUS.md` in project root for complete audit and verification checklist.

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
  - CI behaviour: In GitHub Actions and test environments, if these Supabase variables are not set, the server client falls back to test-only placeholder values so builds and tests do not fail purely on missing secrets. **Production and staging must still provide real values.**

> CI-only defaults (for reference):
>
> - `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co`
> - `NEXT_PUBLIC_SUPABASE_ANON_KEY=fake-dev-key-for-ci-only`
> - `SUPABASE_SERVICE_ROLE_KEY=dev-only-secret`


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

- `RESEND_WEBHOOK_SECRET` (required for production webhook security)
  - Webhook signing secret for Resend webhook verification
  - Used by: `/api/webhooks/resend` endpoint for signature verification
  - Security: ⚠️ Server-only, never expose
  - Get from: Resend Dashboard → Webhooks → Webhook Settings
  - Purpose: Verifies webhook requests are from Resend (prevents spoofing)
  - See: `docs/archive/runbooks/operations/email-deliverability-setup.md`

### Google Civic Information API
- `GOOGLE_CIVIC_API_KEY` (required for address lookup)
  - Google Civic Information API key for district resolution
  - Used by: `/api/v1/civics/address-lookup` endpoint (server proxy)
  - Client modules call the proxy; the key is never exposed to the browser
  - Endpoint includes per-IP rate limiting and a short-term response cache (see `docs/CIVICS_ADDRESS_LOOKUP.md`)
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

### Push Notifications (PWA)
- `WEB_PUSH_VAPID_PUBLIC_KEY` (required for push notifications - server-side)
  - VAPID public key for web push notifications
  - Format: Base64 URL-safe encoded string
  - Used by: Server-side sending endpoint
  - Security: ✅ Safe to expose (public key)
  - Used in: `/api/pwa/notifications/send` endpoint
  - Note: For client-side usage, you need `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` (see below)
  - Get from: Generate using `web-push` library (see VAPID key generation guide)

- `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` (required for push notifications - client-side)
  - VAPID public key for web push notifications (exposed to browser)
  - Format: Base64 URL-safe encoded string
  - Used by: Client-side push subscription
  - Security: ✅ Safe to expose in client-side code (public key)
  - Used in: `NotificationPreferences` component, service worker registration
  - Note: In Next.js, only `NEXT_PUBLIC_*` variables are available in browser code
  - Recommendation: Set the same value as `WEB_PUSH_VAPID_PUBLIC_KEY` but with `NEXT_PUBLIC_` prefix
  - Get from: Generate using `web-push` library (same key as `WEB_PUSH_VAPID_PUBLIC_KEY`)

- `WEB_PUSH_VAPID_PRIVATE_KEY` (required for push notifications)
  - VAPID private key for web push notifications
  - Format: Base64 URL-safe encoded string
  - Used by: Server-side push notification sending
  - Security: ⚠️ NEVER expose in client-side code, server-only
  - Used in: `/api/pwa/notifications/send` endpoint
  - Note: Accepts `VAPID_PRIVATE_KEY` as fallback for compatibility
  - Get from: Generate using `web-push` library (see VAPID key generation guide)

- `WEB_PUSH_VAPID_SUBJECT` (required for push notifications)
  - VAPID subject (contact email or mailto URL)
  - Format: Email address (e.g., `support@choices.dev`) or `mailto:` URL (e.g., `mailto:support@choices.dev`)
  - Used by: VAPID configuration validation
  - Default: `mailto:support@choices.dev`
  - Alternative: Can use `VAPID_CONTACT_EMAIL` as fallback
  - Note: Email addresses are automatically converted to `mailto:` format if needed

**VAPID Key Generation:**
```bash
# Install web-push globally (if not already installed)
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys

# Output will show:
# Public Key: [long base64 string]
# Private Key: [long base64 string]
```

**Production Setup:**
1. Generate unique VAPID keys for production
2. Set `WEB_PUSH_VAPID_PUBLIC_KEY` in Vercel (server-side, used by send endpoint)
3. Set `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` in Vercel (client-side, same value as above)
4. Set `WEB_PUSH_VAPID_PRIVATE_KEY` in Vercel (server-only, secret)
5. Set `WEB_PUSH_VAPID_SUBJECT` to your production contact email (e.g., `support@choices.dev` - code will add `mailto:` if needed)
6. Verify keys are configured before enabling push notifications feature flag

**Note:** 
- VAPID keys are domain-specific. Use the same keys across environments if using the same domain, or generate separate keys for staging/production if using different domains.
- **Important:** In Next.js, only `NEXT_PUBLIC_*` variables are exposed to the browser. You need both `WEB_PUSH_VAPID_PUBLIC_KEY` (server) and `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` (client) with the same value.
- The subject can be either an email address (e.g., `support@choices.dev`) or a `mailto:` URL (e.g., `mailto:support@choices.dev`) - the code automatically normalizes email addresses to `mailto:` format.

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

### Push Notifications (PWA)
- **Client Subscription**: `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` (required for browser access)
- **Server Sending**: `WEB_PUSH_VAPID_PUBLIC_KEY` (server-side), `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_VAPID_SUBJECT`
- **Feature Flag**: `PUSH_NOTIFICATIONS: true` ✅ (enabled in feature-flags.ts)
- **Dependencies**: `PWA` feature flag (always enabled)
- **Note**: Public key must be set in both `WEB_PUSH_VAPID_PUBLIC_KEY` (server) and `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` (client) with the same value

### Authentication
- **Supabase Auth**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Session Management**: Automatically handled by Supabase client
 - `AUTH_RATE_LIMIT_ENABLED` (optional)
   - Controls whether the **login API** (`/api/auth/login`) enforces per‑IP rate limiting.
   - When set to `1`, email/password logins are limited to **10 attempts per 15 minutes per IP**.
   - When unset or `0`, login rate limiting is **disabled** (recommended while iterating on UX or debugging auth issues).
   - Always **disabled automatically** in E2E harness mode (`NEXT_PUBLIC_ENABLE_E2E_HARNESS=1`) to keep tests deterministic.

### Monitoring & Admin

### Hashtag Analytics
- **Supabase Client (server-side analytics)**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - The advanced hashtag analytics module (`web/features/hashtags/lib/hashtag-analytics.ts`) now creates its Supabase client lazily and will throw a clear runtime error **only when analytics functions are called** without proper Supabase configuration.
  - This allows Next.js builds and static generation (including CI and E2E builds) to succeed even if Supabase env vars are unset, while still enforcing correct configuration in real environments that actually use these analytics.
- **Sentry**: `NEXT_PUBLIC_SENTRY_DSN`
- **Admin Monitoring**: `ADMIN_MONITORING_KEY`, `NEXT_PUBLIC_BASE_URL`

## Security Best Practices

1. **Never expose secrets in client-side code**
   - `SUPABASE_SERVICE_ROLE_KEY` - Server-only
   - `UPSTASH_REDIS_REST_TOKEN` - Server-only
   - `WEB_PUSH_VAPID_PRIVATE_KEY` - Server-only ⚠️
   - `ADMIN_MONITORING_KEY` - Server-only

2. **Public variables are safe for client**
   - `NEXT_PUBLIC_*` variables can be exposed in client-side bundles
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` is protected by RLS policies

3. **Use environment variable validation**
   - Check for required variables on startup
   - Provide clear error messages for missing variables
   - CI/test exception: Supabase server utilities intentionally fall back to safe test-only values when `CI=true` or `NODE_ENV=test` so that pipelines do not fail solely due to missing secrets. Do **not** rely on these values outside CI/test.

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
- [ ] **Push Notifications**: VAPID keys generated and configured (if using push notifications)
  - [ ] `WEB_PUSH_VAPID_PUBLIC_KEY` set in Vercel (server-side)
  - [ ] `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` set in Vercel (client-side, same value as above)
  - [ ] `WEB_PUSH_VAPID_PRIVATE_KEY` set in Vercel (secret, server-only)
  - [ ] `WEB_PUSH_VAPID_SUBJECT` set to production contact email (e.g., `support@choices.dev` or `mailto:support@choices.dev`)

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

# Push Notifications (PWA) - Optional for development
# Note: Public key must be set in both variables with the same value
WEB_PUSH_VAPID_PUBLIC_KEY=your-vapid-public-key
NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY=your-vapid-public-key
WEB_PUSH_VAPID_PRIVATE_KEY=your-vapid-private-key
WEB_PUSH_VAPID_SUBJECT=support@choices.dev
# Note: WEB_PUSH_VAPID_SUBJECT can be email (support@choices.dev) or mailto: URL (mailto:support@choices.dev)
```


