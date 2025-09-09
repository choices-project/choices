# Onboarding (Choices)

Created: 2025-01-27
Last Updated: 2025-09-09

## Access
- GitHub: request write access to `choices-project/choices`
- Vercel: preview access only (production manual)
- Slack: #dev, #product, #civics

## Basics
- Node.js 22.19.0 (exact version); `npm i`; `npm run dev` → http://localhost:3000
- PR title: `type(scope): summary [agent-N]`
- PR body must include `**Date:** YYYY-MM-DD` (UTC)
- Small PRs: AI ≤ 600 LOC/1 hot; Owner ≤ 1000 LOC/3 hot

## Monorepo
- `apps/web` Next.js, `apps/ingest` ETL, `packages/*` shared libs
- Use `@choices/*` path aliases (no deep relative imports)

## Safety rails
- Civics is read-only in API routes (CI enforces)
- Forbidden imports: no `@supabase/supabase-js` in civics server
- Docs must have up-to-date dates (CI enforces)

## How to contribute
1) Pick issue → branch (`agent/N-task`)  
2) `npm run stamp:docs` if docs changed  
3) Open PR with correct title + **Date (UTC)**  
4) Fix CI, request review (@michaeltempesta)
