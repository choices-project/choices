# Product Quality Roadmap

## Vision
Deliver a production-grade Choices platform that is trustworthy, performant, and delightful for both voters and administrators. This roadmap captures critical gaps we have surfaced (stubs, TODOs, weak typing, missing integrations), prioritises remediation, and tracks ownership so nothing slips again.

---

## Priority Framework

| Priority | Definition | Example Issues |
| --- | --- | --- |
| P0 – Blocker | Prevents core user experiences or compromises safety/compliance. Fix before shipping. | Auth/navigation stubs, empty orchestrator methods, `any`-typed civics pipeline |
| P1 – High | Degrades core UX, observability, or trust. Address in current milestone. | Widget settings TODOs, analytics fallbacks that silently no-op |
| P2 – Medium | Impacts polish, maintainability, or future feature velocity. Tackle once P0/P1 are stable. | Temporary UI states without persistence, incomplete documentation |

---

## P0 – Blockers

### 1. Restore Typed Civics Contracts
- **Files**: `web/lib/integrations/google-civic/transformers.ts`, `web/lib/integrations/google-civic/client.ts`, `web/lib/pipelines/data-transformation.ts`
- **Issue**: `AddressLookupResult`, `Representative`, `CandidateCardV1` downgraded to `any`, defeating validation and leaking malformed data.
- **Fix Strategy**:
  1. Promote canonical types in `web/features/civics/lib/types`.
  2. Export from a shared module (e.g. `@/features/civics/lib/types/contracts`).
  3. Update transformers/client/pipelines and re-run `tsc --noEmit`.
  4. Add Zod validation at transformation boundaries.
- **Owner**: 🔄 Unassigned (ideal for civics squad).

### 2. Implement Unified Orchestrator Data Methods
- **Files**: `web/lib/integrations/unified-orchestrator.ts`
- **Issue**: Election/policy fetchers are stubs returning empty data and logging success, masking feature gaps.
- **Fix Strategy**:
  1. Design DAO/service layer (Prisma or REST adapters).
  2. Each method should either fetch real data or throw `NotImplementedError`.
  3. Update call sites to handle explicit failures, add integration tests.
- **Owner**: 🔄 Unassigned (data platform team).

### 3. Replace Auth/I18n Stubs in Global Navigation
- **Files**: `web/components/shared/GlobalNavigation.tsx`
- **Issue**: Hard-coded `user = null` / `isAuthenticated = false`; logout is a no-op.
- **Fix Strategy**:
  1. Wire to real auth store (`useAuth()`), load translations via i18n hooks.
  2. Ensure sign-out triggers actual session termination.
  3. Add unit tests (React Testing Library) covering auth states.
- **Owner**: 🔄 Unassigned (frontend/auth pairing).

---

## P1 – High Priority

### 4. Ship Widget Configuration UX
- **Files**: `web/features/analytics/components/widgets/WidgetDashboard.tsx`, `WidgetRenderer.tsx`
- **Issue**: Settings button inert; config panel lacks controls.
- **Actions**:
  - Implement `openSettings()` handler wired to a real sheet/modal.
  - Define per-widget config schema, persist via widget store/service.
  - Add tests confirming config round-trip.

### 5. Transparent Analytics Fallbacks
- **Files**: `web/lib/services/analytics/index.ts`
- **Issue**: Feature-flag off state silently no-ops; devs unaware.
- **Actions**:
  - Return typed result (`{ trackEvent: disabledStub } & { isEnabled: false, reason: 'feature-disabled' }`).
  - Log in development, instrument metrics.
  - Update consumers to branch on `isEnabled`.

### 6. Harden Temporary Civics UI State
- **Files**: `web/lib/stores/userStore.ts`, `web/lib/stores/pollsStore.ts`
- **Issue**: Temporary flags without expiration/persistence guidelines.
- **Actions**:
  - Document intended lifecycle.
  - Add persistence toggles or cleanup routines.

---

## P2 – Medium Priority

1. **Documentation Debt**
   - Update `docs/DEPLOYMENT.md` and `docs/NOVEMBER_7_2025_COMPLETE.md` to reflect new remediation work.
2. **Testing Coverage**
   - Audit Playwright specs to ensure civics/analytics flows cover new functionality.
3. **Observability**
   - Instrument critical paths (auth redirect, analytics enablement) with structured logs.

---

## Cross-Cutting Initiatives

- **Type Safety Alignment**: Enable `strict` mode for civics modules, adopt shared `@/types` barrel exports.
- **Error Surfacing**: Introduce `InvariantError` helpers so TODO/stubbed areas fail loudly in development.
- **Feature Flags Review**: Audit `isFeatureEnabled` usage to ensure disabled features short-circuit gracefully with user messaging.

---

## Execution Checklist

- [ ] Assign owners for each P0 item.
- [ ] Block shipping until P0 issues resolved.
- [ ] Schedule weekly sync to review roadmap progress.
- [ ] Add CI gate for `tsc --noEmit` and minimum unit coverage on touched modules.

---

## Tracking & Updates

- Maintain this document under version control.
- Update status (e.g., ✅ Complete, 🔄 In Progress, ⚠️ Blocked) per item.
- Link PRs and tickets when work starts.

> _Goal:_ Make choices.dev the gold standard civic engagement platform—typed, observable, reliable.


