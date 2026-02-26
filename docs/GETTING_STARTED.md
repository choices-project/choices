# Getting Started with Choices

_Last updated: January 2026_

Welcome to the Choices platform! This guide will help you get the project running on your local machine in under 10 minutes.

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
cd Choices
```

### 2. Install Dependencies

```bash
cd web
npm install
```

### 3. Set Up Environment Variables

Create `web/.env.local` with the minimum required variables:

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Base URL (required)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

For a complete list of environment variables, see [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md).

### 4. Link to Supabase Project

```bash
# From the web/ directory
supabase link --project-ref <your-project-id>
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

- Write code following the patterns in [`STATE_MANAGEMENT.md`](STATE_MANAGEMENT.md) and [`CODEBASE_NAVIGATION.md`](CODEBASE_NAVIGATION.md)
- Follow state management patterns from [`STATE_MANAGEMENT.md`](STATE_MANAGEMENT.md)

### 3. Run Quality Checks

```bash
# From web/ directory
npm run lint          # Check code style
npm run type-check     # Verify TypeScript
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

1. Check [`FEATURE_STATUS.md`](FEATURE_STATUS.md) to see what's planned
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
npm run type-check        # TypeScript type checking
npm run check            # Run lint + type-check

# Testing
npm run test             # Run Jest unit tests
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:axe     # Run accessibility tests

# Database
npm run types:generate   # Regenerate Supabase types
supabase db push         # Apply migrations

# Internationalization
npm run i18n:extract     # Extract i18n strings

# Governance
npm run governance:check # Verify roadmap/doc updates
```

## Project Structure

```
web/
├── app/              # Next.js App Router (pages, API routes)
├── features/        # Feature modules (polls, analytics, etc.)
├── lib/             # Shared utilities and Zustand stores
├── components/      # Shared UI components
├── tests/           # Test suites (Jest + Playwright)
└── types/           # TypeScript type definitions
```

For detailed structure, see [`CODEBASE_NAVIGATION.md`](CODEBASE_NAVIGATION.md).

## Day-to-Day Runbook

```bash
cd web
npm run types:generate   # After migrations change
npm run check            # Lint + type-check (matches CI)
npm run i18n:extract     # Before committing i18n changes
npm run governance:check # Before PR (store/API changes require doc updates)
```

## Getting Help

- **Documentation**: See [`docs/README.md`](README.md) for the full index
- **Architecture**: See [`ARCHITECTURE.md`](ARCHITECTURE.md) for system design
- **Testing**: See [`TESTING.md`](TESTING.md) for testing strategies
- **Issues**: Check existing issues or create a new one

## Next Steps

1. ✅ You've got the app running locally
2. ✅ You understand the basic workflow
3. 🎯 **Pick a task**: Look for `good first issue` labels or improve documentation
4. 🎯 **Read the guides**: [`TESTING.md`](TESTING.md), [`STATE_MANAGEMENT.md`](STATE_MANAGEMENT.md), [`CODEBASE_NAVIGATION.md`](CODEBASE_NAVIGATION.md)
5. 🎯 **Explore the codebase**: Start with [`CODEBASE_NAVIGATION.md`](CODEBASE_NAVIGATION.md)

Welcome to the Choices platform! 🎉

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** TBD

