# MVP: Contact, Push, Civic Engagement v2 GA; Feature Quarantine

## Summary

Graduates Contact Information System, Push Notifications, and Civic Engagement v2 to GA (default on). Adds RLS for `representative_contacts`, civic-actions create/detail pages, and documents quarantined features that require no active work for MVP.

## Changes

### GA Features
- **Contact Information System** – RLS migration (`20260226120000`), 5 submissions/min rate limit, admin bulk approve/reject
- **Push Notifications** – Delivery failure logging to `notification_log`
- **Civic Engagement v2** – Create/sign at `/civic-actions/create` and `/civic-actions/[id]`; rep context when creating from representative detail

### New
- RLS policies on `representative_contacts`: public read, owner insert/update/delete, admin read/update, service_role full
- Civic actions create page with `?representative_id=X` support
- Civic actions detail page with sign capability
- `GET /api/feature-flags/public` for unauthenticated clients (PWA)

### Feature Quarantine
Quarantined (deferred, no active work): AUTOMATED_POLLS, SOCIAL_SHARING_CIVICS/VISUAL/OG, CIVICS_TESTING_STRATEGY, ADVANCED_PRIVACY, SOCIAL_SIGNUP, Device Flow OAuth, PERFORMANCE_OPTIMIZATION, ACCESSIBILITY, INTERNATIONALIZATION.

### Fixes
- Contact submit rate limit: 5/min
- FeedDataProvider.test: duplicate `pagination` keys

## Verification

- [x] `npm run types:ci`
- [x] `npm run lint`
- [x] `npm run build`
- [x] Jest 309 tests pass
- [x] RLS migration applied

## Post-deploy

- Run contact E2E specs (requires representatives in test DB)
- Validate push VAPID keys in production
- Verify admin bulk approve/reject
