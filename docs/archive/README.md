# Archived Documentation Index

**Historical only.** This directory contains legacy documentation that has been superseded by the current doc set. Files are retained for historical context and reference; do not treat them as source of truth. Use `docs/README.md` and the linked active docs for current guidance.

```
docs/archive/
├─ legacy-status/           # Outdated status reports & feature rundowns
├─ release-notes/           # One-off status memos and completion announcements
├─ reference/               # Miscellaneous guides (civics/ = ARCHIVED; use services/civics-backend/NEW_civics_ingest/docs/)
└─ runbooks/                # Operational playbooks and emergency procedures
```

When archiving additional documents:
1. Move the markdown file into the appropriate subdirectory.
2. Add a short note here if the directory structure changes.
3. Update `docs/README.md` so the primary index remains accurate.

If the archived file still contains useful technical insight, consider extracting the relevant pieces into the active docs before archiving.

### Archived-in-place (to preserve inbound links)

- `docs/ROADMAP.md` — Redirect stub pointing to `docs/ROADMAP_SINGLE_SOURCE.md`. Kept in place to avoid breaking links; do not add new items.
