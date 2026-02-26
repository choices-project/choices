# Contributing to Choices

We welcome contributions! This project is licensed under MIT and uses the Developer Certificate of Origin (DCO) for inbound contributions.

## Quick Start

1. **Read the docs**: Start with [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) to set up your environment
2. **Find a task**: Look for issues labeled `good first issue` or `help wanted`
3. **Create a branch**: `git checkout -b feature/your-feature-name`
4. **Make changes**: Follow the patterns in [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md)
5. **Test**: Run `npm run lint`, `npm run type-check`, and `npm run test`
6. **Sign commits**: Use `git commit -s` (DCO requirement)
7. **Open a PR**: Fill out the PR template checklist

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
- Use the utilities from [`docs/CODEBASE_NAVIGATION.md`](docs/CODEBASE_NAVIGATION.md) § Canonical Utilities
- Follow state management patterns from [`docs/STATE_MANAGEMENT.md`](docs/STATE_MANAGEMENT.md)
- Write self-documenting code with JSDoc comments
- Keep functions small and focused

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

**Test Commands:**
```bash
npm run test              # Unit tests
npm run test:e2e         # E2E tests
npm run test:contracts   # API contract tests
```

See [`docs/TESTING.md`](docs/TESTING.md) for detailed testing guidelines.

### 5. Run Quality Checks

**Before committing:**
```bash
cd web
npm run lint          # Check code style
npm run type-check     # Verify TypeScript
npm run test           # Run unit tests
npm run governance:check  # Verify roadmap/doc updates (if needed)
```

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

**Prefer canonical utilities** over ad-hoc implementations. See [`docs/CODEBASE_NAVIGATION.md`](docs/CODEBASE_NAVIGATION.md) § Canonical Utilities for:
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

## Code of Conduct

Please review and adhere to the [Code of Conduct](CODE_OF_CONDUCT.md). We are committed to providing a welcoming and inclusive environment for all contributors.

## Security

**Do not file public issues for vulnerabilities.** See [SECURITY.md](SECURITY.md) for private reporting instructions.

If you discover a security vulnerability:
1. **Do not** create a public issue
2. Email security details to the address in [SECURITY.md](SECURITY.md)
3. Wait for acknowledgment before disclosing publicly

## License

By contributing, you agree that your contributions will be licensed under the MIT License. See [LICENSE](LICENSE).

## Getting Help

- **Documentation**: See [`docs/README.md`](docs/README.md) for the full index
- **Architecture**: See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for system design
- **Development**: See [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) for setup and runbook
- **Testing**: See [`docs/TESTING.md`](docs/TESTING.md) for testing strategies
- **Codebase**: See [`docs/CODEBASE_NAVIGATION.md`](docs/CODEBASE_NAVIGATION.md) for structure

## Common Contribution Types

### Bug Fixes

1. Find or create an issue describing the bug
2. Create a branch: `git checkout -b fix/bug-description`
3. Write a test that reproduces the bug
4. Fix the bug
5. Ensure the test passes
6. Submit a PR

### New Features

1. Check [`docs/FEATURE_STATUS.md`](docs/FEATURE_STATUS.md) to see if it's planned
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

When modifying stores or API routes, run:

```bash
npm run governance:check
```

This verifies that:
- Store changes include roadmap/doc updates
- API changes include contract tests
- Documentation is updated

Use `GOVERNANCE_BYPASS=1 npm run governance:check` only when explicitly approved by an owner.

## Thank You!

Thank you for contributing to Choices! Your efforts help make participatory democracy more accessible and transparent.

---

**Questions?** Open an issue or check the [documentation](docs/README.md).
