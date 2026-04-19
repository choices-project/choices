# Architecture Overview

_Last updated: April 5, 2026_

The Choices platform is a TypeScript/React application built with the Next.js App Router and backed by Supabase. The application uses a feature-module architecture with Zustand for state management, shadcn/ui design tokens for theming, and Framer Motion for animations.

---

## High-Level Diagram

```
┌──────────────────────────────────────────────────────┐
│ Client (Next.js 14 / React)                          │
│ ├─ App Router routes (web/app/)                      │
│ ├─ Feature modules (web/features/*)                  │
│ ├─ React contexts (web/contexts/*)                   │
│ ├─ Zustand stores (web/lib/stores/*)                 │
│ ├─ UI primitives (web/components/)                   │
│ ├─ Design tokens (web/app/globals.css)               │
│ └─ Service worker / PWA shell                        │
└──────────────────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────┐
│ Application Runtime (Vercel / Node)                  │
│ ├─ API routes (web/app/api/*)                        │
│ ├─ Edge middleware (auth, headers, rate limiting)     │
│ ├─ Upstash Redis (rate limiting + caching)           │
│ └─ Resend (transactional email)                      │
└──────────────────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────┐
│ Supabase                                             │
│ ├─ PostgreSQL (~93 public tables, 7 views, ~63 RPCs)   │
│ ├─ Row Level Security policies                       │
│ ├─ Auth (email, OAuth, WebAuthn/passkeys)            │
│ ├─ Storage buckets                                   │
│ └─ Realtime subscriptions                            │
└──────────────────────────────────────────────────────┘
```

---

## Project Structure

```
Choices/
├── web/                        # Main Next.js application
│   ├── app/                    # App Router (pages, layouts, API routes)
│   │   ├── (app)/              # Authenticated app pages
│   │   ├── api/                # API endpoints
│   │   ├── auth/               # Auth pages
│   │   └── landing/            # Public landing page
│   ├── features/               # Feature modules (self-contained)
│   │   ├── polls/              # Poll creation, voting, results
│   │   ├── civics/             # Representatives, civic actions, elections
│   │   ├── feeds/              # User feeds and content
│   │   ├── analytics/          # Analytics dashboard and widgets
│   │   ├── admin/              # Admin dashboard and tools
│   │   ├── voting/             # Voting system (6 methods)
│   │   ├── profile/            # User profile management
│   │   ├── onboarding/         # User onboarding flow
│   │   ├── contact/            # Contact system
│   │   ├── hashtags/           # Hashtag system
│   │   ├── dashboard/          # Main dashboard
│   │   ├── pwa/                # Progressive Web App features
│   │   ├── auth/               # Auth components
│   │   └── share/              # Social sharing
│   ├── lib/                    # Shared libraries
│   │   ├── stores/             # Zustand (~21 store modules; see cascade note below)
│   │   ├── api/                # API client and response helpers
│   │   ├── config/             # Environment validation (Zod)
│   │   ├── core/               # Feature flags, database optimizer
│   │   ├── rate-limiting/      # Rate limiting utilities
│   │   ├── animations.ts       # Framer Motion variants
│   │   └── utils/              # Logger, date helpers, sanitization
│   ├── components/             # Shared UI components
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── shared/             # App-wide components
│   │   └── charts/             # Recharts wrappers
│   ├── messages/               # i18n translation files
│   ├── hooks/                  # Shared custom hooks
│   ├── contexts/               # App-wide React providers (e.g. AuthContext)
│   ├── scripts/                # Operational scripts (ingest, audits, CI helpers)
│   ├── tests/                  # Jest + Playwright test suites
│   └── types/                  # TypeScript type definitions
├── supabase/                   # Database migrations
├── services/                   # Backend services
│   └── civics-backend/         # Representative data ingest
└── docs/                       # Documentation
```

---

## Frontend Architecture

### Feature Modules

Each feature is self-contained with components, hooks, types, and optionally its own README:

```
features/[name]/
├── components/     # Feature-specific UI
├── hooks/          # Feature-specific React hooks
├── lib/            # Feature-specific utilities
├── pages/          # Feature page components
├── context/        # React context (e.g., FeedContext)
└── types.ts        # Feature-specific types
```

### State Management

Zustand stores follow the creator pattern with Immer middleware. See [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md) for the full guide.

- **Store modules** — About twenty-one Zustand stores live under `web/lib/stores/`. On logout / auth clear, `userStore` calls `cascadeDependentStoreReset()`, which resets **17** dependent stores (profile, admin, polls, feeds, analytics, hashtag, voting, contact, notification, onboarding, representative, election, PWA, widget, poll wizard, voter registration, hashtag moderation). **`userStore`** clears its own session state first; **`appStore`**, **`deviceStore`**, and **`performanceStore`** are not part of that cascade—extend the cascade if a store caches user-scoped data and must empty on sign-out.
- Add new user-scoped stores to the cascade in `web/lib/stores/userStore.ts` (or subscribe to auth) as described in [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md).
- Selectors + action hooks prevent unnecessary re-renders

### Design System

- **Design tokens** — HSL-based CSS custom properties in `globals.css` (`--background`, `--foreground`, `--card`, `--muted`, `--border`, etc.)
- **Tailwind integration** — Semantic classes (`bg-card`, `text-foreground`, `border-border`) with automatic light/dark/high-contrast support
- **UI primitives** — shadcn/ui components (Button, Card, Input, Dialog, AlertDialog, etc.)
- **Animations** — Framer Motion (`AnimatedCard`, `AnimatedVoteBar`, `PageTransition`, `BottomSheet`); all respect `prefers-reduced-motion`

### Shared Components

| Component | Purpose |
|-----------|---------|
| `EnhancedEmptyState` | No-data state with guidance and CTAs |
| `EnhancedErrorDisplay` | Error state with recovery options |
| `AnimatedCard` | Framer Motion card entrance animation |
| `VoteSubmitButton` | Shared voting submit with loading state |
| `BottomSheet` | Mobile swipe-to-dismiss bottom sheet |
| `PageTransition` | Route-level transition wrapper |

### Patterns

| Need | Use |
|------|-----|
| Loading states | Skeleton components + `role="status"` `aria-busy="true"` |
| Error handling | `EnhancedErrorDisplay` + route `error.tsx` files |
| Empty states | `EnhancedEmptyState` with actionable CTAs |
| Toast notifications | `useNotificationStore` → `addNotification()` |
| Confirm dialogs | shadcn `AlertDialog` (not `window.confirm`) |
| Modals | `useAccessibleDialog` (focus trap, Escape key) |
| Mobile modals | `BottomSheet` on mobile, `Dialog` on desktop |
| Live announcements | `useLiveAnnouncer` for screen reader updates |

---

## Backend Architecture

### API Routes

All API routes live under `web/app/api/*` and follow consistent patterns:

- **Authentication** — Supabase session auth on all mutating endpoints; admin endpoints require admin role
- **Rate limiting** — Upstash Redis via `apiRateLimiter`; per-route keys and windows in **[`docs/SECURITY.md`](SECURITY.md)** (*Upstash API rate limits*). Edge middleware has separate limits (`web/middleware.ts`).
- **Input validation** — Zod schemas + `sanitizeInput` on user-generated content
- **Response format** — Standard `{ success: boolean, data: T }` envelope via `successResponse()`/`errorResponse()`
- **CSRF protection** — Double-submit token validation on auth endpoints

### Database

- **~93 public tables** and **7 views** in generated types (`web/types/supabase.ts`); **~63 RPC** entries under `public.Functions` (exact JSON: `npm run docs:surface-counts`; diagram + this line vs types: `npm run verify:architecture-schema-counts` / `verify:docs`)
- **RLS** on user-facing tables (see migrations and schema doc)
- **Migrations** managed via `supabase/migrations/`
- **Generated types** in `web/types/supabase.ts` (from `web/`: `npm run types:generate` after schema changes)

### Security

- Rate limiting on sensitive and mutation-heavy endpoints; inventory in **[`SECURITY.md`](SECURITY.md)** (*Upstash API rate limits*)
- **Service role** (`getSupabaseAdminClient`) bypasses RLS—see **[`SECURITY.md`](SECURITY.md)** (*Service role in API routes*) and `rg` maintenance command there
- E2E test bypasses locked out of production (`NODE_ENV !== 'production'`)
- Environment validation at startup (Zod schema in `lib/config/env.ts`)
- **`global-error.tsx`** root boundary + **16** route-level `error.tsx` + **8** `loading.tsx` files under `web/app/` (counts checked by `npm run verify:architecture-boundaries` / `verify:docs`)
- Cookie secure flags, webhook secret enforcement, UUID validation

---

## Canonical Utilities

Prefer these over ad-hoc implementations:

| Task | Import From |
|------|-------------|
| API responses | `@/lib/api` (`successResponse`, `errorResponse`, `withErrorHandling`) |
| Rate limiting | `@/lib/rate-limiting` (`apiRateLimiter`) |
| Logging | `@/lib/utils/logger` (`logger`) |
| Input sanitization | `@/lib/utils/sanitize` (`sanitizeInput`) |
| Env validation | `@/lib/config/env` (`env`, `getValidatedEnv`) |
| Animations | `@/lib/animations` (`fadeUp`, `staggerContainer`) |
| Date/time | `@/lib/utils/format-utils` (`nowISO`, `formatISODateOnly`) |
| Browser detection | `@/lib/utils/browser-utils` (`detectBrowser`) |
| SSR-safe DOM | `@/lib/utils/ssr-safe` (`isBrowser`) |

Do not use deprecated paths: `@/lib/utils/http`, `@/lib/utils/cors`, `@/lib/utils/csrf*` (ESLint blocks them).

---

## Where to change what

| Change | Starting points |
|--------|-----------------|
| Poll create / vote / results UI | `web/features/polls/`, `web/app/api/polls/`, `web/lib/stores/pollsStore.ts`, `votes` / `polls` RLS in `supabase/migrations/` |
| Representative list / card | `web/features/civics/`, `web/lib/stores/representativeStore.ts`, civics API under `web/app/api/v1/civics/` |
| Logout / auth cascade | `web/contexts/AuthContext.tsx` (session ↔ UI), `web/lib/stores/userStore.ts` (`cascadeDependentStoreReset`), [`docs/STATE_MANAGEMENT.md`](STATE_MANAGEMENT.md), [`docs/WEBAUTHN_DESIGN.md`](WEBAUTHN_DESIGN.md) |
| Feature gating | `web/lib/core/feature-flags.ts`, [`docs/FEATURE_FLAGS.md`](FEATURE_FLAGS.md), `GET /api/feature-flags` |
| API response shape | `@/lib/api`, [`docs/API/contracts.md`](API/contracts.md), `web/tests/contracts/` |
| DB schema / types | `supabase/migrations/`, then `npm run types:generate` in `web/`; generated lists: `npm run docs:public-schema-index` (repo root) |
| Service role / RLS bypass | [`docs/SECURITY.md`](SECURITY.md) § Service role; `rg -l getSupabaseAdminClient web/app/api --glob '**/route.ts'` |
| In-app feedback vs GitHub Issues | `web/components/EnhancedFeedbackWidget.tsx`, `web/app/api/feedback/route.ts`, admin triage `web/app/(app)/admin/feedback/` — canonical routes vs gaps: [`docs/FEEDBACK_AND_ISSUES.md`](FEEDBACK_AND_ISSUES.md) §4 |

---

## Testing

- **Unit/RTL** — Jest suites in `tests/unit/` and `tests/integration/`
- **E2E** — Playwright with harness pages at `/app/(app)/e2e/*`
- **Contracts** — API contract tests in `tests/contracts/`
- **Accessibility** — axe-core via `npm run test:e2e:axe`

See [TESTING.md](TESTING.md) for the full testing guide.

---

## Import Paths

```typescript
import { useProfileStore } from '@/lib/stores/profileStore';
import { PollCard } from '@/features/polls/components/PollCard';
import type { Database } from '@/types/database';
```

Path aliases: `@/` maps to the `web/` directory root.
