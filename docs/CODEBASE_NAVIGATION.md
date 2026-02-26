# Codebase Navigation Guide

_Last updated: January 2026_

This guide helps you understand the Choices codebase structure and find what you're looking for quickly.

## High-Level Structure

```
Choices/
├── web/                    # Main Next.js application
│   ├── app/                # Next.js App Router
│   ├── features/           # Feature modules
│   ├── lib/                # Shared libraries and utilities
│   ├── components/         # Shared UI components
│   ├── tests/              # Test suites
│   └── types/              # TypeScript definitions
├── supabase/               # Database migrations
├── services/               # Backend services (civics-backend)
└── docs/                   # Documentation
```

## Key Directories

### `web/app/` - Next.js App Router

**Pages and Routes:**
- `app/(app)/` - Main application pages (dashboard, polls, analytics, etc.)
- `app/auth/` - Authentication pages
- `app/landing/` - Landing page
- `app/(app)/e2e/` - E2E test harness pages (development only)

**API Routes:**
- `app/api/` - All API endpoints
  - `api/admin/` - Admin-only endpoints
  - `api/analytics/` - Analytics endpoints
  - `api/auth/` - Authentication endpoints
  - `api/polls/` - Poll management
  - `api/pwa/` - PWA features (notifications, offline sync)
  - `api/v1/` - Versioned API endpoints

### `web/features/` - Feature Modules

Each feature is self-contained with its own components, hooks, and logic:

- `features/polls/` - Poll creation, voting, results
- `features/analytics/` - Analytics dashboard and widgets
- `features/civics/` - Civic engagement, representatives, elections
- `features/onboarding/` - User onboarding flow
- `features/profile/` - User profile management
- `features/pwa/` - Progressive Web App features
- `features/admin/` - Admin dashboard and tools
- `features/auth/` - Authentication components
- `features/voting/` - Voting system
- `features/feeds/` - User feeds and content
- `features/hashtags/` - Hashtag system
- `features/contact/` - Contact system
- `features/dashboard/` - Main dashboard
- `features/share/` - Social sharing

**Feature Structure Pattern:**
```
features/[feature-name]/
├── components/     # Feature-specific UI components
├── hooks/          # Feature-specific React hooks
├── lib/            # Feature-specific utilities
├── types.ts        # Feature-specific TypeScript types
└── README.md       # Feature documentation (if exists)
```

### `web/lib/` - Shared Libraries

**Stores (State Management):**
- `lib/stores/` - Zustand stores
  - `appStore.ts` - App-level state (theme, sidebar, etc.)
  - `profileStore.ts` - User profile state
  - `notificationStore.ts` - Notification system
  - `analyticsStore.ts` - Analytics state
  - `pollsStore.ts` - Poll state
  - `deviceStore.ts` - Device detection and PWA state
  - `widgetStore.ts` - Analytics widget dashboard state

**Utilities:**
- `lib/api/` - API response helpers, error handling
- `lib/utils/` - General utilities (logger, date helpers, etc.)
- `lib/core/` - Core functionality (feature flags, database optimizer)
- `lib/rate-limiting/` - Rate limiting utilities
- `lib/http/` - HTTP utilities (origin validation, CORS)

**Services:**
- `lib/services/` - External service integrations

### `web/components/` - Shared UI Components

- `components/shared/` - Reusable components (AppShell, ErrorBoundary, etc.)
- `components/ui/` - shadcn/ui components
- `components/charts/` - Chart components (Recharts)
- `components/accessible/` - Accessibility-focused components
- `components/auth/` - Authentication UI components
- `components/admin/` - Admin-specific components

### `web/tests/` - Test Suites

- `tests/unit/` - Jest unit tests
- `tests/integration/` - Integration tests
- `tests/e2e/` - Playwright E2E tests
- `tests/contracts/` - API contract tests
- `tests/fixtures/` - Test data and mocks
- `tests/msw/` - Mock Service Worker setup

### `web/types/` - TypeScript Definitions

- `types/supabase.ts` - Auto-generated Supabase types
- `types/database.d.ts` - Database type exports
- `types/*.ts` - Other type definitions

## Finding Specific Code

### "Where do I find..."

**Authentication logic?**
- Components: `features/auth/components/`
- API: `app/api/auth/`
- Store: `lib/stores/userStore.ts` (if exists) or `lib/stores/profileStore.ts`
- Context: `contexts/AuthContext.tsx`

**Poll creation?**
- Components: `features/polls/components/`
- API: `app/api/polls/route.ts`
- Store: `lib/stores/pollsStore.ts`
- Types: `features/polls/types.ts`

**Analytics dashboard?**
- Components: `features/analytics/components/`
- API: `app/api/analytics/`
- Store: `lib/stores/analyticsStore.ts` and `lib/stores/widgetStore.ts`
- Widgets: `features/analytics/components/widgets/`

**Database queries?**
- Direct Supabase calls: Look in `app/api/` routes
- RPC functions: `supabase/migrations/` (SQL files)
- Types: `types/supabase.ts`

**State management?**
- Stores: `lib/stores/`
- Patterns: See [`STATE_MANAGEMENT.md`](STATE_MANAGEMENT.md)
- Hooks: Each store exports `use[Store]` hooks

**API endpoints?**
- Routes: `app/api/`
- Contracts: [`docs/API/contracts.md`](API/contracts.md)
- API overview: [`docs/API/README.md`](API/README.md)

**Testing utilities?**
- Helpers: `tests/e2e/helpers/`
- Fixtures: `tests/fixtures/`
- Mocks: `tests/msw/`
- Harnesses: `app/(app)/e2e/`

**Feature flags?**
- Definition: `lib/core/feature-flags.ts`
- Usage: `lib/core/feature-flags.ts` exports `featureFlagManager`
- Status: [`docs/FEATURE_STATUS.md`](FEATURE_STATUS.md)

**Environment variables?**
- Documentation: [`docs/ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md)
- Usage: Check `.env.local.example` or search for `process.env`

**Database schema?**
- Types: `types/supabase.ts` (auto-generated)
- Documentation: [`docs/DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md)
- Migrations: `supabase/migrations/`

**Civics ingest (representative data)?**
- Service: `services/civics-backend/`
- Docs: [`GETTING_STARTED.md`](../services/civics-backend/NEW_civics_ingest/docs/GETTING_STARTED.md), [`OPERATOR_RUNBOOK.md`](../services/civics-backend/NEW_civics_ingest/docs/OPERATOR_RUNBOOK.md)
- Commands: `npm run ingest:setup` then `npm run ingest` (from `services/civics-backend/`)

## Code Patterns

### Adding a New Feature

1. Create directory: `features/[feature-name]/`
2. Add components: `features/[feature-name]/components/`
3. Add hooks: `features/[feature-name]/hooks/`
4. Add types: `features/[feature-name]/types.ts`
5. Create API routes: `app/api/[feature-name]/`
6. Add store (if needed): `lib/stores/[feature]Store.ts`
7. Add tests: `tests/unit/features/[feature-name]/`

### Adding a New API Endpoint

1. Create route: `app/api/[endpoint]/route.ts`
2. Use helpers: Import from `@/lib/api` (`withErrorHandling`, `successResponse`, etc.)
3. Add authentication: Use `requireAuth()` or `requireAdminOr401()`
4. Document: Update [`docs/API/README.md`](API/README.md)
5. Add tests: `tests/unit/api/[endpoint]/` or `tests/contracts/`

### Adding a New Store

1. Create store: `lib/stores/[name]Store.ts`
2. Follow pattern: See [`STATE_MANAGEMENT.md`](STATE_MANAGEMENT.md)
3. Export hooks: `use[Name]`, `use[Name]Actions`, selectors
4. Add tests: `tests/unit/stores/[name].test.ts`
5. Add harness: `app/(app)/e2e/[name]-store/page.tsx` (if needed)

## Import Paths

The project uses TypeScript path aliases:

- `@/` - `web/` directory root
- `@/lib/` - Shared libraries
- `@/features/` - Feature modules
- `@/components/` - Shared components
- `@/types/` - Type definitions
- `@/hooks/` - Shared hooks

Example:
```typescript
import { useProfileStore } from '@/lib/stores/profileStore';
import { PollCard } from '@/features/polls/components/PollCard';
import type { Database } from '@/types/database';
```

## Key Files to Know

**Configuration:**
- `web/package.json` - Dependencies and scripts
- `web/tsconfig.json` - TypeScript configuration
- `web/next.config.js` - Next.js configuration
- `web/eslint.config.js` - ESLint rules
- `web/playwright.config.ts` - Playwright E2E config

**Entry Points:**
- `web/app/layout.tsx` - Root layout
- `web/app/(app)/layout.tsx` - App layout
- `web/app/page.tsx` - Home page
- `web/middleware.ts` - Next.js middleware

**Utilities:**
- `web/lib/utils/logger.ts` - Logging utility
- `web/lib/api/index.ts` - API response helpers
- `web/lib/core/feature-flags.ts` - Feature flag system

## Canonical Utilities (Prefer Over Ad-Hoc)

| Task | Import From | Notes |
|------|-------------|-------|
| Date/time | `@/lib/utils/format-utils` | `nowISO`, `formatISODateOnly` |
| Browser detection | `@/lib/utils/browser-utils` | `detectBrowser`, `getRedirectStrategy`, `navigateTo` |
| SSR-safe DOM | `@/lib/utils/ssr-safe` | `isBrowser`, `safeNavigate` |
| API responses | `@/lib/api` | `withErrorHandling`, `successResponse`, `errorResponse` |
| CORS | `@/lib/api/response-utils` | `corsPreflightResponse`, `withCors` |
| Origin validation | `@/lib/http/origin` | `requireTrustedOrigin` |
| Logging | `@/lib/utils/logger` | `logger`, `devLog`, `logError` |

Do not use deprecated paths: `@/lib/utils/http`, `@/lib/utils/cors`, `@/lib/utils/csrf*` (ESLint blocks them).

## Tips for Navigation

1. **Use your IDE's "Go to Definition"** - Most code has JSDoc comments
2. **Search by filename** - Files are named descriptively
3. **Check feature READMEs** - Some features have `README.md` files
4. **Look at tests** - Tests show how code is used
5. **Check the docs** - [`docs/README.md`](README.md) has the full index

## Still Lost?

- Check [`ARCHITECTURE.md`](ARCHITECTURE.md) for system design
- Read [`GETTING_STARTED.md`](GETTING_STARTED.md) for setup and runbook
- See [`TESTING.md`](TESTING.md) for testing patterns
- Review [`STATE_MANAGEMENT.md`](STATE_MANAGEMENT.md) for state patterns

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** TBD

