# Election Notification Monitoring

_Last updated: 2025-11-13_

This document explains how to monitor civics election alerts across the Choices platform.

---

## Data Sources

- **Analytics events** (`analytics_events` Supabase table)  
  - `event_type = 'notifications.election.delivered'`  
  - `event_type = 'notifications.election.opened'`  
  - `event_data` includes `election_id`, `division_id`, `days_until`, and `source`.
- **Notification store instrumentation**  
  - In-app alerts emit analytics events when delivered and when marked as read.

---

## API Endpoint

`GET /api/analytics/election-notifications`

Returns aggregated metrics over a configurable rolling window (default 30 days):

```json
{
  "windowDays": 30,
  "totals": { "delivered": 128, "opened": 64 },
  "conversionRate": 50,
  "byDay": [{ "date": "2025-11-01", "delivered": 12, "opened": 8 }],
  "bySource": [{ "source": "dashboard", "delivered": 40, "opened": 28 }],
  "lastUpdated": "2025-11-13T17:14:00.000Z"
}
```

Query parameters:

| Name        | Type | Default | Description                      |
|-------------|------|---------|----------------------------------|
| `windowDays`| int  | 30      | Rolling window (max 180 days).   |

---

## Configuration

Ensure the following environment variables are set to enable push delivery and analytics collection:

**Server runtime (`next.config.js` / Vercel project secrets)**

- `WEB_PUSH_VAPID_PUBLIC_KEY`
- `WEB_PUSH_VAPID_PRIVATE_KEY`
- `WEB_PUSH_VAPID_SUBJECT` (e.g. `mailto:support@choices.dev`)

**Client runtime (`.env.local`)**

- `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY`

If these are missing, the PWA send endpoint will respond with `503` and avoid attempting to deliver notifications.

---

## Workflow Architecture

**Ingest & Source of Truth**
- `services/civics-backend/src/scripts/state/sync-google-elections.ts` refreshes `civic_elections` via Google Civic (`fetchElections`) and normalises blank divisions to `ocd-division/country:us`.
- `public.get_upcoming_elections(divisions text[])` (see `supabase/migrations/20251112090000_create_civic_elections.sql`) exposes cached elections filtered by OCD prefixes for both API access and scheduler jobs.
- `representative_divisions` (built by `refresh_divisions_from_openstates()`) anchors representative → division mappings used in notification copy.

**Audience Segmentation**
- Persist each user’s latest civic divisions in a lightweight snapshot table (planned: `user_civic_divisions`, keyed by `user_id`, `division_id`, `source`, `captured_at`). The data comes from:
  - `AddressLookupForm` hydration (`useUserDivisionIds`) posting to a new endpoint (`POST /api/internal/civics/divisions`) that writes the snapshot.
  - Follows/contact flows enriching the same table whenever a user subscribes to a representative tied to new divisions.
- Audience queries join `user_civic_divisions` with `civic_elections` using prefix matching (`division_id LIKE election_division || '%'`), producing one row per user/election/primary division.

**Notification Generation**
- Message template lives in the scheduler (see “Scheduler Implementation Plan”) and reuses shared helpers:
  - Countdown copy mirrors `useElectionCountdown` (days until, “election tomorrow/today” messaging)
  - Representative context optionally appended by looking up `representative_divisions` → `representatives_core` for the target user.
- Deduplication is enforced through `notification_log` (existing table) plus a unique virtual constraint `{user_id, election_id, division_id, channel}`; before inserting/sending we check for existing “sent” entries inside the lookback window.

**Delivery Surfaces**
- **In-app (web)**: continue leveraging `useElectionCountdown(..., { notify: true })` and `notificationStoreUtils.createElectionNotification` so active users see countdown banners without server pushes.
- **PWA Push**: scheduler calls `POST /api/pwa/notifications/send` with a batch payload. The endpoint already records to `notification_log` and deactivates stale subscriptions.
- **Future channels**: the workflow reserves a queue slot for email/SMS; metadata in `notification_log` should include `channel` and `payload_version` to support those additions.

**Analytics & Observability**
- Delivery/open analytics come from `notificationStore.ts` (`notifications.election.delivered/opened`). The scheduler injects `source` (“scheduler_push”, “scheduler_inapp”, etc.) and `days_until`.
- Monitoring dashboards consume `/api/analytics/election-notifications`, keeping visibility consistent across manually-triggered and automated sends.

---

## Scheduler Implementation Plan

1. **CLI entrypoint**  
   - Add `services/civics-backend/src/scripts/notifications/send-election-alerts.ts` (`npm run notifications:send:elections`).  
   - Supports `--dry-run`, `--window-days=7`, `--limit` (cap per run), `--source=scheduler_push`.  
   - Uses the Supabase service role key (same `.env.local` as other civics scripts) to call `get_upcoming_elections`.
2. **Audience query**  
   - Fetch elections within `window_days` (default 7) where `election_day >= current_date`.  
   - Join `user_civic_divisions` (latest snapshot per user/division) and optional `user_notification_preferences` view combining `push_subscriptions.preferences` + future email settings.  
   - Filter out users who opted out (`preferences->>'election_alerts' = false`) or who lack active notification channels.
3. **Deduplication & logging**  
   - For each `(user_id, election_id, division_id)` pair, check `notification_log` for a `status in ('sent','queued')` row in the last 14 days.  
   - Insert a new `notification_log` row with `status = 'queued'`, `channel = 'push'`, `source = 'scheduler_push'`, and store the computed countdown metadata (days until, division, template version).  
   - On dry runs, set `status = 'dry_run'` and skip downstream send.
4. **Delivery**  
   - Batch push payloads by `user_id` (chunk ~200) and call `POST /api/pwa/notifications/send` with `targetUsers` to reuse existing VAPID configuration/logging.  
   - Future email/SMS channels hook into the same queue (the CLI should emit a JSON payload snapshot so other workers can consume it).
5. **Scheduling**  
   - Configure Supabase Scheduled Triggers or Vercel Cron: `Mon/Thu 15:00 UTC`, invoking an internal Next.js route (`POST /api/internal/civics/election-alerts/run`) that shells out to the CLI (or reproduces the job server-side).  
   - The route honours `--dry-run` when `?dryRun=true` is supplied, enabling smoke tests without touching production users.
6. **Reporting**  
   - Job emits summary logs (total candidates, sent, skipped, per-division breakdown) and writes a record to `jobs_run_log` (existing ops table) for auditing.  
   - Analytics events reuse the `notificationStore` helpers; the scheduler should explicitly track a `notifications.election.delivered` event on successful push.

---

## Feature Flags & Access Controls

- Introduce two new flags in `web/lib/core/feature-flags.ts`:
  - `CIVICS_ELECTION_ALERTS` – gates UI entry points (countdown notify option, analytics widget call-outs).
  - `CIVICS_ELECTION_ALERTS_CRON` – gates the scheduler/automation path.
- Existing dependencies:
  - `PWA` and `PUSH_NOTIFICATIONS` must be enabled to send push payloads.
  - `CIVICS_ADDRESS_LOOKUP` remains the prerequisite for capturing division snapshots.
- Rollout sequence:
  1. Enable `CIVICS_ELECTION_ALERTS` in staging to exercise UI-only surfaces.
  2. Run dry-run scheduler with `CIVICS_ELECTION_ALERTS_CRON` disabled (verifies analytics + logging).
  3. Enable `CIVICS_ELECTION_ALERTS_CRON` for canary cohorts (10% of users), monitored via analytics source breakdown.
  4. Promote to 100% once conversion and duplicate metrics meet success criteria.

---

## Dashboard Widget

- Widget: **Election Notification Engagement**
- Location: Analytics dashboard → Widget selector → Engagement category
- Component: `web/features/analytics/components/widgets/ElectionNotificationWidget.tsx`
- Data source: `/api/analytics/election-notifications`

Key metrics displayed:

- Delivered vs opened totals
- Conversion rate
- Daily trend (delivered vs opened)
- Top sources (dashboard, lure, contact, automation, etc.)

---

## QA & Verification Checklist

1. Dry run the scheduler (`npm run notifications:send:elections -- --dry-run`) and confirm log output plus `notification_log` rows marked with `status = 'dry_run'` (no push delivery).
2. Toggle `civics-election-alerts` / `civics-election-alerts-cron` flags in staging; assert that:
   - Countdown hook still raises in-app notifications when `notify` is true.
   - Scheduler skips pushes entirely when either flag is disabled.
3. Confirm analytics events fire (`notifications.election.delivered/opened`) for both in-app (countdown hook) and scheduler-triggered pushes.
4. Hit `/api/analytics/election-notifications` and validate aggregation versus raw Supabase rows.
5. Load the **Election Notification Engagement** widget; ensure totals, conversion rate, and sources render correctly for the active window.
6. Exercise opt-out and dedupe via `/app/(app)/e2e/notification-store` harness:
   - Uncheck election alerts preference (simulated via `push_subscriptions.preferences`) and confirm scheduler excludes the user.
   - Attempt to resend the same election within 24 hours; dedupe should skip delivery and only log an audit entry.
7. Validate dashboard refresh interval (5 minutes) or run the manual refresh control; verify that repeated API calls respect window filters.

---

## Alerts & Follow-up

- Configure alerting (Datadog/Grafana) for conversion dips below 20% or delivery spikes outside baseline; hook into `/api/analytics/election-notifications`.
- Share dashboards with Civics Ops/Support ahead of scheduler launch; maintain a dry-run report for Legal/Support sign-off.
- After enabling automation, add saved views filtered by `source` (e.g., `scheduler_push`, `civics_lure`) to compare campaign performance by surface.
- Review `notification_log` weekly; prune entries older than 30 days using the existing maintenance function (`cleanup_old_notification_logs`) once the job produces stable volume.

