# Analytics Data Pipeline

_Last updated: January 2026 (real-data rollout, privacy filters, documentation refresh)_

This document is the canonical reference for how analytics data flows through the Choices platform—from event capture to privacy-aware aggregation, caching, delivery, and dashboards.

---

## 1. Data Flow Overview

```
User actions → Supabase tables (`votes`, `user_profiles`, `polls`)
        │
        ▼
PrivacyAwareQueryBuilder (filters opt-outs, enforces k-anonymity)
        │
        ├─ Aggregations (demographics, trust tiers, temporal trends)
        │
        ▼
Redis-backed cache (`analytics-cache.ts`) + Supabase fallbacks
        │
        ▼
API layer (`/api/analytics/**`, `/api/analytics/unified/[id]`)
        │
        ▼
Admin dashboards + widgets (`features/analytics/**`)
```

Key tables:
- `votes` — canonical engagement dataset (ballot choices, timestamps, poll references).
- `user_profiles` — source of trust tier, demographics, privacy settings (`privacy_settings.collectAnalytics`).
- `polls` — metadata used to gate analytics access and contextualize results.

---

## 2. Privacy & Consent Guarantees

Implemented in `web/features/analytics/lib/privacyFilters.ts`.

- **Opt-in only:** `PrivacyAwareQueryBuilder` hydrates queries with users whose `privacy_settings.collectAnalytics` is true (or unset) and excludes everyone else.
- **K-Anonymity:** `K_ANONYMITY_THRESHOLD` (currently 5) ensures categories with <5 users are removed before responses leave the server.
- **Audit logging:** Each privacy-aware query logs the opted-in population and removal counts via `logger.debug/info`.
- **Reusable helpers:**
  - `getPrivacyFilteredQuery()` – base filter for any Supabase table.
  - `getVoteAnalytics()` – date/poll-aware engagement queries.
  - `getDemographics()` – opt-in stats + trust tier snapshots.
  - `applyKAnonymity()` – final guardrail before returning aggregated metrics.

---

## 3. Aggregation & API Layer

| Endpoint | File | Notes |
| --- | --- | --- |
| Trust tiers | `web/app/api/analytics/trust-tiers/route.ts` | Supabase + privacy filters + Redis cache. Emits participation, engagement, bot-likelihood, insights, and cache metadata. |
| Unified analytics | `web/app/api/analytics/unified/[id]/route.ts` | Consolidates sentiment, bot detection, temporal, trust-tier, and geographic analyses. Supports AI provider selection, analysis windows, and caching hints. |
| Demographics | `web/app/api/analytics/demographics/route.ts` | Uses `PrivacyAwareQueryBuilder` to emit opt-in counts, tier breakdowns, and demographic summaries. |
| Temporal / Trends / Heatmaps | `web/app/api/analytics/{temporal,trends,poll-heatmap}/route.ts` | Each route relies on the privacy query builder + caching helpers to keep responses deterministic and safe. |
| Funnels | `web/app/api/analytics/funnels/route.ts` | Aggregates onboarding, poll-creation, and civic-action funnels with cached insights for dashboard widgets. |
| KPI | `web/app/api/analytics/kpi/route.ts` | Returns single KPI payloads (DAU, poll velocity, civic engagement) with percent deltas for cards. |

Implementation highlights:
- All analytics routes use `withErrorHandling` for consistent error envelopes and emit structured codes (`ANALYTICS_RPC_FAILED`, etc.).
- Admin gating flows through `canAccessAnalytics` / `logAnalyticsAccess` to record both denied and successful attempts.
- Responses attach cache headers via `applyAnalyticsCacheHeaders` so dashboards respect TTL/ETag contracts.

---

## 4. Caching & Performance

Primary helpers live in `web/lib/cache/analytics-cache.ts`:
- `CACHE_PREFIX` + `CACHE_TTL` — strongly typed namespaces so each route reuses the same key pattern/documented TTL.
- `getCached()` — wraps Redis `get/set` with JSON serialization, hit/miss/error metrics (per key + per namespace), and automatic fallbacks.
- `generateCacheKey()` — ensures per-route cache segregation (`analytics:trust-tiers`, `analytics:unified:<pollId>:<hash>`) with deterministic param ordering.
- `npm run cache:report` (from `web/`) — surfaces aggregated hit/miss/error stats per cache namespace so you can validate performance during load tests.

When Redis is unavailable, routes gracefully fall back to Supabase queries and include `cache.hit=false` in the payload so dashboards can show “fresh data” badges.

---

## 5. Funnels & KPI Delivery

### 5.1 Conversion Funnels
- Endpoint: `web/app/api/analytics/funnels/route.ts`
  - Funnels supported: `onboarding`, `poll-creation`, `civic-action`
  - Data sources: `onboarding_progress`, `polls`, `civic_actions`
  - Cached via `CACHE_PREFIX.FUNNELS` (10-minute TTL) with per-funnel cache keys
- Widget: `web/features/analytics/components/widgets/FunnelWidget.tsx`
  - Configurable via widget filters (`funnel`) and refresh interval
  - Registered in `widgetRegistry.tsx` under the `funnel` type for admin dashboards

### 5.2 KPI Cards
- Endpoint: `web/app/api/analytics/kpi/route.ts`
  - Metrics: `dau`, `polls_created`, `civic_engagement`
  - Uses `CACHE_PREFIX.KPI` (120-second TTL) for fast responses; computes change percentages vs previous windows
- Widget: `web/features/analytics/components/widgets/KpiCard.tsx`
  - Pulls the KPI API, shows delta badges, and respects widget filter (`metric`) + refresh interval
  - Default metric is DAU; additional metrics can be chosen per widget instance

## 6. Error Handling & Observability

- **Logging:** All routes log structured events (request parameters, timings, tier counts) via `logger.info`/`logger.error`.
- **Metrics:** Unified analytics measures runtime and includes `analysisWindow`, `methods`, and provider metadata in logs for traceability.
- **Error codes:** Follows the analytics-specific namespace (`ANALYTICS_RPC_FAILED`, `ANALYTICS_POLL_NOT_FOUND`, etc.) so Playwright + contract suites can assert deterministic failures.
- **Access logs:** `logAnalyticsAccess()` captures both denied and successful invocations with route identifiers for auditing.

---

## 7. Testing & Contracts

- **Contract tests:** `web/tests/contracts/analytics.contract.test.ts` exercises `/api/analytics/trust-tiers` and related routes with MSW-powered fixtures to guarantee schema compatibility.
- **Integration tests:** `web/tests/integration/feeds/FeedDataProvider.test.tsx` and analytics-specific suites validate store consumers against real endpoints.
- **Playwright:** `web/tests/e2e/specs/analytics-store.spec.ts`, `analytics-dashboard-axe.spec.ts`, and navigation specs load the admin analytics dashboard, assert widget hydration, and verify breadcrumb/navigation persistence.
- **Fixtures:** Shared payloads live under `web/tests/fixtures/api/**` and are reused across MSW + Playwright by toggling `PLAYWRIGHT_USE_MOCKS=1`.

---

## 8. Running Locally

1. **Start the dev server with harness flags:**
   ```bash
   cd web
   NEXT_PUBLIC_ENABLE_E2E_HARNESS=1 npm run dev
   ```
2. **Seed data (optional):** Use Supabase SQL snippets under `supabase/migrations/` to populate demo polls/trust tiers.
3. **Invoke APIs:**
   ```bash
   curl -H "Authorization: Bearer <admin-access-token>" \
     "http://localhost:3000/api/analytics/trust-tiers"
   ```
4. **Run contract + e2e suites:**
   ```bash
   npm run test:contracts -- analytics
   npm run test:e2e -- --project=chromium --grep @analytics
   ```

Troubleshooting tips:
- Ensure the Redis emulator (or production Redis URL) is available; fallback mode logs `cache.hit=false`.
- Verify your user has `app_metadata.role = "admin"` or an `@choices-admin.com` email; otherwise analytics routes return 403.
- Use `PLAYWRIGHT_USE_MOCKS=1` when you need deterministic MSW-backed results without real Supabase data.

---

## 9. References

- `web/app/api/analytics/**` — API implementations.
- `web/features/analytics/**` — Widgets, selectors, and admin dashboard surfaces.
- `web/lib/cache/analytics-cache.ts` — Redis helpers.
- `web/features/analytics/lib/privacyFilters.ts` — Privacy enforcement utilities.
- `docs/archive/reference/guides/ADMIN_GUIDE_ANALYTICS.md` — Admin dashboard usage guide.
- `docs/ROADMAP.md` / `docs/ROADMAP_SINGLE_SOURCE.md` — Tracking for analytics initiatives.

For questions or follow-ups, tag the Analytics & Admin working group in the roadmap and reference this document.

