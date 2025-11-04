# AI Agent Onboarding Guide

**Last Updated**: November 4, 2025  
**Purpose**: Essential information for AI agents working on this project

---

## Core Principles

### 1. Quality Over Speed
- **Fix root causes**, not symptoms
- **Never silence linters** - fix the actual problem
- **Implement features properly** - no shortcuts or workarounds
- Temporarily increasing errors is acceptable if implementing correctly

### 2. Research First
- Comprehensively research codebase before making changes
- Understand the full context and implications
- Check for existing implementations, duplicates, redundancies
- Verify against actual database schema (not assumptions)

### 3. Technical Correctness
- Documentation must be **technically accurate**
- No grandstanding or self-congratulation
- State facts, show file paths, include line numbers
- If you don't know, say so - this is a learning environment

---

## Project Overview

### Technology Stack
- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL, 64 tables)
- **State**: Zustand (migrated from custom hooks)
- **Auth**: Supabase Auth + WebAuthn (passkeys)
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm

### Architecture
- Server-first: Server actions, server components
- Client components only when needed (interactivity, state)
- RLS (Row Level Security) for all tables
- Service role key for admin operations only

**See**: [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Code Quality Standards

### Linting (Strict Enforcement)

#### ✅ DO: Fix Root Causes
```typescript
// ❌ BAD: Silencing the linter
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const data = fetchData()

// ✅ GOOD: Fix by using the variable or removing it
const data = fetchData()
return data
```

#### Nullish Coalescing (`??` vs `||`)
```typescript
// ❌ BAD: || treats empty string, 0, false as falsy
const name = user.name || 'Anonymous'  // 'Anonymous' even if name is ""

// ✅ GOOD: ?? only for null/undefined
const name = user.name ?? 'Anonymous'  // Empty string preserved

// ⚠️ EXCEPTION: Boolean logic should use ||
if (isAdmin || isModerator) { }  // Correct, don't change to ??
```

#### Optional Chaining
```typescript
// ❌ BAD: Manual null checks
if (user && user.profile && user.profile.name) { }

// ✅ GOOD: Optional chaining
if (user?.profile?.name) { }
```

#### Import Order
Organize imports: external → internal → types → styles

#### Unused Variables
Remove or prefix with `_` if intentionally unused (rare)

**See**: [LINT_STANDARDS.md](LINT_STANDARDS.md) for complete rules

---

## Database Practices

### Schema is Source of Truth
- **Types file**: `web/utils/supabase/database.types.ts`
- **Generated from**: Supabase (via CLI)
- **Never modify manually** - regenerate with `supabase gen types typescript --linked`

### Schema Changes
1. Create migration SQL in `supabase/migrations/`
2. Apply with `supabase db push`
3. Regenerate types: `npx supabase gen types typescript --linked > web/utils/supabase/database.types.ts`
4. Update code to use new schema

### When to Add Schema
✅ **Add tables/columns when**:
- Improves data integrity
- Enables better queries/indexes
- Reduces JSONB complexity
- Architectural improvement

❌ **Don't add schema just to**:
- Avoid fixing code logic
- Work around temporary issues

**See**: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)

---

## Security Requirements

### Authentication
- **User auth**: Supabase Auth (email, WebAuthn)
- **Trust tiers**: T0-T3 (email → phone → biometric → identity)
- **Admin auth**: `user_profiles.is_admin` column

### Environment Variables
- **Service role key**: `SUPABASE_SERVICE_ROLE_KEY` (admin operations only)
- **Never use in client code**: Service role bypasses RLS
- **Public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-side)

### RLS (Row Level Security)
- Every table has RLS policies
- Service role bypasses RLS (use carefully)
- Test with anonymous and authenticated users

**See**: [SECURITY.md](SECURITY.md)

---

## Trust Tier Voting (CRITICAL)

### Democratic Principle
**ALL VOTES COUNT EQUALLY** - No vote weighting by trust tier.

### Trust Tiers Are For Analytics Only
- T0-T3 recorded with each vote
- Filter results post-hoc for bot detection
- Compare T0-T1 vs T2-T3 to identify propaganda

### Implementation
```typescript
// ✅ CORRECT: All votes equal
const vote = {
  poll_id,
  user_id,
  option_id,
  trust_tier  // For analytics filtering only
}

// ❌ WRONG: No vote_weight column exists
const vote = {
  vote_weight: trustTierWeight  // DON'T DO THIS
}
```

**RPC for analytics**: `get_poll_votes_by_trust_tier(poll_id, min_tier, max_tier)`

**See**: [TRUST_TIER_DESIGN.md](TRUST_TIER_DESIGN.md)

---

## Feature Implementation

### When Implementing Features

1. **Audit existing code**:
   - Check for duplicates/redundancy
   - Identify canonical implementations
   - Look for partial implementations

2. **Research patterns**:
   - How do similar features work?
   - What stores/hooks exist?
   - What database tables are involved?

3. **Implement properly**:
   - Use Zustand stores (not custom hooks)
   - Server actions for mutations
   - Type-safe (use database.types.ts)

4. **Update documentation**:
   - Add JSDoc comments to functions
   - Update feature .md files
   - Note any architectural changes

### Feature Status
- **✅ Operational**: Fully implemented, tested, production-ready
- **🟡 Partial**: Framework exists, incomplete implementation
- **❌ Not Implemented**: Planned but not built

**See**: [FEATURES.md](FEATURES.md)

---

## Documentation Standards

### Writing Documentation
- **Be technically correct** - facts only
- **Include file paths** - `features/polls/components/PollCard.tsx`
- **Show line numbers** - `vote.ts:103-105`
- **Date updates** - Last updated date at top
- **Status indicators** - ✅ 🟡 ❌ for clarity
- **No grandstanding** - "we did good work" is implied

### Documentation Structure
```
docs/
├── Core technical (ARCHITECTURE, SECURITY, DATABASE_SCHEMA)
├── Development (DEVELOPMENT, CONTRIBUTING, ENVIRONMENT_VARIABLES)
├── features/ (One .md per feature, comprehensive)
├── guides/ (Setup and testing guides)
└── archive/ (Historical docs, reference only)
```

**See**: [docs/README.md](README.md)

---

## Common Workflows

### Adding a New Feature
1. Check `docs/FEATURES.md` for status
2. Check for existing partial implementations
3. Design database schema if needed
4. Create Zustand store for state
5. Build components (server-first)
6. Create server actions for mutations
7. Add API routes if needed
8. Write tests
9. Document in `docs/features/[feature].md`

### Fixing Lint Errors
1. Read `LINT_STANDARDS.md` for the specific rule
2. Understand the root cause
3. Fix properly (never disable)
4. Run linter to verify
5. Update JSDoc if modifying functions

### Database Migration
1. Create SQL in `supabase/migrations/YYYYMMDD_description.sql`
2. Create rollback in `supabase/migrations/YYYYMMDD_description_rollback.sql`
3. Test locally: `supabase db reset`
4. Apply: `supabase db push`
5. Regenerate types
6. Update code to use new schema
7. Document in migration file

### Regenerating Types
```bash
cd /Users/alaughingkitsune/src/Choices
npx supabase gen types typescript --linked > web/utils/supabase/database.types.ts
```

---

## Key Files Reference

### Essential Reading
- `docs/ARCHITECTURE.md` - System design
- `docs/SECURITY.md` - Security model
- `docs/DATABASE_SCHEMA.md` - 64 tables
- `docs/TRUST_TIER_DESIGN.md` - Voting philosophy
- `docs/LINT_STANDARDS.md` - Code quality
- `docs/CURRENT_STATUS.md` - Project state

### Database
- `web/utils/supabase/database.types.ts` - Generated types (source of truth)
- `web/types/database.ts` - Barrel exports
- `supabase/migrations/` - All migrations

### State Management
- `web/lib/stores/` - Zustand stores
- Migrated from custom hooks (November 2025)

### Authentication
- `features/auth/lib/admin-auth.ts` - Admin authorization
- `features/auth/lib/webauthn/` - WebAuthn implementation
- `utils/supabase/server.ts` - Server client (service role)

**See**: [docs/README.md](README.md) for complete index

---

## Testing

### Test Types
- **Unit**: Feature-level logic
- **Integration**: API routes, database
- **E2E**: Playwright (full user flows)

### Running Tests
```bash
# Unit/integration
pnpm test

# E2E
pnpm test:e2e

# Linting
pnpm lint
```

**See**: [guides/testing/README.md](guides/testing/README.md)

---

## What NOT To Do

### ❌ Never
1. **Silence linters** without fixing root cause
2. **Guess at database schema** - always check database.types.ts
3. **Use service role key client-side** - security violation
4. **Weight votes by trust tier** - all votes equal
5. **Over-document** - be concise and technical
6. **Create redundant implementations** - consolidate
7. **Skip hooks** (--no-verify) - unless explicitly asked
8. **Modify database.types.ts manually** - regenerate only

### ⚠️ Ask First
1. Major architectural changes
2. New database tables (explain rationale)
3. Removing features (might be partial, not dead)
4. Changing security model
5. Modifying RLS policies

---

## User Context

**Developer Level**: New to development, learning  
**Expectation**: High-quality, properly implemented features  
**Tolerance**: Temporary error increases if implementing correctly  
**Communication**: Direct, technically accurate, no fluff

### User Wants
- Features implemented to maximum efficacy
- Code that's maintainable and correct
- Documentation that's useful and current
- Quality over speed

### User Doesn't Want
- Shortcuts or workarounds
- Linter silencing
- Grandstanding in docs
- Partially implemented features left hanging

---

## Getting Started Checklist

When you join this project:

1. ✅ Read this document completely
2. ✅ Review [ARCHITECTURE.md](ARCHITECTURE.md)
3. ✅ Review [LINT_STANDARDS.md](LINT_STANDARDS.md)
4. ✅ Review [TRUST_TIER_DESIGN.md](TRUST_TIER_DESIGN.md)
5. ✅ Scan [FEATURES.md](FEATURES.md) for feature status
6. ✅ Check [CURRENT_STATUS.md](CURRENT_STATUS.md) for project state
7. ✅ Familiarize with database.types.ts structure
8. ✅ Understand the docs/ structure

**Then**: Ask questions if anything is unclear. This is a learning environment.

---

## Philosophy

> "We are here for the best application possible."

- **Quality first** - Do it right
- **Research first** - Understand before acting
- **Implement fully** - No half-measures
- **Document accurately** - Truth over polish
- **Learn continuously** - Ask when unsure

---

**This guide is your constitution. Follow it.**

