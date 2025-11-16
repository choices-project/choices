# Refactoring the Profile Store (Zustand Modernization Checklist)

_Last updated: November 9, 2025_

This guide walks through refactoring `web/lib/stores/profileStore.ts` to align with the `docs/zustand-store-standards.md`. The same approach works for other complex Zustand stores that still use the “all-in-one creator” pattern.

---

## 1. Goals
- Split the store into **state** and **actions** to avoid deep type instantiation (e.g. TS2589).
- Export a reusable `initialState` and `createProfileActions` factory for tests and other tooling.
- Keep runtime behaviour identical while making it easier to unit test actions in isolation.
- Remove ad‑hoc type assertions and favour canonical Supabase / Zod types.

---

## 2. Prerequisites
- Read `docs/zustand-store-standards.md`.
- Confirm you have `npm install` at the repo root (`/Users/alaughingkitsune/src/Choices`).
- Familiarity with TypeScript utility types and Zustand middleware order (e.g. `devtools(persist(immer(...)))`).

---

## 3. Refactor Plan

### Step 1: Snapshot the current behaviour
1. Note any runtime differences between `ProfileStore` and related services (`profile-service`, `userStore` etc.).
2. Run the existing unit tests (once TypeScript debt is cleared):  
   ```bash
   cd web
   npm run test -- tests/unit/stores/profileStore.test.ts
   ```

### Step 2: Define dedicated types
Create three exported types near the top of the file:
```ts
export type ProfileState = {...} & BaseStore;
export type ProfileActions = {...};
export type ProfileStore = ProfileState & ProfileActions;
```
Keep `BaseStore` fields (`isLoading`, `error`, `setLoading`, `setError`, `clearError`) in the actions interface so middleware ordering stays consistent.

### Step 3: Extract the initial state
Replace the inline object with:
```ts
export const initialProfileState: ProfileState = {
  profile: null,
  userProfile: null,
  ...
};
```

### Step 4: Build an actions factory
Add a pure helper that receives Zustand’s `set`/`get` and returns `ProfileActions`:
```ts
const createProfileActions = (
  set: Parameters<ProfileStoreCreator>[0],
  get: Parameters<ProfileStoreCreator>[1]
): ProfileActions => ({
  setLoading: (loading) => { ... },
  ...
});
```
Inside each action:
- Use `set((state) => { ... })` instead of returning objects.  
- Avoid mutating `state` outside Immer blocks.  
- Prefer Zod helpers (`safeParse`, schema `.partial()`) and explicit builder functions over the legacy `withOptional` helper.

### Step 5: Recompose the store
The final `profileStoreCreator` becomes:
```ts
export const profileStoreCreator: ProfileStoreCreator = (set, get) => ({
  ...initialProfileState,
  ...createProfileActions(set, get),
});
```

### Step 6: Rebuild `useProfileStore`
Wrap the creator with middleware in the same order:
```ts
export const useProfileStore = create<ProfileStore>()(
  devtools(
    persist(
      immer(profileStoreCreator),
      { name: 'profile-store', partialize: ... }
    ),
    { name: 'profile-store' }
  )
);
```
Make sure `partialize` only persists lightweight fields (no circular references or large objects).

### Step 7: Update selectors and hooks
No changes required for simple selectors, but confirm TypeScript infers the new state/actions mix.

---

## 4. Testing Checklist
1. **TypeScript:**  
   ```bash
   cd web
   npm run types:tests  # or npx tsc --noEmit --pretty false
   ```
2. **Unit tests:**  
   ```bash
   npm run test -- tests/unit/stores/profileStore.test.ts
   ```
3. **Smoke test the UI:** Run the Next.js app and confirm profile flows still work.

---

## 5. Troubleshooting Tips
| Issue | Likely Cause | Fix |
| --- | --- | --- |
| `TS2589: Type instantiation is excessively deep` | Actions still inline inside `immer` creator | Ensure all functions live inside `createProfileActions` |
| `Property 'setLoading' is missing` | `ProfileActions` didn’t inherit `BaseStore` | Extend `ProfileActions` with `BaseStore` methods |
| Persisted state bloats | `partialize` returns entire store | Limit persisted keys (`profile`, `isProfileLoaded`, etc.) |
| Tests still mutate state unsafely | Tests import `useProfileStore` directly | Update tests to use `create(initialProfileState, createProfileActions)` |

---

## 6. Next Steps
- Mirror this pattern across other complex stores (`feedsStore`, `pwaStore`, etc.).
- After each refactor, update `docs/ROADMAP.md` with progress.
- Consider adding a helper in `lib/stores/testing.ts` to spin up isolated in-memory stores for Jest.

---

Questions? Ping the maintainers in `#web-platform`. 

