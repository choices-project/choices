# Project TODOs

## Blocking Work
- [ ] **Restore Supabase type-check health (`poll-supabase-ci`)**  
  Address the current `npm run types:dev` failures by:
  - importing `NextResponse`, `validationError`, and other helpers where missing in API routes (e.g. `app/api/admin/*`, `app/api/analytics/*`, `app/api/privacy/preferences`, etc.)
  - normalising audit log helpers so `AuditLogOptions` accepts optional `ipAddress`/`userAgent` values without exact-optional conflicts
  - fixing Zod schema initialisers (`required_error`) in `features/polls/pages/create/schema.ts`
  - tightening component/test typings (e.g. `Switch` `onCheckedChange`, `findByLabelText` usage, `UserJourney.errors` shape)
  - resolving remaining implicit `any` warnings and strict null checks highlighted by the latest `tsc` run

## Follow-Up Enhancements
- [ ] **Re-enable multi-method voting support**  
  The vote endpoint currently allows only `voting_method === 'single'`; extend `SUPPORTED_METHODS` and hook up strategy handlers once type checks are stable.

- [ ] **Review poll creation/admin analytics wiring post type-fix**  
  After the Supabase typings are clean, rerun feature tests (poll creation flow, admin dashboard metrics) to validate analytics/milestone instrumentation.

## Completed Milestones (for reference)
- Phase 1–7 poll authoring overhaul  
- Poll consumption refresh (reader UX, vote API hardening)  
- Admin dashboard analytics integration
