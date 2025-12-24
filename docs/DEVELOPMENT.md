# Development Guide

**Last Updated**: November 12, 2025

---

## Prerequisites

- Node.js 24.11+ (matches the enforced version in `web/package.json`)
- npm 11.6.1+ (enforced via `packageManager` field in `web/package.json` and CI workflows)
- Supabase CLI (`npm install -g supabase`), required for migrations/type generation
- Supabase account
- Git

**Note**: All CI/CD workflows enforce npm 11.6.1 for consistency. The Dockerfile and GitHub Actions workflows are configured to use this exact version to ensure reproducible builds.

---

## Setup

### 1. Clone & Install
```bash
git clone <repo>
cd Choices/web
npm install
```

### 2. Environment Variables
Create `web/.env.local` and populate it using the values documented in `ENVIRONMENT_VARIABLES.md`. At minimum you need:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Database Setup
Generated Supabase types are committed, but regenerate them any time migrations change:
```bash
supabase link --project-ref <your-project-id>   # run once
npm run types:generate                           # inside web/
# wraps: npx supabase gen types typescript --project-id <project> > web/types/supabase.ts
```

### 4. Run Development Server
```bash
npm run dev
```

### Quick Runbook (Day-to-day)

```bash
# From repository root unless noted otherwise

# 1) Keep types current after migrations (inside web/)
cd web && npm run types:generate

# 2) Validate locally like CI
npm run check

# 3) Refresh I18N snapshots (inside web/)
npm run i18n:extract
```

---

## Project Structure

```
web/
├── app/                  # Next.js App Router routes, layouts, API handlers, E2E harness pages
├── features/             # Feature modules (polls, analytics, admin, onboarding, civics)
├── lib/                  # Shared utilities, services, and Zustand stores
├── components/           # Shared UI components
├── tests/                # Jest + Playwright suites
├── supabase/             # SQL migrations and generated metadata
└── types/                # TypeScript type definitions (Supabase, domain models)
```

---

## Database

See `DATABASE_SCHEMA.md` for an overview of tables, views, and RPC functions. Supabase types are generated into `web/types/supabase.ts` and re-exported via `web/types/database.d.ts`.

Typical import pattern:

```ts
import type { Database } from '@/types/database';
```

---

## Code Standards

- **Linting**: `npm run lint`
- **Type check**: `npm run type-check`
- **Config**: Rules live in `web/eslint.config.js`; formatting follows the repo-standard Prettier settings.
- **Governance**: run `npm run governance:check` before opening a PR. The script verifies that store/layout or API changes are paired with updates to their roadmap/docs/changelog entries. (Use `GOVERNANCE_BYPASS=1 npm run governance:check` only when an owner explicitly approves the bypass.)

### Key Rules
- Use `??` for nullish coalescing (not `||` for non-boolean)
- Prefer optional chaining (`?.`)
- No unused variables
- Proper JSDoc on complex functions
 - Do not use the deprecated `withOptional` helper. Prefer explicit object construction and conditional spreads. Examples:
   - Request options: `const opts = { ...base, ...(signal ? { signal } : {}) }`
   - Domain builders: set fields conditionally, e.g. `if (value !== undefined) obj.field = value`

---

## Testing

```bash
npm run test           # Jest unit + integration tests
npm run test:e2e       # Playwright suites (uses mocks by default)
```

See `TESTING.md` for the broader strategy and harness overview.

---

## Zustand Store Modernization Guidelines

- **Shared helpers**: when writing to a store, import selector hooks or `use<Store>Actions` (e.g. `useNotificationActions`) from the store module instead of calling `use<Store>Store(getState)` directly. This keeps consumers aligned with the modernization playbook.
- **Integration coverage**: add React Testing Library suites that instantiate the creator in isolation. See `tests/unit/stores/notification.integration.test.tsx` for the reference pattern (fake timers + helper stubs).
- **Playwright harnesses**: expose harness pages under `/app/(app)/e2e/<store>` that register a `window.__<store>Harness` facade. The notification store example lives at `/app/(app)/e2e/notification-store/page.tsx` with its spec in `tests/e2e/specs/notification-store.spec.ts`.
- **Documentation**: consult `STATE_MANAGEMENT.md` for standards/checklists and track work in `scratch/ROADMAP_SINGLE_SOURCE.md` (canonical location for outstanding work).

### Import order hygiene (Admin/E2E harnesses)

- Group imports by source: external → internal (`@/lib`, `@/features`, `@/components`) → relative (`../` or `./`).
- Maintain a blank line between import groups.
- For type-only imports, co-locate with their module group.
- For harness logging, prefer `console.warn` or `console.error`; other console methods are blocked by lint rules.

Example:
```ts
import { QueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';

import { useAppActions } from '@/lib/stores/appStore';
import { AdminLayout } from '../layout/AdminLayout';
```

### API tests that hit Supabase chains

When mocking Supabase in tests, keep chainability explicit:
```ts
mockFrom.mockReturnValue({
  select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }),
  update: () => ({ eq: () => ({ error: null }) }),
});
```

---

## Common Tasks

### Create a Poll
1. Navigate to `/polls/create`
2. Use poll wizard (Zustand store)
3. Poll saved to `polls` table

### Add a Feature
1. Create in `features/[feature-name]/`
2. Use Zustand for state (pattern established)
3. Follow existing patterns
4. Update `FEATURES.md`

### Database Migration
1. Create SQL in `supabase/migrations/`
2. Apply: `supabase db push`
3. Regenerate types (see above)
4. Archive old migration files per the Supabase docs if they are superseded

---

_See `README.md` for documentation index_

