# Getting Started with Choices

_Last updated: April 5, 2026_

Welcome to the Choices platform! This guide targets **about 15 minutes** from clone to a running dev server (longer if you are new to Supabase).

## Prerequisites

Before you begin, ensure you have:

- **Node.js 24.11+** (enforced by the project)
- **npm 11.6.1+** (enforced by the project)
- **Git** for version control
- **Supabase CLI** (`npm install -g supabase`) for database management
- A **Supabase account** (free tier works fine for development)

### Verify Prerequisites

```bash
node --version  # Should be 24.11.0 or higher
npm --version   # Should be 11.6.1 or higher
supabase --version  # Should be installed
```

## Quick Start (5 Minutes)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Choices    # repo root: web/, supabase/, services/, docs/
```

### 2. Install Dependencies

```bash
cd web
npm install
```

### 3. Set Up Environment Variables

From `web/`, start from the tracked template (every key from `web/lib/config/env.ts`; optional entries are commented):

```bash
cp .env.local.example .env.local
```

Edit **`.env.local`** and set at least the **required** values (Supabase URL, anon key, service role key). For local browsing, set **`NEXT_PUBLIC_BASE_URL=http://localhost:3000`**.

For semantics and optional integrations, see [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md).

### 4. Link to Supabase Project

The `supabase/` directory is at the **repository root** (sibling of `web/`). Link from there:

```bash
cd ..                    # from web/ → repo root
supabase link --project-ref <your-project-id>
cd web
```

### 5. Generate TypeScript Types

```bash
npm run types:generate
```

This generates `web/types/supabase.ts` from your Supabase schema.

### 6. Start the Development Server

```bash
npm run dev
```

Visit **http://localhost:3000** - you should see the Choices platform!

## First Contribution Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write code following the patterns in [`STATE_MANAGEMENT.md`](STATE_MANAGEMENT.md) and [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Follow state management patterns from [`STATE_MANAGEMENT.md`](STATE_MANAGEMENT.md)

### 3. Run Quality Checks

```bash
# From web/ directory
npm run lint          # Check code style
npm run types:ci       # Verify TypeScript
npm run test           # Run unit tests
npm run test:e2e       # Run E2E tests (optional, takes longer)
```

### 4. Sign Your Commits (DCO)

All commits must be signed with the Developer Certificate of Origin:

```bash
git commit -s -m "feat: add your feature"
```

The `-s` flag adds the required `Signed-off-by` line.

### 5. Open a Pull Request

1. Push your branch: `git push origin feature/your-feature-name`
2. Open a PR on GitHub
3. Fill out the PR template checklist
4. Ensure CI passes (lint, types, tests)

## Common First Tasks

### Fix a Bug

1. Find an issue labeled `good first issue` or `help wanted`
2. Assign yourself to the issue
3. Create a branch: `git checkout -b fix/issue-description`
4. Fix the bug and add tests
5. Submit a PR

### Add a Feature

1. Check [`ROADMAP.md`](ROADMAP.md) to see what's planned
2. Discuss in an issue first (if it's a significant feature)
3. Create a branch and implement
4. Add tests and documentation
5. Submit a PR

### Improve Documentation

1. Find outdated or unclear docs
2. Create a branch: `git checkout -b docs/improve-doc-name`
3. Make improvements
4. Submit a PR (no tests needed for pure docs)

## Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Quality
npm run lint             # Run ESLint
npm run types:ci          # TypeScript type checking
npm run check            # Run lint + type-check

# Testing
npm run test             # Run Jest unit tests
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:axe     # Run accessibility tests

# Database
npm run types:generate   # Regenerate Supabase types
supabase db push         # Apply migrations

# Internationalization
npm run i18n:extract     # Extract i18n strings (updates snapshot; CI compares)
npm run i18n:validate    # Ensure every en key exists in other locales
```

Releases that ship new copy: maintainers follow **[`COPY_FREEZE.md`](COPY_FREEZE.md)**. Contributor-facing detail: [`CONTRIBUTING.md`](../CONTRIBUTING.md) (user-visible strings).

**Repository root** (parent of `web/`) — scripts that are not in `web/package.json`:

```bash
cd ..   # from web/ → repo root
npm run governance:check   # after store / API changes (companion doc updates)
npm run verify:docs        # full doc + inventory parity (CI runs this)
```

## Project Structure

```
Choices/                 # repository root
├── web/                 # Next.js app (primary development tree)
│   ├── app/             # App Router (pages, API routes)
│   ├── features/        # Feature modules
│   ├── lib/             # Stores, API helpers, config
│   ├── components/      # Shared UI
│   ├── scripts/         # One-off TS/ops scripts (see package.json)
│   ├── tests/           # Jest + Playwright
│   └── messages/        # i18n JSON
├── supabase/            # Migrations and Supabase config
├── services/            # Ancillary services (e.g. civics ingest)
└── docs/                # Documentation you are reading
```

For detailed structure, see [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Day-to-Day Runbook

```bash
cd web
npm run types:generate   # After migrations change
npm run check            # Lint + type-check (matches CI)
npm run i18n:extract     # Before committing i18n changes
npm run i18n:validate    # Catch missing translations before push
```

From **repository root** (after `cd ..` from `web/`):

```bash
npm run governance:check  # Before PR if you changed stores or API routes
npm run verify:docs       # Before PR when docs, routes, schema, or flags changed
```

## Getting Help

- **Documentation**: See [`docs/README.md`](README.md) for the full index
- **Architecture**: See [`ARCHITECTURE.md`](ARCHITECTURE.md) for system design
- **Testing**: See [`TESTING.md`](TESTING.md) for testing strategies
- **In-app feedback vs GitHub**: See [`FEEDBACK_AND_ISSUES.md`](FEEDBACK_AND_ISSUES.md)
- **Issues**: Check existing issues or create a new one

## Next Steps

1. ✅ You've got the app running locally
2. ✅ You understand the basic workflow
3. 🎯 **Pick a task**: Look for `good first issue` labels or improve documentation
4. 🎯 **Read the guides**: [`TESTING.md`](TESTING.md), [`STATE_MANAGEMENT.md`](STATE_MANAGEMENT.md), [`ARCHITECTURE.md`](ARCHITECTURE.md)
5. 🎯 **Explore the codebase**: Start with [`ARCHITECTURE.md`](ARCHITECTURE.md)

Welcome to the Choices platform! 🎉

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** 2026-04-05 (documentation accuracy and codebase-reference review)

