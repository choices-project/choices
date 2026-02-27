# State Management Guide

_Last updated: January 2026_

This document summarizes the agreed-on patterns for Zustand stores in the Choices web app. It replaces the scattered checklists under `scratch/gpt5-codex/store-roadmaps/` (see consolidation notes below).

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
3. `<store>Creator` — typed `StateCreator` that merges state/actions; never call `create()` inside the module.
4. Selector bundles — colocate selectors under `const <store>Select = { ... } as const`.
5. Hook bundles — expose `use<Thing>` selector hooks plus memoized `use<Thing>Actions`.
6. Optional helpers — `reset`, `partialize`, domain-specific utils.
7. Barrel re-exports — ensure selectors, action hooks, and types are surfaced through `web/lib/stores/index.ts` so feature code imports from `'@/lib/stores'`.

```ts
export type NotificationStore = NotificationState & NotificationActions;

export const notificationStoreCreator: NotificationStoreCreator = (set, get) =>
  Object.assign(createInitialNotificationState(), createNotificationActions(set, get));

export const useNotificationStore = create<NotificationStore>()(
  devtools(persist(immer(notificationStoreCreator), persistConfig), devtoolsOptions)
);

export const useNotifications = () => useNotificationStore(notificationSelectors.notifications);
export const useNotificationActions = () => {
  const addNotification = useNotificationStore((state) => state.addNotification);
  const removeNotification = useNotificationStore((state) => state.removeNotification);
  // ... other actions
  
  return useMemo(
    () => ({
      addNotification,
      removeNotification,
      // ... other actions
    }),
    [addNotification, removeNotification, /* ... other dependencies */]
  );
};
```

---

## Selector Bundles & Hook Conventions (2026 Refresh)

- Group selectors under a `const <store>Select = { ... } as const` object and export typed helper hooks. Reference implementations live in `web/lib/stores/analyticsStore.ts`, `notificationStore.ts`, and `profileStore.ts`.

```ts
export const analyticsSelect = {
  summary: (state: AnalyticsStore) => state.summary,
  filters: (state: AnalyticsStore) => state.filters,
  loading: (state: AnalyticsStore) => state.loading,
} as const;

export const useAnalyticsSummary = () => useAnalyticsStore(analyticsSelect.summary);
export const useAnalyticsFilters = () => useAnalyticsStore(analyticsSelect.filters);
```

- Memoize action bundles via `useMemo` so the returned object remains referentially stable (`useProfileActions`, `useAnalyticsActions`, etc.).
- When a feature surface needs multiple selectors/actions, expose a domain-specific hook (e.g., `features/analytics/hooks/useEnhancedAnalytics.ts`).
- Tests should lock selector shape with the existing integration suites (`web/tests/integration/stores/*selector-verification*.test.ts`) to catch accidental regressions.

---

## Store Creator Template

- Alias the creator type with explicit middleware ordering. This keeps TS happy when composing `devtools`, `persist`, `immer`, telemetry wrappers, etc.

```ts
type AppStoreCreator = StateCreator<
  AppStore,
  [['zustand/devtools', never], ['zustand/persist', PersistOptions<AppStore>], ['zustand/immer', never]]
>;

export const appStoreCreator: AppStoreCreator = (set, get) =>
  Object.assign(createInitialAppState(), createAppActions(set, get));

export const useAppStore = create<AppStore>()(
  devtools(
    persist(immer(appStoreCreator), { name: 'app-store', storage: createSafeStorage() }),
    { name: 'AppStore' }
  )
);
```

- When multiple stores share the same middleware stack (analytics/performance, notification/pwa, etc.), extract a helper under `web/lib/stores/utils/` so telemetry/devtools wiring lives in one place.
- Tests should instantiate stores via the creator plus helper middleware to ensure the same ordering used in production (see `web/tests/integration/stores/app-store-selector-verification.test.ts` for the pattern).

---

## Middleware Composition

1. Compose middleware outside the store creator (e.g. `persist(immer(...))`).
2. Use `createSafeStorage()` for persisted stores to support SSR/tests.
3. Keep `partialize` payloads narrow: store only the fields required to restore state after reload.
4. Avoid side-effects inside Immer producers; schedule timers or network calls outside the `set()` callback.

### Persistence with `partialize`

When using `persist` middleware, use `partialize` to control what gets saved to storage. This reduces payload size and prevents storing sensitive or transient data:

```ts
const persistConfig = {
  name: 'app-store',
  storage: createSafeStorage(),
  partialize: (state: AppStore) => ({
    theme: state.theme,
    sidebarCollapsed: state.sidebarCollapsed,
    sidebarWidth: state.sidebarWidth,
    settings: state.settings,
    // Exclude: isLoading, error, modalStack, etc.
  }),
};
```

**Rules for `partialize`:**
- Include only user preferences and UI state that should persist across sessions
- Exclude loading states, errors, temporary UI state (modals, toasts), and computed values
- Exclude sensitive data (tokens, PII) unless explicitly required
- Keep payloads small (< 10KB) for performance
- Test persistence/restoration in both unit tests and E2E harnesses

Store-level tracking: see `docs/ROADMAP_SINGLE_SOURCE.md` § C.

---

## Action Hooks vs. Raw State Access

- Components should consume selector hooks (`useNotifications`, `useUnreadCount`) or memoized action hooks (`useNotificationActions`).
- Avoid `use<Store>(state => state)` in components—it forces full re-renders and breaks modularity.
- When a component truly needs multiple slices/actions from the same store, compose them with `useShallow` (from `zustand/react/shallow`) so React only re-renders when one of the selected fields changes. See the profile feature (`web/features/profile/hooks/use-profile.ts`) for the canonical pattern.
- Tests may use `use<Store>Store.getState()` directly when instantiating local stores, but production code should not.

### Action Hook Memoization Pattern

Action hooks should use `useMemo` to prevent unnecessary re-renders. Zustand actions are stable references, but wrapping them in `useMemo` ensures the returned object is also stable:

```ts
export const useNotificationActions = () => {
  // Select each action individually - Zustand provides stable references
  const addNotification = useNotificationStore((state) => state.addNotification);
  const removeNotification = useNotificationStore((state) => state.removeNotification);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  // ... other actions

  // Memoize the returned object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      addNotification,
      removeNotification,
      markAsRead,
      // ... other actions
    }),
    [addNotification, removeNotification, markAsRead /* ... all action dependencies */]
  );
};
```

**Why this matters:**
- Zustand actions are stable, but the object containing them is recreated on each render
- Without `useMemo`, components using `useNotificationActions()` will re-render even when actions haven't changed
- This pattern ensures optimal performance and prevents cascading re-renders

**Alternative: `useShallow(selectActions)`**
Many stores (notification, feeds, polls, app, admin, analytics) use `const selectXActions = (state) => ({ ... });` plus `useXStore(useShallow(selectXActions))` instead of per-action selectors and `useMemo`. This is equivalent: `useShallow` keeps the returned object referentially stable when action refs are unchanged. Prefer one pattern consistently per store.

**Alternative for simple cases:**
If a store has only a few actions, you can return them directly without `useMemo`, but the memoized pattern is preferred for consistency and future-proofing.

### Shared Helpers

- Use `createBaseStoreActions(setDraft)` from `web/lib/stores/baseStoreActions.ts` whenever a store exposes the standard loading/error trio. It keeps behaviour consistent across stores and lets us add cross-cutting instrumentation in one place later.
- Add store-specific status setters (e.g., `setVoting`, `setSending`) in addition to—rather than instead of—the shared helper.

**Stores using `createBaseStoreActions`:** userStore, feedsStore, pollsStore, performanceStore, pollWizardStore, profileStore, electionStore, representativeStore, pwaStore, deviceStore, analyticsStore, hashtagStore, hashtagModerationStore, contactStore, votingStore, voterRegistrationStore. (adminStore, appStore, and notificationStore implement their own loading/error helpers.)

**Persisted stores and `partialize`:** Each persisted store must define `partialize` in its persist config. Document what is stored vs excluded (see "Persistence with partialize" above). Current stores with `partialize`: appStore (theme, sidebar, settings), adminStore, pollsStore (preferences, filters, search, voteHistory), notificationStore (settings), feedsStore, performanceStore, pollWizardStore, profileStore, representativeStore, pwaStore, deviceStore, analyticsStore, hashtagStore, hashtagModerationStore, votingStore, onboardingStore, userStore, widgetStore. `voterRegistrationStore` uses `partialize: () => ({})` (no persistence). Keep payloads small and exclude loading/error/transient state. For feeds-store telemetry (success toasts, consent, events), see `docs/guides/feeds-telemetry.md`.
- Export selector bundles when a store has complex consumers (e.g., `analyticsSelectors`, `analyticsChartSelectors`, `analyticsStatusSelectors`). Re-export them via `web/lib/stores/index.ts` so features do not import the store module directly.
- When a feature owns multiple surfaces (web + PWA + harness), add a thin façade under `features/<feature>/lib/store.ts` that re-exports only the selectors/actions that surface needs. This keeps feature code from depending on the entire store module and matches the pattern now used by `features/voting/lib/store.ts`.
- Feature-level hook bundles should wrap store selectors/actions rather than duplicating state locally. The profile feature (`features/profile/hooks/use-profile.ts`) now mirrors this approach—components such as `ProfileEdit`, `ProfileAvatar`, and `MyDataDashboard` consume only the selectors/actions exposed by the hooks, keeping store usage consistent across the UI.

### Cross-Store Cascades

When a user logs out or transitions to an unauthenticated state, related stores should reset to prevent stale data from persisting. The `userStore` orchestrates this cascade:

- **User store actions that trigger cascade**: `setAuthenticated(false)`, `setUserAndAuth(..., false)`, `setSessionAndDerived(null)`, `initializeAuth(..., false)`, and `signOut()` all reset the user store and then call `useProfileStore.getState().resetProfile()` and `useAdminStore.getState().resetAdminState()`.
- **Why this matters**: Without the cascade, profile preferences, admin notifications, and other user-specific state can persist after logout, causing confusion when a new user signs in or when testing auth flows.
- **Testing**: The cascade is covered by `web/tests/unit/stores/authCascade.test.ts` and end-to-end in `web/tests/e2e/specs/dashboard-auth.spec.ts`. When adding new stores that depend on user authentication, ensure they either:
  1. Subscribe to `userStoreSubscriptions.onAuthChange()` and reset when `isAuthenticated` becomes `false`, or
  2. Are explicitly reset by the user store's logout/sign-out actions if they contain user-specific data.

**Example**: If you add a `preferencesStore` that stores user-specific UI preferences, add `usePreferencesStore.getState().resetPreferences()` to the user store's `signOut()` action (or subscribe to auth changes).

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

Current harness coverage: `admin-store`, `analytics-store`, `app-store`, `auth-access`, `feeds-store`, `feedback`, `notification-store`, `onboarding-store`, `onboarding-flow`, `poll-create`, `poll-run/[id]`, `poll-wizard`, `polls-store`, `profile-store`, `pwa-analytics`, `pwa-store`, `user-store`, and `voting-store`. Use these as blueprints when modernizing the remaining stores. (🆕 `voterRegistrationStore` follows the standards with unit coverage; add a harness once we start tracking CTA analytics.)

---

## Modernization Workflow

1. **Inventory consumers** — `rg "use<Store>" web` to find features relying on the store.
2. **Refactor core** — pull initial state/actions into helpers, export `use<Store>Actions`, add selectors.
3. **Update consumers** — migrate components/tests to the new hooks; avoid `getState()` in React components.
4. **Testing** — add/refresh unit + integration suites; build Playwright harness if the store drives UI interactions.
5. **Docs & checklist** — mark progress in `docs/STATE_MANAGEMENT.md` (this guide) and `docs/ROADMAP_SINGLE_SOURCE.md` instead of `scratch/*`. Add or update examples here if new patterns emerge.
6. **Election alerts** — civics features that surface countdowns should call `useElectionCountdown` with `notify`, `notificationSource`, and threshold metadata so the hook can dedupe per election/division and dispatch through `notificationStoreUtils.createElectionNotification`.

## Migration Guide: Legacy Stores → Modernized Pattern

This guide helps migrate stores from legacy patterns to the modernized creator pattern.

### Step 1: Extract Initial State

**Before:**
```ts
export const useMyStore = create<MyStore>()(
  devtools(
    persist(
      (set, get) => ({
        count: 0,
        name: '',
        isLoading: false,
        // ... all state inline
      }),
      { name: 'my-store' }
    )
  )
);
```

**After:**
```ts
export const createInitialMyState = (): MyState => ({
  count: 0,
  name: '',
  isLoading: false,
  error: null,
});

export const initialMyState: MyState = createInitialMyState();
```

### Step 2: Extract Actions

**Before:**
```ts
export const useMyStore = create<MyStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        increment: () => set((state) => ({ count: state.count + 1 })),
        setName: (name: string) => set({ name }),
      }),
      { name: 'my-store' }
    )
  )
);
```

**After:**
```ts
export const createMyActions = (
  set: StoreApi<MyStore>['setState'],
  get: StoreApi<MyStore>['getState']
): MyActions => ({
  increment: () => set((state) => ({ count: state.count + 1 })),
  setName: (name: string) => set({ name }),
  ...createBaseStoreActions(set), // Use shared helpers
});

type MyStoreCreator = StateCreator<
  MyStore,
  [['zustand/devtools', never], ['zustand/persist', unknown], ['zustand/immer', never]]
>;
```

### Step 3: Create Store Creator

**After:**
```ts
export const myStoreCreator: MyStoreCreator = (set, get) =>
  Object.assign(createInitialMyState(), createMyActions(set, get));

export const useMyStore = create<MyStore>()(
  devtools(
    persist(
      immer(myStoreCreator),
      { name: 'my-store', storage: createSafeStorage() }
    ),
    { name: 'MyStore' }
  )
);
```

### Step 4: Add Selectors and Action Hooks

**After:**
```ts
export const mySelectors = {
  count: (state: MyStore) => state.count,
  name: (state: MyStore) => state.name,
  isLoading: (state: MyStore) => state.isLoading,
} as const;

export const useMyCount = () => useMyStore(mySelectors.count);
export const useMyName = () => useMyStore(mySelectors.name);
export const useMyActions = () => {
  const increment = useMyStore((state) => state.increment);
  const setName = useMyStore((state) => state.setName);
  
  return useMemo(
    () => ({ increment, setName }),
    [increment, setName]
  );
};
```

For grouped selections, wrap `useShallow`:

```ts
export const useMyCounts = () =>
  useMyStore(
    useShallow((state) => ({
      count: state.count,
      pending: state.pending,
    }))
  );
```

### Step 5: Update Consumers

**Before:**
```tsx
function MyComponent() {
  const { count, increment } = useMyStore();
  // or
  const count = useMyStore((state) => state.count);
  const increment = useMyStore((state) => state.increment);
}
```

**After:**
```tsx
function MyComponent() {
  const count = useMyCount();
  const { increment } = useMyActions();
  // or for multiple values:
  const { count, name } = useMyStore(
    useShallow((state) => ({ count: state.count, name: state.name }))
  );
}
```

### Common Pitfalls

1. **Don't call `create()` inside the module** — use the creator pattern instead
2. **Don't use `getState()` in React components** — use selectors or action hooks
3. **Don't forget `useMemo` in action hooks** — prevents unnecessary re-renders
4. **Don't persist everything** — use `partialize` to exclude transient state
5. **Don't skip tests** — add unit, integration, and E2E tests for modernized stores

---

## References

- Notification store modernization PRs — see `web/lib/stores/notificationStore.ts`, `web/features/civics/utils/civicsCountdownUtils.ts` (election notification hook), and tests covering analytics + countdown notifications (`web/tests/unit/stores/notification.integration.test.tsx`, `web/tests/unit/features/civics/useElectionCountdown.test.ts`).
- Voter registration store example — see `web/lib/stores/voterRegistrationStore.ts` and `tests/unit/stores/voter-registration.store.test.ts` for a fetch-centric pattern that still fits the shared helpers.
- Development setup & testing commands — `docs/GETTING_STARTED.md`, `docs/TESTING.md`.
- Technical backlog — `docs/ROADMAP.md`.  
- Canonical utilities — `docs/CODEBASE_NAVIGATION.md` § Canonical Utilities.

---

## Consolidation Notes (Scratch → Docs)

- The following scratch checklists/roadmaps are superseded by this guide and the single-source roadmap:
  - `scratch/gpt5-codex/store-roadmaps/*` (store checklists and modernization tasks)
  - `scratch/gpt5-codex/roadmaps/*` (web store modernization lines)
- Action:
  - Track store modernization in `docs/ROADMAP_SINGLE_SOURCE.md` (Section C) and update this guide with patterns and examples.
  - Treat scratch documents as archived references. Do not add new roadmap items under `scratch/` going forward.

For questions, drop a note in `#web-platform` or annotate the relevant checklist in `/scratch`.

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** TBD

