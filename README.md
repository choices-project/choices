# Choices

**Privacy-first participatory democracy platform** — polls, civic engagement, and representative data on open-source infrastructure.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE) [![Node.js](https://img.shields.io/badge/node.js-24.11.x-brightgreen)](./web/package.json) [![npm](https://img.shields.io/badge/npm-11.6.x-blue)](./web/package.json)

[Overview](#overview) · [Repository layout](#repository-layout) · [Requirements](#requirements) · [Quick start](#quick-start) · [Development](#development) · [Documentation](#documentation) · [Contributing](#contributing)

---

## Overview

Choices is a web application for civic participation: users can create and vote in polls (several voting methods), browse representative and civic datasets, use personalized feeds, and manage strong privacy defaults. The product is built as a **Next.js** app with **Supabase** (PostgreSQL, Row Level Security, Auth) and ships to **Vercel**.

**Privacy and fairness (high level).** We do not sell personal or row-level data. Optional programs (such as aggregate research panels) are **opt-in**, use coarsened or aggregated outputs where applicable, and can be revoked in settings. Poll surfaces that promise equal participation use **equal tabulation** (one person, one counted vote in the tallies users see). **Trust tiers** (see [`docs/TRUST_LAYER.md`](./docs/TRUST_LAYER.md)) are optional signals for verification and abuse resistance — not a way to buy extra vote weight in those polls.

**Open source.** Source of truth for behavior is this repository; deeper policy and architecture notes live under [`docs/`](./docs/).

**Production.** The public deployment is **https://www.choices-app.com**. Configuration and release practices are described in [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

---

## Repository layout

| Path | Purpose |
|------|--------|
| [`web/`](./web/) | **Main application** — Next.js 14 (App Router), React, API routes, features, tests |
| [`docs/`](./docs/) | Human-oriented documentation (setup, architecture, security, API inventories) |
| [`supabase/`](./supabase/) | Database migrations and Supabase-oriented assets |
| [`services/`](./services/) | Supporting backends and tooling (for example civics ingest services) |
| [`scripts/`](./scripts/) | Repo-root automation (`verify:docs`, inventories, governance checks) |
| [`.github/`](./.github/) | CI workflows, issue and PR templates, security automation |

Most day-to-day commands run from **`web/`**. Doc parity and cross-cutting checks run from the **repository root**.

---

## Requirements

| Tool | Notes |
|------|--------|
| **Node.js** | **24.11.x** recommended; **Volta** pins in `web/package.json` and root `package.json`. `engines` allow **22.x–24.x** — see [`docs/GETTING_STARTED.md`](./docs/GETTING_STARTED.md). |
| **npm** | **11.6.x** (see `packageManager` in `web/package.json`). CI uses the same pin. |
| **Supabase** | Full product behavior needs a Supabase project and env vars. **CI-style** placeholders let you run the app and mocked E2E without a real backend — see [`AGENTS.md`](./AGENTS.md) and [`docs/GETTING_STARTED.md`](./docs/GETTING_STARTED.md). |
| **Playwright** | For E2E locally: from `web/`, `npx playwright install --with-deps chromium` (see [`docs/TESTING.md`](./docs/TESTING.md)). |

---

## Quick start

```bash
git clone https://github.com/choices-project/choices.git
cd choices/web
npm install
cp .env.local.example .env.local   # edit values — see docs/GETTING_STARTED.md
npm run dev                        # http://localhost:3000
```

For Supabase linking, seed data, and troubleshooting, follow **[`docs/GETTING_STARTED.md`](./docs/GETTING_STARTED.md)**.

---

## Development

Run these from **`web/`** unless noted.

| Command | Purpose |
|---------|--------|
| `npm run dev` | Dev server (port 3000, `TZ=UTC`) |
| `npm run lint` | ESLint |
| `npm run types:ci` | TypeScript check (CI config; excludes test-only noise — see [`AGENTS.md`](./AGENTS.md)) |
| `npm run test` | Jest |
| `npm run test:e2e` | Playwright (default harness + mocks) |
| `npm run build` | Production build |

**Repository root** — required when you change API route inventories, `web/types/supabase.ts`, feature-flag docs, Zustand store docs, or canonical files under `docs/`:

```bash
npm run verify:docs
```

This bundles link checks, store/cascade verification, architecture boundaries, and related audits (see [`docs/README.md`](./docs/README.md)). **Requires `ripgrep` (`rg`)** on your PATH.

---

## Capabilities (product)

These are shipped or actively integrated in the web app; details and edge cases live in `docs/` and in-code contracts.

- **Polling** — Multiple poll types / voting methods (for example single, multiple, ranked, approval, quadratic, range) with results UX tied to server rules.
- **Civic engagement** — Representative discovery, petitions, and civic workflows where the product exposes them; data is integrated from documented public sources (see civics and API docs).
- **Feeds** — Personalized content, district context, and hashtag subscriptions where enabled.
- **Analytics home** — Configurable dashboard widgets and layout presets.
- **Authentication** — Supabase Auth, optional **WebAuthn / passkeys**, and social providers where configured.
- **Trust and privacy** — Optional trust tiers (**T0–T3** progressive model per [`docs/TRUST_LAYER.md`](./docs/TRUST_LAYER.md)), granular **opt-in** privacy settings, profile export, and admin tooling for sensitive flows.
- **Platform** — **PWA**-oriented behavior, push where supported, **i18n** (English / Spanish catalogues with CI validation per [`CONTRIBUTING.md`](./CONTRIBUTING.md)), candidate verification and contact submission paths with admin review where deployed.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| App framework | **Next.js 14** (App Router), **React**, **TypeScript** (strict) |
| UI | **Tailwind CSS**, **shadcn/ui**, **Framer Motion** |
| Data & auth | **Supabase** (PostgreSQL, RLS, Auth); generated types in `web/types/` |
| State | **Zustand** + **Immer** (~21 store modules; logout cascade resets dependent stores — see [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md), [`docs/STATE_MANAGEMENT.md`](./docs/STATE_MANAGEMENT.md)) |
| Caching / limits | **Upstash Redis** (rate limiting and related use cases) |
| Email | **Resend** |
| Hosting | **Vercel** (see [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)) |
| Testing | **Jest**, **Playwright**, **axe-core** (accessibility) |

After schema migrations: regenerate `web/types/supabase.ts` as your workflow requires, then run **`npm run verify:docs`** from the repo root so inventories and architecture counts stay aligned.

---

## Documentation

| Topic | Link |
|-------|------|
| **Setup** | [`docs/GETTING_STARTED.md`](./docs/GETTING_STARTED.md) |
| **Environment variables** | [`docs/ENVIRONMENT_VARIABLES.md`](./docs/ENVIRONMENT_VARIABLES.md) |
| **Architecture** | [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) |
| **State management** | [`docs/STATE_MANAGEMENT.md`](./docs/STATE_MANAGEMENT.md) |
| **Testing** | [`docs/TESTING.md`](./docs/TESTING.md) |
| **Deployment** | [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) |
| **Security** | [`docs/SECURITY.md`](./docs/SECURITY.md), **[`SECURITY.md`](./SECURITY.md)** (reporting) |
| **Privacy policy (source)** | [`docs/PRIVACY_POLICY.md`](./docs/PRIVACY_POLICY.md) |
| **Trust layer** | [`docs/TRUST_LAYER.md`](./docs/TRUST_LAYER.md) |
| **Feedback vs GitHub Issues** | [`docs/FEEDBACK_AND_ISSUES.md`](./docs/FEEDBACK_AND_ISSUES.md) |
| **Agents / MCP / Cursor** | [`docs/AGENT_SETUP.md`](./docs/AGENT_SETUP.md), [`AGENTS.md`](./AGENTS.md) |
| **Full doc index** | [`docs/README.md`](./docs/README.md) |

**Contributing norms:** [`CONTRIBUTING.md`](./CONTRIBUTING.md) · [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) · [`docs/COMMUNITY_GUIDELINES.md`](./docs/COMMUNITY_GUIDELINES.md)

---

## Contributing

We welcome contributions. Use **GitHub Issues** (bug / feature / documentation templates) for work tracked with **`Closes #…`**, and the **in-app feedback widget** on deployed builds for user-facing product feedback when appropriate — see [`docs/FEEDBACK_AND_ISSUES.md`](./docs/FEEDBACK_AND_ISSUES.md).

```bash
cd web
npm run lint && npm run types:ci && npm run test
cd .. && npm run verify:docs    # when docs, routes, schema, or store inventories change
git commit -s -m "feat: your change"   # DCO sign-off — see CONTRIBUTING.md
```

**Principles:** privacy first, equal voting in public poll UX, open source, accessibility, performance.

---

## License

Licensed under the **[MIT License](./LICENSE)**. Inbound contributions use the **Developer Certificate of Origin (DCO)** — see [`CONTRIBUTING.md`](./CONTRIBUTING.md).

**Security:** do not file security issues publicly. See **[`SECURITY.md`](./SECURITY.md)** for responsible disclosure.
