# Choices

**Privacy-first participatory democracy platform.**

Citizens engage with polls, representatives, and civic actions on transparent, open-source infrastructure. We do not sell **personal** or row-level data. Optional programs (for example an aggregate **Insights Panel**) are **opt-in**, use coarsened or aggregated outputs with safeguards, and can be revoked in privacy settings. Poll results use **equal voting** (one person, one counted vote in tallies you see). **Trust tiers** are optional and intended for verification, abuse resistance, and contextual signals—not to sell votes or replace equal tabulation in product surfaces that promise it.

[![TypeScript](https://img.shields.io/badge/TypeScript-0_errors-blue)](#) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

---

## Quick Start

```bash
git clone <repository-url> && cd Choices/web
npm install
# Create web/.env.local with Supabase + base URL — see docs/GETTING_STARTED.md
npm run dev                         # http://localhost:3000
```

See [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md) for the full setup guide.

---

## Features

**Core Platform**
- **Polling** — 6 voting methods (single choice, ranked choice, approval, quadratic, range, multiple choice) with real-time results
- **Civic Engagement** — Browse 8,600+ representatives, create petitions, track civic actions
- **Feed System** — Personalized content with district filtering and hashtag subscriptions
- **Analytics Dashboard** — Drag-and-drop widgets with 5 layout presets

**Trust & Privacy**
- **WebAuthn / Passkeys** — Passwordless biometric authentication
- **Trust Tiers** — T0–T3 optional verification (abuse resistance, visibility context; not for selling personal data)
- **Privacy Controls** — 16 granular GDPR/CCPA-compliant settings
- **Equal Voting** — Equal tabulation in public poll results; no pay-to-weight or bought vote multipliers in those tallies

**Platform**
- **PWA** — Offline-first, push notifications, installable
- **Candidate Verification** — Official email fast-track with admin audit trail
- **Contact System** — Submit representative contact info with admin approval workflow
- **i18n** — Internationalization-ready (en/es)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| UI | React + Tailwind CSS + shadcn/ui + Framer Motion |
| State | Zustand + Immer (**21** store modules; **17** reset in logout cascade—see `docs/ARCHITECTURE.md`) |
| Database | PostgreSQL via Supabase (**~93** public tables in generated types; RLS—run `npm run docs:surface-counts` at repo root) |
| Auth | Supabase Auth + WebAuthn passkeys |
| Rate Limiting | Upstash Redis |
| Email | Resend |
| Hosting | Vercel |
| Testing | Jest + Playwright + axe-core |

---

## Development

```bash
cd web
npm run dev           # Dev server (port 3000)
npm run lint          # ESLint
npm run types:ci      # TypeScript check
npm run test          # Jest unit tests
npm run test:e2e      # Playwright E2E
npm run build         # Production build
```

---

## Documentation

| Topic | Link |
|-------|------|
| Getting started | [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md) |
| Architecture | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) |
| Contributing | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| Testing | [docs/TESTING.md](./docs/TESTING.md) |
| State management | [docs/STATE_MANAGEMENT.md](./docs/STATE_MANAGEMENT.md) |
| API reference | [docs/API/README.md](./docs/API/README.md) |
| Deployment | [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) |
| Environment variables | [docs/ENVIRONMENT_VARIABLES.md](./docs/ENVIRONMENT_VARIABLES.md) |
| Database schema | [docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) |
| Security | [docs/SECURITY.md](./docs/SECURITY.md) |
| Vision & roadmap | [docs/VISION.md](./docs/VISION.md) |
| Trust layer | [docs/TRUST_LAYER.md](./docs/TRUST_LAYER.md) |
| Community guidelines | [docs/COMMUNITY_GUIDELINES.md](./docs/COMMUNITY_GUIDELINES.md) |
| Theory of change (optional) | [docs/THEORY_OF_CHANGE.md](./docs/THEORY_OF_CHANGE.md) |
| Full doc index | [docs/README.md](./docs/README.md) |

---

## Contributing

We welcome contributions. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

```bash
cd web
npm run lint && npm run types:ci && npm run test   # Pre-commit checks
git commit -s -m "feat: your change"                # DCO-signed commit
```

**Principles:** Privacy first. Equal voting. Open source. Accessible. Performant.

---

## License

[MIT](./LICENSE) — see [CONTRIBUTING.md](./CONTRIBUTING.md) for DCO requirements.

**Security issues:** See [SECURITY.md](./SECURITY.md) for responsible disclosure.
