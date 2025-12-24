# Choices Platform — Documentation Index

_Last updated: January 2026_

This index lists the active documentation set. Historical fix summaries, completed work documentation, and outdated status files have been archived to `docs/archive/reference/`. The files below reflect the current, essential documentation.

---

## Quick Start

| Need | Read |
| --- | --- |
| Project status snapshot | [`CURRENT_STATUS.md`](CURRENT_STATUS.md) |
| High-level architecture | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Development setup | [`DEVELOPMENT.md`](DEVELOPMENT.md) |
| Testing strategy | [`TESTING.md`](TESTING.md) |
| State management standards | [`STATE_MANAGEMENT.md`](STATE_MANAGEMENT.md) |
| Technical roadmap (**single source**) | [`scratch/ROADMAP_SINGLE_SOURCE.md`](../scratch/ROADMAP_SINGLE_SOURCE.md) |
| Canonical utilities guide | [`UTILS_GUIDE.md`](UTILS_GUIDE.md) |
| Security & privacy references | [`SECURITY.md`](SECURITY.md), [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md) |

---

## Operational Docs

- [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md) — Required configuration keys.
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — Deployment checklist.
- [`PRODUCTION_TESTING.md`](PRODUCTION_TESTING.md) — Production testing guide.
- [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) — Table & function summary.
- [`SECURITY.md`](SECURITY.md) / [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md) — Compliance references.
- [`TROUBLESHOOTING_FEED_AND_FEEDBACK.md`](TROUBLESHOOTING_FEED_AND_FEEDBACK.md) — Troubleshooting guide.

---

## Feature-Specific Guides

- [`INTERNATIONALIZATION.md`](INTERNATIONALIZATION.md) — i18n implementation guide.
- [`ANALYTICS_PIPELINE.md`](ANALYTICS_PIPELINE.md) — Analytics architecture and data pipeline.
- [`ANALYTICS_FEATURES_PLAN.md`](ANALYTICS_FEATURES_PLAN.md) — Analytics features summary.
- [`CIVICS_ADDRESS_LOOKUP.md`](CIVICS_ADDRESS_LOOKUP.md) — Address lookup API reference.
- [`DEVICE_FLOW_QUICK_START.md`](DEVICE_FLOW_QUICK_START.md) — OAuth 2.0 device flow guide.
- [`PUSH_NOTIFICATIONS.md`](PUSH_NOTIFICATIONS.md) — Push notifications overview (see also VAPID setup and audit docs).
- [`PUSH_NOTIFICATIONS_VAPID_SETUP.md`](PUSH_NOTIFICATIONS_VAPID_SETUP.md) — VAPID keys configuration.
- [`PUSH_NOTIFICATIONS_AUDIT.md`](PUSH_NOTIFICATIONS_AUDIT.md) — Implementation status and deployment readiness.
- [`FEEDS_STORE_TELEMETRY.md`](FEEDS_STORE_TELEMETRY.md) — Feeds store telemetry reference.
- [`LANDING_PAGE.md`](LANDING_PAGE.md) — Landing page status.

## Technical Highlights
Archived in `docs/archive/reference/technical/`. See archive index below if you need historical context.

---

## Archive Index

Out-of-date, historical, or completed work documentation lives under `docs/archive/`. Use these when you need additional context, but treat the files above as the current source of truth.

Note: `docs/ROADMAP.md` is archived-in-place to preserve inbound links and now points to `ROADMAP_SINGLE_SOURCE.md`. Do not add new items there.

```
docs/archive/
├─ release-notes/          # Changelog, API change logs, one-off status memos
├─ reference/              # Legacy guides, completed work summaries, historical docs
│  ├─ fixes/               # Historical fix summaries (2025)
│  ├─ lint/                # Lint repair plans (completed)
│  ├─ production/          # Production readiness summaries (completed)
│  ├─ stores/              # Store testing status (superseded by STATE_MANAGEMENT.md)
│  ├─ device-flow/         # Device flow implementation summaries
│  ├─ push-notifications/  # Historical testing and review docs
│  ├─ civics/              # Civics backend + ingest documentation
│  ├─ guides/              # User/admin guides
│  └─ testing/             # Playwright/Jest playbooks
└─ runbooks/               # Operational runbooks and emergency procedures
```

---

## Archive

Outdated or superseded documents live under the archive tree above, including the older status narratives in `archive/legacy-status/`. When archiving additional files, move them into the appropriate subdirectory and update this index.

---

## Maintenance Checklist

- Update this README whenever new core docs are added or archived.
- Keep summary tables in `CURRENT_STATUS.md` and `FEATURE_STATUS.md` realistic—avoid "perfect completion" phrasing.
- The single source roadmap is `scratch/ROADMAP_SINGLE_SOURCE.md` (moved from docs to consolidate work).
- Archive completed work summaries (fix summaries, implementation status) quarterly to keep active docs focused.
- See [`DOCS_AUDIT_REPORT.md`](DOCS_AUDIT_REPORT.md) for the January 2026 audit and consolidation rationale.

For questions or missing documentation, see the ownership notes in each doc and raise in `#web-platform`.
