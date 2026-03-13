---
title: Performance Utilities Playbook
status: ACTIVE
updated: 2025-11-17
owner: platform-observability
---

# Performance Utilities Playbook

This guide explains _when_ and _how_ to instrument UI code with the shared
performance helpers (`performanceMetrics`, `performance-utils`,
`performanceMonitorService`, and the `performanceStore`). It also covers the
client ➜ Supabase ingestion path so component authors know what happens to the
metrics they emit.

## TL;DR Checklist

1. **Decide what you need to learn.** Pick the utility that matches the question
   you are trying to answer (e.g. `measureAsync` for data fetch durations,
   `performanceMetrics.addMetric` for arbitrary counters, `createLazyComponent`
   for bundle splits).
2. **Instrument close to the user interaction.** Prefer colocating metrics with
   the component/hook that owns the work rather than central catch‑alls.
3. **Use the store for client buffering.** Metric helpers push into
   `performanceStore`. The store now auto-syncs via
   `/api/analytics/performance-metrics` and respects privacy defaults (IP
   anonymization, consent flags).
4. **Stay within guardrails.** Keep metric names ≤64 chars, metadata keys ≤32
   chars and values JSON-serializable. Avoid PII and strip IDs that could deanonymize
   voters/candidates.
5. **Verify locally.** Run `npm run bundle:report` for bundle regressions and
   check `_reports/bundle-monitor.json`. For metric ingestion, call
   `usePerformanceActions().syncMetrics()` after driving the UI to confirm
   2xx responses.

## Utility Selection Matrix

| Question | Recommended Helper | Notes |
| --- | --- | --- |
| “How long did this promise take?” | `performanceUtils.measureAsync` | Wrap async fetch/mutation calls. Emits log + metric. |
| “How many times is this function hit?” | `performanceMetrics.addMetric` | Use descriptive names e.g. `analytics-panel-filter-change`. |
| “How do I avoid hammering the network?” | `performanceUtils.debounce` / `throttle` | Pair with `memoize` / `TTLCache` when caching results. |
| “When should this poll refresh?” | `createAutoRefreshTimer` or `OptimizedPollService` | Yields consistent timers plus metric hooks. |
| “What about bundle size?” | `bundleMonitor` + `scripts/performance/bundle-check.ts` | Fails CI when chunks exceed thresholds. |
| “Need lazy routes/components?” | `lib/performance/lazy-loading.ts` + `utils/code-splitting.ts` | Automatically emits `*-split-*` metrics. |
| “Persist client metrics for admins?” | `performanceStore.syncMetrics()` | Sends buffered store data to Supabase. |

## Instrumentation Patterns

### 1. High-level component timing

```tsx
import { performanceMetrics } from '@/lib/performance/performance-metrics';

useEffect(() => {
  const marker = performance.now();
  return () => {
    performanceMetrics.addMetric('admin-dashboard-unmount', performance.now() - marker);
  };
}, []);
```

Pair this with the store’s `recordCustomMetric` if you need the value in local
Zustand consumers (e.g. to show a little sparkline inside the UI).

### 2. Async data fetch wrappers

```ts
import { performanceUtils } from '@/utils/performance-utils';

const data = await performanceUtils.measureAsync(
  () => fetchPollInsights(pollId),
  'poll-insights-fetch'
);
```

The helper logs success/failure with duration while letting you keep the original code readable.

### 3. Auto-synced client metrics

```ts
import { usePerformanceActions } from '@/lib/stores/performanceStore';

const { recordCustomMetric, syncMetrics } = usePerformanceActions();

recordCustomMetric('analytics-filter-change', 1, 'count', { filterId });
// optional manual sync (store also auto-syncs on thresholds)
void syncMetrics();
```

The store automatically exports buffered metrics via
`performanceMetrics.exportMetrics()` and POSTs to
`/api/analytics/performance-metrics`. The API:

- rate limits at 8 uploads / 5 minutes per IP (Upstash-backed),
- anonymizes IPs when `PRODUCTION_SECURITY_CONFIG.privacy.anonymizeIPs` is true,
- strips/sanitizes bundle + resource arrays and stores a representative sample in `analytics_events`.

### 4. Lazy loading & code splitting

- Prefer `createLazyComponent` / `createRouteBasedLazyLoading` helpers so the
  resulting `lazy-*` metrics stay consistent.
- If you genuinely need `React.lazy`, still emit a manual metric such as
  `performanceMetrics.addMetric('wizard-step-lazy-load', duration)`.

### 5. Polling / auto refresh

Use `createAutoRefreshTimer` (same helper the store uses) to guarantee cleanup.
Emit `recordResourceMetric` for each refresh so threshold alerts can trigger if
requests pile up.

## Author Responsibilities

- **Consent & privacy:** Only record metrics once the user has opted into
  performance tracking (check `useAnalyticsStore().preferences.performanceTracking` or honor per-feature flags).
- **Data minimization:** No e-mail addresses, no Supabase UUIDs. If you must tag a
  candidate/poll, prefer hashed IDs (e.g. `hashId(pollId)`).
- **Naming conventions:** Use kebab-case or colon separated groups, e.g.
  `candidate-profile:hero-load`. Keeps admin dashboards tidy.
- **Sync awareness:** High-volume components (live dashboards) can opt-out via
  `usePerformanceActions().setSyncEnabled(false)` and use their own batching
  strategy. Otherwise rely on the store’s auto-sync window.

## Observability Pipeline Reference

1. Component code calls helpers (`performanceUtils`, `performanceMetrics`,
   `performanceStore`).
2. `performanceStore` buffers metrics locally and renders them in the admin UI.
3. Auto-sync (or manual `syncMetrics`) sends buffers to
   `/api/analytics/performance-metrics`; the API writes to `analytics_events`.
4. Admin dashboard + analytics service consume `analytics_events` for reports,
   performance alerts, and bundle trend charts.

## Testing & Verification

- **Bundle guard:** `npm run bundle:report` now runs the new
  `scripts/performance/bundle-check.ts`; CI fails on threshold violations.
- **Metric upload:** In a local session, open DevTools → Network, trigger a sync
  (call `syncMetrics()` or wait for auto-sync), and confirm `POST /api/analytics/performance-metrics`
  returns `201` and that `_reports/bundle-monitor.json` is updated after builds.
- **Admin visibility:** Visit the admin analytics dashboard; new metrics should
  appear within a minute if sync succeeded.

## FAQ

- **Do I need to import `performanceMetrics` _and_ use the store?** Use
  `performanceMetrics` for fire-and-forget counters; use the store when you need
  local state, thresholds, or the auto-sync pipeline.
- **Can we send metrics server-side?** Not via this endpoint. Server metrics go
  through `performanceMonitor` and existing Supabase RPCs.
- **What about Playwright?** The performance tests already hook into the store.
  When adding new metrics, update `tests/e2e/performance` assertions so they fail
  if instrumentation regresses.

