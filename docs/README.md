# Choices Platform — Documentation Index

_Last updated: January 2026_

This index lists the canonical documentation set. Historical fix summaries, completed work documentation, and outdated status files are archived under `docs/archive/`. The files below reflect the current, essential documentation.

---

## Quick Start

| Need | Read |
| --- | --- |
| **New to the project?** | [`GETTING_STARTED.md`](GETTING_STARTED.md) - 5-minute quick start |
| Project vision & roadmap | [`VISION.md`](VISION.md) - MVP status and future plans |
| Project status snapshot | [`CURRENT_STATUS.md`](CURRENT_STATUS.md) - Current work and status |
| High-level architecture | [`ARCHITECTURE.md`](ARCHITECTURE.md) - System design |
| Development setup | [`DEVELOPMENT.md`](DEVELOPMENT.md) - Detailed setup |
| Codebase navigation | [`CODEBASE_NAVIGATION.md`](CODEBASE_NAVIGATION.md) - Find code quickly |
| Testing strategy | [`TESTING.md`](TESTING.md) - Testing guide |
| State management standards | [`STATE_MANAGEMENT.md`](STATE_MANAGEMENT.md) - Zustand patterns |
| Troubleshooting | [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) - Common issues |
| Canonical utilities guide | [`UTILS_GUIDE.md`](UTILS_GUIDE.md) - Utility functions |
| Security & privacy references | [`SECURITY.md`](SECURITY.md), [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md) |

---

## Operational Docs

- [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md) — Required configuration keys.
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — Deployment checklist and process.
- [`PRODUCTION_TESTING.md`](PRODUCTION_TESTING.md) — Production testing guide.
- [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) — Table & function summary.
- [`SECURITY.md`](SECURITY.md) / [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md) — Compliance references.
- [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) — General troubleshooting guide.
- `docs/archive/` contains legacy or feature-specific troubleshooting notes as needed.

---

## Feature Notes

Feature-specific docs should be added only when they are actively maintained and referenced by the core docs. Otherwise, keep them in `docs/archive/`.

## API Documentation

- [`API/README.md`](API/README.md) — API overview and authentication.
- [`API/contracts.md`](API/contracts.md) — API contract standards and response formats.
- [`API/civic-actions.md`](API/civic-actions.md) — Civic actions API reference.

## Technical Highlights
Archived in `docs/archive/reference/technical/` if historical context is needed.

---

## Archive Index

Out-of-date, historical, or completed work documentation lives under `docs/archive/`. Use these when you need additional context, but treat the files above as the current source of truth.

Note: `docs/ROADMAP.md` is archived-in-place to preserve inbound links and points to `docs/ROADMAP_SINGLE_SOURCE.md`. Do not add new items there.

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
- The single source roadmap is `docs/ROADMAP_SINGLE_SOURCE.md`.
- Archive completed work summaries (fix summaries, implementation status) quarterly to keep active docs focused.
- Keep the canonical set aligned with `DOCS_MANIFEST.md`.

For questions or missing documentation, open an issue or add a note in the relevant doc.

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** TBD

