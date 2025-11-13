# Development Guide

**Last Updated**: November 12, 2025

---

## Prerequisites

- Node.js 24.11+ (matches the enforced version in `web/package.json`)
- npm 11+ (ships with the Node.js installer above)
- Supabase CLI (`npm install -g supabase`), required for migrations/type generation
- Supabase account
- Git

---

## Setup

### 1. Clone & Install
```bash
git clone <repo>
cd Choices/web
npm install
```

### 2. Environment Variables
Create `web/.env.local` and populate it using the template in `web/_reports/env.example.txt` or the values documented in `ENVIRONMENT_VARIABLES.md`. At minimum you need:
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

### Key Rules
- Use `??` for nullish coalescing (not `||` for non-boolean)
- Prefer optional chaining (`?.`)
- No unused variables
- Proper JSDoc on complex functions

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
- **Documentation**: track store-specific progress in `scratch/gpt5-codex/store-roadmaps/`, updating action items (consumer audits, harness coverage) as work ships.

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

