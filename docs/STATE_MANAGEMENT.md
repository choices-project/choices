# State Management Guide

_Last updated: November 10, 2025_

This document summarizes the agreed-on patterns for Zustand stores in the Choices web app. It complements the modernization checklists that live under `scratch/gpt5-codex/store-roadmaps/`.

---

## Goals

- Consistent store shape (types, creator, selectors) across features.
- Predictable persistence behaviour with minimal payloads.
- Easy-to-test stores that can be instantiated without browser APIs.
- Reduced re-render churn via memoized selectors and action hooks.

---

## Required Exports

Every store under `web/lib/stores` should expose:

1. `createInitial<Store>State()` — returns a plain object seeded with initial values.
2. `create<Store>Actions(set, get)` — actions grouped by responsibility, free of browser side-effects.
3. `<store>Creator` — combines initial state + actions; never call `create()` inside the module.
4. `use<Store>` selectors — e.g. `useProfileStore`, `useProfile`, `useProfileActions`.
5. Optional helpers — `reset`, `partialize`, domain-specific utils.
6. Barrel re-exports — ensure selectors, action hooks, and types are surfaced through `web/lib/stores/index.ts` so feature code imports from `'@/lib/stores'` (e.g. the polls/voting stores now ship only from the barrel).

```ts
export type NotificationStore = NotificationState & NotificationActions;

export const notificationStoreCreator: NotificationStoreCreator = (set, get) =>
  Object.assign(createInitialNotificationState(), createNotificationActions(set, get));

export const useNotificationStore = create<NotificationStore>()(
  devtools(persist(immer(notificationStoreCreator), persistConfig), devtoolsOptions)
);

export const useNotifications = () => useNotificationStore(notificationSelectors.notifications);
export const useNotificationActions = () => { /* memoized action hook */ };
```

---

## Middleware Composition

1. Compose middleware outside the store creator (e.g. `persist(immer(...))`).
2. Use `createSafeStorage()` for persisted stores to support SSR/tests.
3. Keep `partialize` payloads narrow: store only the fields required to restore state after reload.
4. Avoid side-effects inside Immer producers; schedule timers or network calls outside the `set()` callback.

---

## Action Hooks vs. Raw State Access

- Components should consume selector hooks (`useNotifications`, `useUnreadCount`) or memoized action hooks (`useNotificationActions`).
- Avoid `use<Store>(state => state)` in components—it forces full re-renders and breaks modularity.
- When a component truly needs multiple slices/actions from the same store, compose them with `useShallow` (from `zustand/react/shallow`) so React only re-renders when one of the selected fields changes. See the profile feature (`web/features/profile/hooks/use-profile.ts`) for the canonical pattern.
- Tests may use `use<Store>Store.getState()` directly when instantiating local stores, but production code should not.

### Shared Helpers

- Use `createBaseStoreActions(setDraft)` from `web/lib/stores/baseStoreActions.ts` whenever a store exposes the standard loading/error trio. It keeps behaviour consistent across stores and lets us add cross-cutting instrumentation in one place later.
- Add store-specific status setters (e.g., `setVoting`, `setSending`) in addition to—rather than instead of—the shared helper.
- Export selector bundles when a store has complex consumers (e.g., `analyticsSelectors`, `analyticsChartSelectors`, `analyticsStatusSelectors`). Re-export them via `web/lib/stores/index.ts` so features do not import the store module directly.
- When a feature owns multiple surfaces (web + PWA + harness), add a thin façade under `features/<feature>/lib/store.ts` that re-exports only the selectors/actions that surface needs. This keeps feature code from depending on the entire store module and matches the pattern now used by `features/voting/lib/store.ts`.
- Feature-level hook bundles should wrap store selectors/actions rather than duplicating state locally. The profile feature (`features/profile/hooks/use-profile.ts`) now mirrors this approach—components such as `ProfileEdit`, `ProfileAvatar`, and `MyDataDashboard` consume only the selectors/actions exposed by the hooks, keeping store usage consistent across the UI.

### Consent & Analytics Tracking

- Maintain both store-level (`trackingEnabled`) and preference-level (`preferences.trackingEnabled`) toggles. Always gate tracking actions (`trackEvent`, `trackPageView`, etc.) behind a shared guard to respect user consent.
- Centralize event payload building so components do not handcraft analytics envelopes; the store should add IDs, timestamps, and session IDs.
- Harness pages (`/app/(app)/e2e/analytics-store`) should expose consent toggles, event helpers, and chart context for deterministic Playwright specs (`tests/e2e/specs/analytics-store.spec.ts`).

---

## Testing Expectations

| Layer | Tools | Notes |
| --- | --- | --- |
| Unit | `tests/unit/stores/<store>.test.ts` | Instantiate store via `create<Store>()(immer(<store>Creator))`. Cover initial state, key actions, and edge cases. |
| RTL Integration | `tests/unit/stores/<store>.integration.test.tsx` | Render a lightweight harness component; drive state through hooks/actions; rely on fake timers where needed. |
| Playwright Harness | `app/(app)/e2e/<store>/page.tsx` + `tests/e2e/specs/<store>.spec.ts` | Expose a `window.__<store>Harness` facade. Verify UI-facing behaviour (auto-dismiss, admin flows, etc.). |

Current harness coverage: `admin-store`, `analytics-store`, `app-store`, `notification-store`, `onboarding-store`, `poll-wizard`, `polls-store`, `profile-store`, and `user-store`. Use these as blueprints when modernizing the remaining stores.

---

## Modernization Workflow

1. **Inventory consumers** — `rg "use<Store>" web` to find features relying on the store.
2. **Refactor core** — pull initial state/actions into helpers, export `use<Store>Actions`, add selectors.
3. **Update consumers** — migrate components/tests to the new hooks; avoid `getState()` in React components.
4. **Testing** — add/refresh unit + integration suites; build Playwright harness if the store drives UI interactions.
5. **Docs & checklist** — mark progress in the corresponding `scratch/gpt5-codex/store-roadmaps/*` file and update this guide if new patterns emerge.

---

## References

- Notification store modernization PRs — see `web/lib/stores/notificationStore.ts` and the associated tests/harness.
- Development setup & testing commands — `docs/DEVELOPMENT.md`, `docs/TESTING.md`.
- Technical backlog — `docs/ROADMAP.md`.

For questions, drop a note in `#web-platform` or annotate the relevant checklist in `/scratch`.
