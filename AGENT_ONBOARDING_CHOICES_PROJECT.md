Agent Onboarding — Choices Project

Date: 2025-09-17 • Duration to read: ~7 min

Welcome aboard! This one-pager gets you productive without causing regressions or lint/TS explosions. It sets expectations, the toolchain, guardrails, and the “house patterns” you must follow.

0) TL;DR — Your first 90 minutes

Set runtime exactly

# Preferred: Volta (auto-pins node & npm per repo config)
curl https://get.volta.sh | bash
volta install node@20.11.1 npm@10.5.0
# fallback: nvm
nvm install 20.11.1 && corepack enable && corepack prepare npm@10.5.0 --activate


Install & check

cd web
npm ci
npm run types        # tsc --noEmit
npm run lint         # fast base ESLint (no type info)
npm run lint:typed   # type-aware ESLint on strict paths
npm run test -w      # watch tests if you’re touching them


Pick a task from the backlog or ask for one; if not yet assigned, choose from “Safe Starter Tasks” below.

Work in a branch

git switch -c feat/<short-name>  # or fix/<short-name>


PR checklist (see “Definition of Done”) before pushing.

1) Architecture quick map (what’s where)
web/
├─ app/                  # Next.js routes (server & client)
│  ├─ api/               # API routes (strictest typing)
│  └─ (app)/             # App UI
├─ components/           # Reusable UI
├─ lib/                  # Core domain logic (strict typing)
│  ├─ integrations/      # External APIs (normalize wire→model)
│  ├─ vote/              # Voting engines & finalize manager
│  ├─ util/              # Guards, object helpers (use these!)
│  └─ logger.ts
├─ tests/                # Unit/integration tests (typed, but pragmatic rules)
└─ scripts/              # Maintenance utilities (non-critical paths)


Strictness tiers (important):

Tier A (strict): lib/**, shared/**, app/api/**
Full type-aware ESLint; unsafe rules are errors.

Tier B (pragmatic): components/**, app/(app)/**
Unsafe rules warn; follow patterns but don’t fight UI DX.

Tier C (light): tests/**, scripts/**, archive/**
Unsafe rules mostly off; be sensible, not sloppy.

2) Tooling & commands (use these exact scripts)

Type check: npm run types (tsc, no emit)

Fast lint (no type info): npm run lint

Typed lint (strict, limited scope): npm run lint:typed

Fixable lint: append --fix (only for base lint)

Tests: npm run test / npm run test:ci

Format: npm run format (Prettier, if present)

Never add parserOptions.project to the base .eslintrc. Type-aware rules already live in the separate strict config.

3) House patterns you must follow
3.1 Wire → Model normalization (external data)

Do not push raw API objects through the app. Normalize at the boundary.

// lib/util/guards.ts (already exists; use it!)
import { has, isRecord, toString, toNumber, asArray } from '@/lib/util/guards';

type RepModel = { name: string; party: string; phone?: string };

export function toRepModel(wire: unknown): RepModel {
  if (!isRecord(wire) || !has(wire, 'name')) throw new Error('Bad wire');
  return {
    name: toString(wire.name),
    party: toString((wire as any).party ?? 'Independent'),
    ...(toString((wire as any).phone, '') && { phone: toString((wire as any).phone) }),
  };
}

3.2 Optional properties & null-safety

exactOptionalPropertyTypes is on. Never assign undefined; use conditional spreads.

import { withOptional } from '@/lib/util/objects';

const payload = withOptional(
  { id },
  { cashOnHand, totalReceipts, cycle } // only copies keys with non-nullish values
);


Use assertions when required and meaningful:

import { assertPresent } from '@/lib/util/guards';
assertPresent(poll, 'poll');

3.3 Supabase response handling

Use the shared helper for singles:

import { unwrapSingle } from '@/lib/db/safe-select';
const row = unwrapSingle(await supabase.from('polls').select('*').eq('id', id).single());
if (!row) return null;

3.4 Tests — one mock factory

Only use the provided Supabase mock helpers:

import { makeMockSupabase, okSingle, okList, errSingle } from 'tests/helpers/supabase-mock';


Do not craft bespoke deep mocks—this is the #1 source of never/mock typing errors.

4) What not to do (hard guardrails)

❌ Don’t add or modify parserOptions.project in the base ESLint config.

❌ Don’t re-export 3rd-party libs (e.g., lucide-react) via our UI barrels.

❌ Don’t assign undefined to optional fields. Use conditional spread.

❌ Don’t pull server-only modules (pg, fs, etc.) into client code.

❌ Don’t commit ad-hoc test mocks. Use tests/helpers.

❌ Don’t bypass types with as any outside tests. In tests, keep it minimal and justified.

❌ Don’t change Node/npm versions per subfolder. Use the pinned toolchain above.

5) Safe starter tasks (when you’re unassigned)

Choose one and open a small PR (≤200 LOC):

Typed normalization pass on a single integration file

Add wire→model functions using guards.ts + withOptional.

Add 2–3 Zod schemas at critical API inputs (optional).

Replace || with ?? in one directory (non-UI)

Run base lint with --fix, then manually review.

Add missing unwrapSingle usage to 2–3 database reads.

Tests: migrate to shared supabase mock in one flaky test file.

Docs: add JSDoc to a small utility module; include examples.

Before picking: run npm run lint:typed and choose a path with warnings you can confidently reduce.

6) Code quality & security

CodeQL: don’t suppress; fix root causes. If truly noisy in legacy/archived paths, move files under archive/ or add path exclusions (after approval).

ESLint Disable: if you must disable a rule, only line-scoped and include a reason:

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- API wire passthrough documented above

7) Definition of Done (for any PR)

✅ npm run types passes.

✅ npm run lint passes (no warnings left behind).

✅ npm run lint:typed passes for files you touched.

✅ Tests relevant to your change pass locally.

✅ No any added in non-test code.

✅ Normalization at boundaries (no raw wire in domain).

✅ PR includes a brief “Why / How / Risk” note.

PR title format: feat|fix|chore: <scope> — <short description>

8) Debugging common pitfalls

“Why thousands of ESLint errors?”
You probably ran the typed config across the entire repo. Use npm run lint for speed; lint:typed is scoped and slower by design.

“Mock is inferred as never / mockResolvedValue missing?”
You mixed jest.Mocked with an incompatible shape. Use tests/helpers/supabase-mock.

“node / npm mismatch”
Install via Volta or nvm & corepack (see top). Do not rely on system Node.

9) Ask for help (the right way)

Post in the dev channel with:

What you tried

Exact command & error output

File path(s)

What you intend to change

Small, frequent PRs beat big “mystery” branches. We’ll keep review fast if you keep scope tight.

Thanks & welcome ✨

This doc is your north star. If you see drift between code and guidance, flag it—consistency is how we keep velocity and quality.