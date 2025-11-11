# Development Guide

**Last Updated**: November 3, 2025

---

## Prerequisites

- Node.js 18+
- pnpm (package manager)
- Supabase account
- Git

---

## Setup

### 1. Clone & Install
```bash
git clone <repo>
cd Choices/web
pnpm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Required variables (see `ENVIRONMENT_VARIABLES.md`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Database Setup
Types are pre-generated. If schema changes:
```bash
supabase link --project-ref <your-project-id>
cd web && npm run types:generate
# Runs: npx supabase gen types typescript --project-id <your-project-id> > types/supabase.ts
```

### 4. Run Development Server
```bash
pnpm dev
```

---

## Project Structure

```
web/
├── app/                  # Next.js 15 app directory
├── features/             # Feature modules (polls, analytics, admin)
├── lib/                  # Utilities and services
├── types/                # TypeScript type definitions
├── utils/                # Supabase clients
└── components/           # React components
```

---

## Database

**Schema**: 64 tables, 33 RPC functions  
**Types**: Auto-generated from Supabase  
**Import**: `import type { Database } from '@/types/database'`

See `DATABASE_SCHEMA.md` for details.

---

## Code Standards

- **Linting**: `pnpm lint`
- **Type check**: `pnpm type-check`
- **Standards**: See `LINT_STANDARDS.md`

### Key Rules
- Use `??` for nullish coalescing (not `||` for non-boolean)
- Prefer optional chaining (`?.`)
- No unused variables
- Proper JSDoc on complex functions

---

## Testing

```bash
pnpm test              # Unit tests
pnpm test:e2e          # E2E tests
```

See `guides/testing/` for details.

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
4. Archive migration to `database/migrations/.archive/`

---

_See `README.md` for documentation index_

