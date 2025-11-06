# Final 59 Endpoints - Modernization Plan

## Batch 1: Health & System (5 endpoints)
- `app/api/health/route.ts`
- `app/api/health/extended/route.ts`
- `app/api/admin/health/route.ts` ✅ Started
- `app/api/admin/schema-status/route.ts`
- `app/api/demographics/route.ts`

## Batch 2: Admin & Management (9 endpoints)
- `app/api/admin/dashboard/route.ts` ✅ Started
- `app/api/admin/feedback/route.ts`
- `app/api/admin/feedback/export/route.ts`
- `app/api/admin/feedback/[id]/status/route.ts`
- `app/api/admin/civics-ingest/route.ts`
- `app/api/admin/breaking-news/[id]/poll-context/route.ts`
- `app/api/admin/system-metrics/route.ts`
- `app/api/admin/performance/route.ts`
- `app/api/admin/performance/alerts/[alertId]/resolve/route.ts`
- `app/api/admin/site-messages/route.ts`

## Batch 3: Analytics (8 endpoints)
- `app/api/analytics/temporal/route.ts`
- `app/api/analytics/demographics/route.ts`
- `app/api/analytics/unified/[id]/route.ts`
- `app/api/analytics/trust-tiers/route.ts`
- `app/api/analytics/user/[id]/route.ts`
- `app/api/analytics/dashboard/layout/route.ts`
- `app/api/analytics/poll-heatmap/route.ts`
- `app/api/analytics/trends/route.ts`
- `app/api/analytics/poll/[id]/route.ts`

## Batch 4: WebAuthn & Security (8 endpoints)
- `app/api/v1/auth/webauthn/credentials/[id]/route.ts`
- `app/api/v1/auth/webauthn/trust-score/route.ts`
- `app/api/v1/auth/webauthn/native/register/options/route.ts`
- `app/api/v1/auth/webauthn/native/register/verify/route.ts`
- `app/api/v1/auth/webauthn/native/authenticate/options/route.ts`
- `app/api/v1/auth/webauthn/native/authenticate/verify/route.ts`
- `app/api/security/monitoring/route.ts`
- `app/api/security/monitoring/clear/route.ts`

## Batch 5: Civics & Geographic (4 endpoints)
- `app/api/v1/civics/address-lookup/route.ts`
- `app/api/v1/civics/coverage-dashboard/route.ts`
- `app/api/v1/civics/representative/[id]/route.ts`
- `app/api/v1/civics/heatmap/route.ts`

## Batch 6: Remaining (25 endpoints)
- Candidate journey endpoints (2)
- Contact threads
- User endpoints
- PWA endpoints
- Filing endpoints
- Shared endpoints
- Governance
- E2E endpoints
- Site messages
- And more...

**Strategy:** Modernize in batches, commit frequently, test as we go.

