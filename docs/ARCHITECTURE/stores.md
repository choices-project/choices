# Store Architecture & Layout Contracts
Last updated: 2025-11-15  
Status: Phase C — Draft ready for governance review

---

## 1. Purpose
- Document how `AppShell`, selector hooks, and layout shells share state.
- Provide a contract for adding/changing stores so navigation, theming, and middleware stay aligned.
- Capture remaining rollout work (RTL coverage + civics/contact/account shells) without digging through scratch pads.

Use this alongside `docs/STATE_MANAGEMENT.md` (store implementation standards) and `scratch/gpt5-codex/store-roadmaps/*` (per-store checklists).

---

## 2. AppShell Responsibilities
`web/components/shared/AppShell.tsx` is the only component that touches global app store selectors directly at runtime.

| Concern | Details | Notes |
| --- | --- | --- |
| Theme + color mode | `useAppTheme()` hydrates persisted theme, applies `data-theme` and toggles the `dark` class on `<html>`. | Do **not** set theme classes elsewhere; use the data attribute in CSS (`[data-theme='dark']`). |
| Navigation chrome | `navigation`, `siteMessages`, and optional `feedback` slots render inside `<header>`, `<main>`, `<footer>` with consistent spacing + skip-link targets. | Harness + production layouts rely on `main#main-content`. |
| Sidebar state | `useSidebarCollapsed`, `useSidebarWidth`, `useSidebarPinned` map to `data-sidebar-*` attributes so CSS and harnesses respond without additional state plumbing. |
| Initialization | `appStoreUtils.initialize()` fires once on mount—keep all first-run wiring there (feature flag fetch, locale cookie sync, analytics). |

### Data Attributes Cheat Sheet
- `data-theme`, `data-sidebar-collapsed`, `data-sidebar-pinned`, `data-sidebar-width`
- Applied to the root shell wrapper so nested layouts can hook into theming without importing the store.

---

## 3. Selector & Action Contract
Components should consume *selector hooks* or the memoized action bundle **only**:

- `useAppTheme`, `useAppPreferences`, `useBreadcrumbs`, etc. for read-only data.
- `useAppActions` for composite operations (sets `currentRoute`, `sidebarActiveSection`, `setLanguage`, etc.).
- Avoid `useAppStore((state) => state)` in React trees—only tests and harness pages can read raw state via `useAppStore.getState()`.

### Sidebar + Layout Hooks
Each primary layout (dashboard, polls, profile, analytics, admin, civics, feed, contact, account) now calls:

```ts
const { setSidebarActiveSection, setCurrentRoute } = useAppActions();
useEffect(() => {
  setSidebarActiveSection('dashboard');
  setCurrentRoute('/dashboard');
}, [setSidebarActiveSection, setCurrentRoute]);
```

- Shell-specific selectors live under `web/lib/stores/appStoreSelectors.ts`. Re-export them via `web/lib/stores/index.ts`.
- When adding a new layout, wire `setSidebarActiveSection` and `setBreadcrumbs` inside `useEffect` and cover it with RTL (see `web/tests/unit/layouts/DashboardLayout.test.tsx` pattern).

---

## 4. Middleware Composition & Persistence
All stores follow the `immer -> persist -> devtools` order documented in `STATE_MANAGEMENT.md`. This doc adds layout-context specifics:

1. **Immer first** — ensures actions can mutate drafts safely.
2. **Persist** — use `createSafeStorage()` and a scoped key (`'app-store'`, `'profile-store'`, etc.). Keep `partialize` payloads tight (route + sidebar metadata only).
3. **Devtools** — last in the chain to capture the final state.

> For RTL parity, add `appStoreTestUtils.createStore()` helpers that instantiate the persisted store with in-memory storage. Tests and harnesses should never rely on the browser `localStorage`.

---

## 5. Rollout Checklist (Phase C)
| Item | Owner | Status | Notes |
| --- | --- | --- | --- |
| Civics shell RTL suite (`/civics` selectors) | Platform RTL pod · Phase C owner | 🚧 In progress (target Nov 22) | Mirror `AppShell.test.tsx` assertions to ensure civics uses selector hooks only; track in store roadmap. |
| Contact shell RTL suite | Platform RTL pod · Phase C owner | ☐ Not started (assign by Nov 25) | Validate breadcrumbs + `setSidebarActiveSection('contact')`; add harness capture. |
| Account shell RTL suite | Platform RTL pod · Phase C owner | ☐ Not started (assign by Nov 25) | Ensure profile/account layouts avoid raw store access. |
| Middleware docs | GPT‑5 Codex | ✅ Complete (Nov 15) | Captured above; link from `STATE_MANAGEMENT.md`. |

Mark each row when the corresponding test files land; update this table as new shells migrate.

---

## 6. Verification Strategy
- **Unit / RTL**: Extend `AppShell.test.tsx` to cover new data attributes + skip link expectations. Layout-specific tests should mock `useAppActions`.
- **Harness**: Harness pages (`/e2e/app-shell`, navigation shells) must import selectors from the barrel only. When a harness needs write access, expose controlled helpers on `window.__appShellHarness`.
- **Playwright**: Specs such as `tests/e2e/specs/navigation-shell.spec.ts` assert sidebar state by reading data attributes, not store internals. Keep this invariant to preserve compatibility with the automation stack.

---

## 7. Adding a New Store/Layout
1. Author store following `STATE_MANAGEMENT.md`.
2. Re-export selectors/actions via the barrel.
3. If a layout needs store data:
   - Import selectors only (no direct `useStore` calls).
   - Expose necessary data through props to nested components.
4. Update `docs/STATE_MANAGEMENT.md` if new patterns emerge.
5. Add contract coverage (RTL + harness + Playwright) before wiring production routes.

Keep this document updated as shells evolve so downstream teams have a single reference for navigation/store expectations.

---

## 8. Phase C Governance Deliverables
- **Pull Request Checklist:** All UI-affecting PRs must fill out the inclusive/i18n section in `.github/PULL_REQUEST_TEMPLATE.md`, confirming that `t()` keys, lint, axe specs, and release-note entries were handled. Missing checkboxes result in CI failures.
- **Doc Cross-links:** When a store/layout change lands, update this file *and* `docs/STATE_MANAGEMENT.md` plus the applicable store checklist under `scratch/gpt5-codex/store-roadmaps/`. A link to the relevant section is mandatory in the PR summary.
- **Release Sign-off:** Before tagging a release, verify Section 5 tasks are complete (RTL suites merged or waived) and the audit schedule in `docs/qa/i18n-accessibility-playbook.md#9-audit-schedule` reflects the most recent run.
- **Owner Tracking:** Update the table in Section 5 whenever ownership changes. Owner names/roles are the source of truth for Phase C governance and inform enforcement bots that will land in Phase D.
- **Automation:** Run `npm run governance:check` (or let CI do it) whenever you touch `web/lib/stores/**` to ensure roadmap + doc updates accompany the code changes. Set `GOVERNANCE_BYPASS=1` only when explicitly approved.


