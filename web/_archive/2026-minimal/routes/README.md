# Archived App Router routes (minimal core v0.1)

_Archived: June 22, 2026_

These route trees were removed from `web/app/(app)/` during the minimal core rebuild. URLs redirect to `/polls` or `/profile/edit` via [`web/next.config.js`](../../../next.config.js).

## Contents

- `admin/`, `feed/`, `dashboard/`, `civics/`, `contact/`, `onboarding/`, `e2e/`, `candidate/`, `analytics/`, `integrity/`, `civic-actions/`, `representatives/`, `account/`, `hashtags/`
- `profile-extra/` — `biometric-setup`, `preferences`

## Restore

Move a folder back under `web/app/(app)/` and remove the matching redirect from `next.config.js`.
