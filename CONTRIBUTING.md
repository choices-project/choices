# Contributing to Choices

We welcome contributions! This project is licensed under MIT and uses the Developer Certificate of Origin (DCO) for inbound contributions.

_Documentation last reviewed: April 19, 2026._

## Quick Start (~15 minutes to first local run)

1. **Read the docs**: Start with [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) to set up your environment (clone → `cd web` → `npm install` → `cp .env.local.example .env.local` → edit → `npm run dev`). For a full doc ↔ code audit checklist (counts, phases, automation), see [`docs/DOCUMENTATION_AUDIT_ROADMAP.md`](docs/DOCUMENTATION_AUDIT_ROADMAP.md).
2. **Read the norms**: [Code of Conduct](CODE_OF_CONDUCT.md) and [`docs/COMMUNITY_GUIDELINES.md`](docs/COMMUNITY_GUIDELINES.md)
3. **Find a task**: Use this repo’s **Issues** tab; watch for **`good first issue`** or **`help wanted`** labels when maintainers add them
4. **Create a branch**: `git checkout -b feature/your-feature-name`
5. **Make changes**: Follow the patterns in [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md)
6. **Test**: From `web/`, run `npm run lint`, `npm run types:ci`, and `npm run test`
7. **Sign commits**: Use `git commit -s` (DCO requirement)
8. **Open a PR**: Fill out the PR template checklist

## Two directories, two `package.json` files

| Where | Path | Typical commands |
|-------|------|------------------|
| **App** | `web/` | `npm run dev`, `npm run lint`, `npm run types:ci`, `npm run test`, `npm run build` |
| **Repo root** | repository root (parent of `web/`) | `npm run verify:docs`, `npm run governance:check`, `npm run docs:api-inventory`, etc. |

If a command is “not found”, check you are in the right directory. CI runs **both** `web/` checks and root **`verify:docs`**.

## In-app feedback vs GitHub Issues

- **End users and testers** (including you on a deployed build) should use the **in-app feedback widget** when it is enabled: submissions go to **`POST /api/feedback`** and are reviewed under **Admin → Feedback** (`/admin/feedback`), with page and device context attached.
- **Contributors** working in this repository should use **GitHub Issues** (bug / feature / documentation templates) for **reproducible** bugs, design discussion, and anything that should close with **`Closes #…`** on a PR.
- **How they fit together:** see [`docs/FEEDBACK_AND_ISSUES.md`](docs/FEEDBACK_AND_ISSUES.md). Issue templates point product feedback to the widget so the two paths stay cohesive.

## Development Workflow

### 1. Setup

Follow the setup guide in [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) to get the project running locally.

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

**Branch naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation only
- `refactor/` - Code refactoring
- `test/` - Test additions/improvements

### 3. Make Your Changes

**Code Standards:**
- Follow TypeScript best practices
- Use the utilities from [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) § Canonical Utilities
- Follow state management patterns from [`docs/STATE_MANAGEMENT.md`](docs/STATE_MANAGEMENT.md)
- **JSDoc (tiered):** prioritize `@param` / `@returns` on **exported** functions and privacy-sensitive modules (`web/utils/privacy/**`, public API helpers); full component commentary can follow incrementally
- Keep functions small and focused

**User-visible strings (i18n):**
- Catalogues live under **`web/messages/`** (e.g. `en.json`, `es.json`).
- From **`web/`**, run **`npm run i18n:extract`** when you add or change keys; CI compares the snapshot (see **`.github/workflows/ci.yml`**). Use **`npm run i18n:validate`** locally to catch missing translations.
- Maintainers cutting a release: **[`docs/COPY_FREEZE.md`](docs/COPY_FREEZE.md)**.

**Import Order:**
1. External dependencies
2. Internal modules (`@/lib`, `@/features`, `@/components`)
3. Relative imports (`../`, `./`)
4. Types (co-located with their module group)

**Example:**
```typescript
import { QueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';

import { useAppActions } from '@/lib/stores/appStore';
import { AdminLayout } from '../layout/AdminLayout';
```

### 4. Write Tests

**Unit Tests:**
- Add tests for new functions/components
- Place tests in `tests/unit/` mirroring source structure
- Use Jest + React Testing Library

**E2E Tests:**
- Add Playwright tests for user-facing flows
- Use harness pages at `/e2e/*` for store testing
- Tag with `@smoke` for critical paths

**Test Commands** (from **`web/`**):
```bash
npm run test              # Unit tests
npm run test:e2e         # E2E tests
npm run test:contracts   # API contract tests
```

See [`docs/TESTING.md`](docs/TESTING.md) for detailed testing guidelines.

### 5. Run Quality Checks

**Before committing (from `web/`):**
```bash
cd web
npm run lint          # Check code style
npm run types:ci       # Verify TypeScript
npm run test           # Run unit tests
```

For **live demos or screen recordings**, leave `DEBUG_MIDDLEWARE` unset in `.env.local` so Edge middleware stays quiet (auth/cookie diagnostics and E2E bypass traces only run when `DEBUG_MIDDLEWARE=1`).

**When your change touches stores, API routes, migrations, feature flags, or canonical docs**, also from **repository root**:
```bash
cd ..   # parent of web/
npm run governance:check  # companion docs for store/API changes (see check-governance.js)
npm run verify:docs       # full parity: inventories, SECURITY snapshots, links, env example, MCP config, etc.
```
See [`docs/README.md`](docs/README.md) for everything `verify:docs` runs.

**CI will run:**
- Lint checks
- TypeScript compilation
- Unit tests
- Contract tests
- E2E smoke tests (on PR)

### 6. Commit Your Changes

**Sign your commits (DCO required):**
```bash
git commit -s -m "feat: add awesome feature"
```

The `-s` flag adds the required `Signed-off-by` line.

**Commit message format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (formatting)
- `refactor` - Code refactoring
- `test` - Test additions
- `chore` - Maintenance tasks

**Example:**
```
feat(analytics): add cache metadata to dashboard API

- Added cache hit/miss tracking
- Exposed cache TTL in response metadata
- Updated contract tests

Closes #123
```

### 7. Open a Pull Request

1. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a PR on GitHub** and fill out the template checklist:
   - Testing completed
   - Accessibility/i18n checked
   - API contracts updated (if applicable)
   - Documentation updated
   - Release notes added (if user-facing)

3. **Ensure CI passes:**
   - All checks must be green
   - Address any review feedback

4. **Get approval:**
   - At least one maintainer approval required
   - All conversations resolved

## Code Style and Utilities

**Prefer canonical utilities** over ad-hoc implementations. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) § Canonical Utilities for:
- Date helpers (`nowISO`, `formatISODateOnly`)
- Browser/SSR-safe helpers (`browser-utils`, `ssr-safe`)
- API response/CORS helpers (`@/lib/api`, `response-utils`)
- Origin validation (`@/lib/http/origin`)

**Avoid deprecated paths.** ESLint will block re-introducing removed modules (e.g., legacy CORS/HTTP/CSRF utilities and feature-local trending).

## Developer Certificate of Origin (DCO)

By contributing, you assert that you can license your contribution under the project license. Please add a `Signed-off-by` line to each commit:

```bash
git commit -s -m "feat: add awesome thing"
```

This adds a trailer like:
```
Signed-off-by: Your Name <you@example.com>
```

**Why DCO?** It ensures all contributions are properly licensed and that contributors have the right to contribute their code.

## Code of Conduct & community

Please review the [Code of Conduct](CODE_OF_CONDUCT.md) and [docs/COMMUNITY_GUIDELINES.md](docs/COMMUNITY_GUIDELINES.md). We are committed to a welcoming environment grounded in evidence and respectful disagreement.

## Security

**Do not file public issues for vulnerabilities.** See [SECURITY.md](SECURITY.md) for private reporting instructions.

If you discover a security vulnerability:
1. **Do not** create a public issue
2. Email security details to the address in [SECURITY.md](SECURITY.md)
3. Wait for acknowledgment before disclosing publicly

## License

By contributing, you agree that your contributions will be licensed under the MIT License. See [LICENSE](LICENSE).

## Getting Help

- **Product feedback vs GitHub Issues**: [`docs/FEEDBACK_AND_ISSUES.md`](docs/FEEDBACK_AND_ISSUES.md)
- **Documentation**: See [`docs/README.md`](docs/README.md) for the full index
- **Architecture**: See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for system design
- **Development**: See [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) for setup and runbook
- **Testing**: See [`docs/TESTING.md`](docs/TESTING.md) for testing strategies
- **Codebase**: See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for structure

## Common Contribution Types

### Bug Fixes

1. Find or create an issue describing the bug
2. Create a branch: `git checkout -b fix/bug-description`
3. Write a test that reproduces the bug
4. Fix the bug
5. Ensure the test passes
6. Submit a PR

### New Features

1. Check [`docs/ROADMAP.md`](docs/ROADMAP.md) to see if it's planned
2. Discuss in an issue first (for significant features)
3. Create a branch: `git checkout -b feature/feature-name`
4. Implement the feature
5. Add tests and documentation
6. Submit a PR

### Documentation Improvements

1. Find outdated or unclear docs
2. Create a branch: `git checkout -b docs/improve-doc-name`
3. Make improvements
4. Submit a PR (no tests needed for pure docs)

### Code Refactoring

1. Create a branch: `git checkout -b refactor/description`
2. Refactor while maintaining functionality
3. Ensure all tests pass
4. Submit a PR with explanation of benefits

## Governance Check

When modifying stores or API routes, run from **repository root**:

```bash
npm run governance:check
npm run verify:docs    # see docs/README.md for everything this runs
```

This verifies that:
- Store changes include roadmap/doc updates
- API changes include contract tests
- Documentation is updated
- **`verify:docs`** catches drift between generated inventories, security snapshots, canonical Markdown links, store/cascade docs, and `ARCHITECTURE` boundary counts (CI runs it in the quality job)

Full audit checklist (counts, schema lists, phases): [`docs/DOCUMENTATION_AUDIT_ROADMAP.md`](docs/DOCUMENTATION_AUDIT_ROADMAP.md). Cursor / MCP / skills / optional Vercel AI Gateway: [`docs/AGENT_SETUP.md`](docs/AGENT_SETUP.md). If you change **`apiRateLimiter.checkLimit`** options in `web/app/api/`, update the **Upstash API rate limits** table in [`docs/SECURITY.md`](docs/SECURITY.md).

Use `GOVERNANCE_BYPASS=1 npm run governance:check` only when explicitly approved by an owner.

## Before you open the repo publicly (maintainers)

A short checklist so collaborators have a smooth first hour:

1. **Issues** enabled; optional **Discussions** if you want Q&A separate from bugs.
2. **Labels:** create **`good first issue`** and **`help wanted`** (and match the spelling contributors see in this doc) so the backlog is discoverable.
3. **Default branch** protected: require CI to pass before merge when you are ready.
4. **Security:** confirm contact emails in [SECURITY.md](SECURITY.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) are monitored.
5. **Templates:** this repo includes [issue templates](.github/ISSUE_TEMPLATE/) and a [PR template](.github/PULL_REQUEST_TEMPLATE.md); adjust labels or wording to match your workflow.

## Thank You!

Thank you for contributing to Choices! Your efforts help make participatory democracy more accessible and transparent.

---

**Questions?** Open an issue (see [`.github/SUPPORT.md`](.github/SUPPORT.md)) or browse the [documentation index](docs/README.md).
