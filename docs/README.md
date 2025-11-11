# Choices Platform — Documentation Index

_Last updated: November 9, 2025_

This index lists the active documentation set after the November 2025 cleanup. Legacy “100% complete” narratives have been moved to the archive; the files below reflect the current state of the project.

---

## Quick Start

| Need | Read |
| --- | --- |
| Project status | [`CURRENT_STATUS.md`](CURRENT_STATUS.md) |
| High-level architecture | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Development setup | [`DEVELOPMENT.md`](DEVELOPMENT.md) |
| Testing strategy | [`TESTING.md`](TESTING.md) |
| Feature overview | [`FEATURES.md`](FEATURES.md) |
| State management standards | [`STATE_MANAGEMENT.md`](STATE_MANAGEMENT.md) |
| Technical roadmap | [`ROADMAP.md`](ROADMAP.md) |
| Civics ingest (non-technical) | [`civics-backend-quickstart.md`](civics-backend-quickstart.md) |

---

## Operational Docs

- [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md) — Required configuration keys.
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — Deployment checklist.
- [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) — Table & function summary (update pending analytics retrofit).
- [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md) / [`SECURITY.md`](SECURITY.md) — Compliance references.
- [`civics-backend-operations.md`](civics-backend-operations.md) — Civics ingest architecture & runbook.

---

## Guides

- [`guides/USER_GUIDE_LOCATION_FEATURES.md`](guides/USER_GUIDE_LOCATION_FEATURES.md)
- [`guides/ADMIN_GUIDE_ANALYTICS.md`](guides/ADMIN_GUIDE_ANALYTICS.md)

(Additional user/admin guides should live under `docs/guides/`.)

---

## Archive

Outdated or superseded documents now live under `docs/archive/`. They remain available for historical context but should not be treated as source of truth.

```
docs/archive/
├─ legacy-status/           # CURRENT_STATUS / FEATURES variants claiming 100% completion
├─ release-notes/           # One-off status memos (e.g., NOVEMBER_7_2025_COMPLETE.md)
└─ reference/               # Misc. legacy guides and notes
```

When archiving additional files, move them into the appropriate subdirectory and update this index.

---

## Maintenance Checklist

- Update this README whenever new core docs are added or archived.
- Keep summary tables in `CURRENT_STATUS.md` and `FEATURES.md` realistic—avoid “perfect completion” phrasing.
- Reference modernization checklists in `/scratch` rather than duplicating them here.

For questions or missing documentation, sync with the web platform team in `#web-platform`.
