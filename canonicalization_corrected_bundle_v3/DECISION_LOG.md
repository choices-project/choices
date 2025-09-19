# Decision Log — Canonicalization Corrections
- Keep: AnalyticsDashboard, VotingInterface, vote/engine, auth/middleware, SSR-safe supabase clients, full DB schema.
- Disable: legacy AuthProvider + hooks, basic dashboards, TODO poll-service, legacy supabase clients, partial schemas,
  duplicated WebAuthn helpers, old civics/propublica source, and performance duplicates under /components/performance.

Rationale comes from UNIFIED_PLAYBOOK.md and your audit tables: we enforce 'features/*' and 'utils/supabase/*' canonicals,
preserve SSR/E2E bypass patterns, and ban re-introduction via ESLint + pre-commit + Danger.
