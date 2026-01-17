# Architecture Overview

_Last updated: November 9, 2025_

The Choices platform is a TypeScript/React application built with the Next.js App Router and backed by Supabase. The current modernization push centers on unifying our state management layer and tightening analytics/admin flows that still rely on legacy patterns.

---

## High-Level Diagram

```
┌──────────────────────────────────────────────┐
│ Client (Next.js / React)                     │
│ ├─ App Router routes (app/)                  │
│ ├─ Feature modules (web/features/*)          │
│ ├─ Zustand stores (web/lib/stores/*)         │
│ ├─ UI primitives (web/components/*)          │
│ └─ Service worker / PWA shell                │
└──────────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────┐
│ Application runtime (Vercel / Node)          │
│ ├─ Next.js server components & API routes    │
│ ├─ Edge middleware (auth, headers)           │
│ └─ Playwright/Jest harnesses (tests/)        │
└──────────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────┐
│ Supabase                                      │
│ ├─ PostgreSQL (schema.sql + migrations)      │
│ ├─ Row Level Security policies               │
│ ├─ RPC functions (SQL)                       │
│ ├─ Storage buckets (uploads)                 │
│ └─ Auth (email, OAuth, WebAuthn)             │
└──────────────────────────────────────────────┘
```

---

## Frontend Structure

- **App directory (`web/app`)** – App Router pages, layouts, and API routes. Feature-specific harness pages live under `/app/(app)/e2e/*` to support Playwright.
- **Feature modules (`web/features`)** – UI + logic for polls, onboarding, admin, analytics, etc. Modules should consume selectors/action hooks from the shared stores rather than reading raw state.
- **State management (`web/lib/stores`)** – Zustand stores composed with Immer/persist/devtools depending on requirements. Modernized stores export:
  - `create<Store>Actions` and `createInitial<State>()` helpers
  - `use<Store>` selectors for state slices
  - `use<Store>Actions` hooks for mutators
- **UI components (`web/components`)** – Shared presentation primitives and cross-feature widgets.

---

## Backend Integration

- **API Routes** – Live under `app/api/*`, using Supabase client helpers from `web/lib`. Many analytics routes still rely on mocked data; replacing those with Supabase-backed implementations is on the roadmap.
- **Supabase** – PostgreSQL schema plus auth, storage, and realtime capabilities. Database migrations are managed via `supabase/migrations/` and surfaced through generated types in `web/types/supabase.ts`.
- **Caching** – Redis caching exists for analytics endpoints but remains experimental pending type-safety and performance validation.

---

## State Management Modernization

Recent work (notification store, profile store, etc.) follows a standard pattern:

1. Export a pure store creator (`<store>Creator`) and initial state factory.
2. Provide memoized selector hooks to avoid `use<Store>(state => state)`.
3. Add dedicated action hooks (`use<Store>Actions`) so features never pull raw `getState()`.
4. Supply integration harnesses (RTL + Playwright) to validate store behaviour outside app pages.

Reference material lives in `docs/STATE_MANAGEMENT.md` and `docs/ROADMAP_SINGLE_SOURCE.md`.

---

## Data & Privacy

- **Schema** – See `docs/DATABASE_SCHEMA.md` for table and function descriptions. Core tables: `polls`, `poll_options`, `votes`, `user_profiles`, `representatives_core`, `notifications`.
- **RLS Policies** – Enforced for user-facing tables; admin endpoints rely on explicit Supabase service role tokens.
- **Privacy Guardrails** – Analytics endpoints must apply aggregation + k-anonymity before returning data. This work is partially complete and tracked in the roadmap.

---

## Testing & Observability

- **Unit/RTL** – Jest-based suites (`tests/unit/**`) instantiate store creators directly to exercise state transitions.
- **Playwright** – Harness pages expose store hooks via `window.__<store>Harness`. Current coverage: profile store, notification store. Additional harnesses are planned for polls and admin stores.
- **Logging** – Unified logger utilities live under `web/lib/utils/logger.ts`. Audit log ingestion for admin actions is planned but not yet wired to UI workflows.

---

## Next Steps

- Complete store modernization for app, admin, polls, feeds, and analytics modules.
- Replace analytics mocks with Supabase-backed queries and document the privacy pipeline.
- Expand harness-driven E2E coverage to the remaining critical flows (poll creation, civic engagement, feature flags).

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** TBD

