# Choices Platform — Documentation Index

_Last updated: November 9, 2025_

This index lists the active documentation set after the November 2025 cleanup. Legacy “100% complete” narratives have been moved to the archive; the files below reflect the current state of the project.

---

## Quick Start

| Need | Read |
| --- | --- |
| Project status snapshot | [`CURRENT_STATUS.md`](CURRENT_STATUS.md) |
| High-level architecture | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Development setup | [`DEVELOPMENT.md`](DEVELOPMENT.md) |
| Testing strategy | [`TESTING.md`](TESTING.md) |
| Feature overview | [`FEATURES.md`](FEATURES.md) |
| Feature flag tracker | [`FEATURE_STATUS.md`](FEATURE_STATUS.md) |
| State management standards | [`STATE_MANAGEMENT.md`](STATE_MANAGEMENT.md) |
| Technical roadmap | [`ROADMAP.md`](ROADMAP.md) |
| Security & privacy references | [`SECURITY.md`](SECURITY.md), [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md) |

---

## Operational Docs

- [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md) — Required configuration keys.
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — Deployment checklist.
- [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) — Table & function summary (update pending analytics retrofit).
- [`SECURITY.md`](SECURITY.md) / [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md) — Compliance references.

---

## Technical Highlights

- [`technical/README.md`](technical/README.md) — Quick links to highlighted civics and testing references.
- [`technical/civics-platform-overview.md`](technical/civics-platform-overview.md) — Snapshot of civics ingest + APIs with links to full runbooks.
- [`technical/testing-harness-playbooks.md`](technical/testing-harness-playbooks.md) — Summary of harness commands and archived playbooks.

---

## Archive Index

Out-of-date, historical, or deep-dive material now lives under `docs/archive/`. Use these when you need additional context, but treat the files above as the current source of truth.

```
docs/archive/
├─ release-notes/          # Changelog, API change logs, one-off status memos
├─ reference/              # Legacy guides, ingest plans, testing playbooks
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
- Keep summary tables in `CURRENT_STATUS.md` and `FEATURES.md` realistic—avoid “perfect completion” phrasing.
- Reference modernization checklists in `/scratch` rather than duplicating them here.

For questions or missing documentation, sync with the web platform team in `#web-platform`.
