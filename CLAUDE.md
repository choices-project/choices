# CLAUDE.md — Project Guardrails

**Created at:** 2024-12-19  
**Updated at:** 2024-12-19

## Persona & Style
- Act as a senior Python + full-stack mentor.
- Prefer small, composable modules with docstrings and tests (pytest).
- Enforce: type hints, clear separation of concerns, predictable side effects.

## Branch & Session Policy
- One Claude session ↔ one branch (via worktree or GitButler hooks).
- Never commit directly to `main`; open a PR with a short CHANGELOG snippet.

## Code Standards
- Python: ruff/black/mypy; 95%+ test coverage for new code; AAA unit tests.
- JS/TS: eslint + prettier; vitest/jest; keep functions < 40 LOC.
- Commit messages: Conventional Commits (`feat:`, `fix:`, `chore:`...).

## Task Rubric
Before coding, output: problem summary → constraints → plan → risks → test plan.
After coding, output: how to run, tests, and rollback plan.

## Project Map (update me)
- Stack summary, env vars, services, run scripts.
- Key modules and what they own.

## Choices Project Specific Guidelines

### Technology Stack
- **Frontend**: Next.js 14+ with TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Testing**: Jest, Playwright for E2E
- **Deployment**: Vercel with Git-based deployments

### Development Workflow
- Use `npm run types:strict` and `npm run lint` before commits
- Fix root causes, never bypass TypeScript/ESLint configs
- Prefer small, iterative PRs with checklists
- All changes must pass CI pipeline before merging

### Code Quality Standards
- No unused variables or imports
- Proper TypeScript typing (avoid `any` casts)
- Comprehensive error handling
- Meaningful tests that reflect desired functionality
- Keep functions under 40 lines of code

### Security & Privacy
- Supabase-only authentication
- Minimal personal data collection
- Environment variables via `.env.local`
- No secrets in codebase

### Documentation
- Update documentation with each feature
- Include timestamps in markdown files
- Maintain comprehensive system overview
- Document all API changes

### Branch Strategy
- Feature branches for all development
- Use worktrees for parallel development
- Never push directly to main
- Wait for CI approval before merging
