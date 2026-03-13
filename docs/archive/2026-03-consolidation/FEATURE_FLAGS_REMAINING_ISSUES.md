# Feature Flags: Remaining Issues and Work Items

_Last updated: March 2026. Audit of all feature-flag usage; implementation correctness; and remaining work._

This document complements [FEATURE_FLAGS_AUDIT.md](./FEATURE_FLAGS_AUDIT.md) and [FEATURE_STATUS.md](./FEATURE_STATUS.md). It lists **remaining issues** that need to be addressed so that every flagged feature is implemented and gated appropriately. These items are consolidated in the definitive MVP roadmap: [ROADMAP.md](./ROADMAP.md) §1.1 and §2.1.

---

## 1. Summary

| Area | Status | Action |
|------|--------|--------|
| CONTACT_INFORMATION_SYSTEM – API coverage | ✅ Complete | `/api/contact/messages` and `/api/contact/threads` return 403 when flag off (March 2026). |
| CONTACT_INFORMATION_SYSTEM – Client pages | ✅ Complete | `/contact/submissions` and `/contact/history` show “Feature disabled” when flag off (March 2026). |
| SOCIAL_SHARING – Client consistency | ✅ Complete | ShareAnalyticsPanel uses `useFeatureFlag('SOCIAL_SHARING')` (March 2026). |
| Quarantined flags in registry | ✅ Documented | No implementation; keep as-is per FEATURE_STATUS.md |
| Always-on vs mutable | ✅ Correct | ALWAYS_ENABLED_FLAGS and FEATURE_FLAGS used consistently |
| PWA hook vs main hook | ✅ Documented | FEATURE_FLAGS_AUDIT §6; both in use intentionally |

---

## 2. CONTACT_INFORMATION_SYSTEM

**Flag default:** `true` (GA).  
**Purpose:** Contact information submissions (email/phone/address for representatives), admin review, My Submissions.

### 2.1 API gating – complete

The following routes correctly check `isFeatureEnabled('CONTACT_INFORMATION_SYSTEM')` and return 403 when disabled:

- `POST /api/contact/submit`
- `GET /api/contact/submissions`
- `GET/PATCH/DELETE /api/contact/[id]`
- `GET /api/contact/representative/[id]`
- `GET /api/admin/contact/pending`
- `POST /api/admin/contact/[id]/approve`
- `POST /api/admin/contact/[id]/reject`
- `POST /api/admin/contact/bulk-approve`
- `POST /api/admin/contact/bulk-reject`

### 2.2 API gating – complete (March 2026)

| Route | Status |
|-------|--------|
| `POST`, `GET` /api/contact/messages | ✅ Gated: `isFeatureEnabled('CONTACT_INFORMATION_SYSTEM')` at top of handler; returns 403 when disabled. |
| `GET` /api/contact/threads, `POST` /api/contact/threads, `PUT` /api/contact/threads | ✅ Gated: same check; returns 403 when disabled. |

### 2.3 Client UI gating – complete

- Admin sidebar: Contact link hidden when `!contactSystemEnabled` (Sidebar uses `useFeatureFlag('CONTACT_INFORMATION_SYSTEM')`).
- Admin contact page: Shows “Contact Information System is currently disabled” when flag off (ContactSystemAdmin).
- Contact modal, ContactRepresentativesSection, ContactSubmissionForm, BulkContactModal: All use `useFeatureFlag('CONTACT_INFORMATION_SYSTEM')` and hide or disable when off.

### 2.4 Client UI gating – complete (March 2026)

| Page / surface | Status |
|----------------|--------|
| `/contact/submissions` (My Submissions) | ✅ Gated: `useFeatureFlag('CONTACT_INFORMATION_SYSTEM')`; shows “Feature disabled” card when flag off (same pattern as ContactSystemAdmin). |
| `/contact/history` | ✅ Gated: `useFeatureFlag('CONTACT_INFORMATION_SYSTEM')`; shows “Feature disabled” card when flag off. |

---

## 3. SOCIAL_SHARING and SOCIAL_SHARING_POLLS

**Flag defaults:** `SOCIAL_SHARING` false, `SOCIAL_SHARING_POLLS` false.  
**Usage:** Share API, ShareButton, PollShare, ShareAnalyticsPanel.

### 3.1 Implementation correctness

- **API:** `/api/share/route.ts` and share-related analytics correctly check `isFeatureEnabled('SOCIAL_SHARING')` and return 403 when disabled.
- **UI:** ShareButton (civics) and PollShare (polls) use `isFeatureEnabled('SOCIAL_SHARING')` and `isFeatureEnabled('SOCIAL_SHARING_POLLS')`; when disabled, share UI is hidden.
- **Admin:** ShareAnalyticsPanel uses `isFeatureEnabled('SOCIAL_SHARING')` and shows “Social sharing feature is disabled” when off.

### 3.2 Resolved (March 2026)

| Location | Status |
|----------|--------|
| `ShareAnalyticsPanel.tsx` | ✅ Uses `useFeatureFlag('SOCIAL_SHARING')` from `@/features/pwa/hooks/useFeatureFlags` so admin toggles apply without refresh. |

---

## 4. CIVIC_ENGAGEMENT_V2

**Flag default:** `true` (GA).  
**Usage:** Civic actions (create/sign), rep detail CivicActionList, API and integration utils.

### 4.1 Implementation correctness

- **API:** `GET/POST /api/civic-actions/[id]/sign`, civic-actions integration, and `app/(app)/civic-actions/[id]/page.tsx` all check `isFeatureEnabled('CIVIC_ENGAGEMENT_V2')` and return 403 or redirect when disabled.
- **UI:** CreateCivicActionForm, CivicActionList, CivicActionCard use `isFeatureEnabled('CIVIC_ENGAGEMENT_V2')` and hide or show disabled state when off.
- **Utils:** `civic-actions-integration.ts` and `sophisticated-civic-engagement.ts` gate on the flag.

No remaining issues identified for this flag.

---

## 5. PWA and PUSH_NOTIFICATIONS

**PWA:** Always-on. **PUSH_NOTIFICATIONS:** Mutable, default `true`.

### 5.1 Implementation correctness

- **API:** `/api/pwa/status`, `/api/pwa/notifications/subscribe`, `/api/pwa/offline/sync` check `isFeatureEnabled('PWA')` and return 403 when disabled.
- **Client:** PWA hook and components use feature flags; `isPWAEnabled()` delegates to `isFeatureEnabled('pwa')`.

No remaining issues identified for PWA/PUSH_NOTIFICATIONS gating.

---

## 6. Quarantined / deprecated flags

The following are in `FEATURE_FLAGS` but **have no implementation** (quarantined per FEATURE_STATUS.md):

- `AUTOMATED_POLLS`
- `SOCIAL_SHARING_CIVICS`
- `SOCIAL_SHARING_VISUAL`
- `SOCIAL_SHARING_OG`
- `CIVICS_TESTING_STRATEGY`

**Status:** Correct. They are documented as quarantined; no code paths depend on them for behavior. No work required unless product unquarantines.

---

## 7. Always-on flags

`ALWAYS_ENABLED_FLAGS` (PWA, ADMIN, CIVICS_ADDRESS_LOOKUP, WEBAUTHN, etc.) are used for capability checks (e.g. analytics, address lookup, admin UI). No inconsistencies found; they are not toggled at runtime.

---

## 8. Recommended action list

| Priority | Item | Owner |
|----------|------|--------|
| ~~P1~~ | ~~Gate `/api/contact/messages` and `/api/contact/threads`~~ | ✅ Done (March 2026) |
| ~~P1~~ | ~~On `/contact/submissions` page, add flag check and “Feature disabled”~~ | ✅ Done (March 2026) |
| ~~P2~~ | ~~Gate `/contact/history` page when flag off~~ | ✅ Done (March 2026) |
| ~~P3~~ | ~~Use PWA hook in ShareAnalyticsPanel~~ | ✅ Done (March 2026): uses `useFeatureFlag('SOCIAL_SHARING')` so admin toggles apply without refresh. |
| — | Keep FEATURE_STATUS.md and FEATURE_FLAGS_AUDIT.md in sync when adding/removing flags or changing defaults | All |

---

## 9. Verification checklist (pre–go-live)

- [x] All contact API routes under `/api/contact/*` and `/api/admin/contact/*` either gated by `CONTACT_INFORMATION_SYSTEM` or explicitly documented as out of scope (March 2026).
- [x] My Submissions page (`/contact/submissions`) shows a clear disabled state when the flag is off (March 2026).
- [x] Communication History page (`/contact/history`) shows a clear disabled state when the flag is off (March 2026).
- [x] Admin Contact UI and sidebar remain gated (already correct).
- [ ] No component relies on a quarantined flag for critical behavior.
- [ ] `FEATURE_FLAGS_OVERRIDE` (or equivalent) is set in production for any non-default mutable flags.

---

## 10. Related docs

- [FEATURE_FLAGS_AUDIT.md](./FEATURE_FLAGS_AUDIT.md) – Architecture, inventory, developer guide
- [FEATURE_STATUS.md](./FEATURE_STATUS.md) – Product readiness and quarantine
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) – `FEATURE_FLAGS_OVERRIDE`
