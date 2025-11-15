# API Contracts & Envelope Standards
Last updated: 2025-11-15  
Status: Phase C — Draft ready for partner circulation

---

## 1. Why This Exists
- Align every `web/app/api/**` handler with the shared `{ success, data, metadata }` envelope so the contract harness and MSW fixtures stay in sync.
- Provide a single reference for error code semantics (`AUTH_ERROR`, `RATE_LIMIT`, WebAuthn codes, etc.).
- Document the handshake between production handlers, contract tests, and Playwright/MSW fixtures.

Use this doc when migrating legacy `NextResponse.json` calls or when authoring new endpoints.

---

## 2. Envelope Primer

| Response Type | Shape | Helper | Notes |
| --- | --- | --- | --- |
| Success | `{ success: true, data: T, metadata: { timestamp, ... } }` | `successResponse`, `successWithMeta`, `paginatedResponse` | Metadata always includes an ISO timestamp; add cache headers + request ids via metadata. |
| Error | `{ success: false, error, code?, details?, metadata }` | `errorResponse`, `validationError`, `authError`, `forbiddenError`, `rateLimitError`, `serverError`, etc. | Use semantic codes so harness + clients can branch deterministically (`VALIDATION_ERROR`, `FORBIDDEN`, `WEBAUTHN_*`). |
| Pagination | `metadata.pagination = { total, limit, offset, hasMore, page, totalPages }` | `paginatedResponse` | Contract suites assert `hasMore`, `page`, and `totalPages` for trending/feed endpoints. |

### Required Imports
```ts
import { successResponse, errorResponse, validationError, withErrorHandling } from '@/lib/api/response-utils';
import type { ApiSuccessResponse } from '@/lib/api/types';
```

Always wrap route exports in `withErrorHandling` so uncaught exceptions return `SERVER_ERROR` envelopes and log details once.

---

## 3. Migration Checklist
1. Replace raw `NextResponse.json(...)` with the appropriate helper.
2. Normalize metadata:
   - Include cache metadata (`{ cache: { hit, ttl } }`) for analytics/dashboard routes.
   - Include rate-limit metadata when returning `RATE_LIMIT`.
3. Ensure Supabase/Redis errors map to deterministic codes (`PROFILE_LOOKUP_FAILED`, `CIVICS_RPC_FAILED`, etc.).
4. Update contract tests + MSW fixtures simultaneously (see Section 5).
5. Document new expectations in `docs/TESTING/api-contract-plan.md` ➜ “Scope” table.

> **Tip:** Use `web/lib/api/types.ts` to derive payload shapes so clients and tests stay type-safe.

---

## 4. Error Codes (Reference)

| Domain | Codes |
| --- | --- |
| Auth | `AUTH_ERROR`, `FORBIDDEN`, `RATE_LIMIT`, `METHOD_NOT_ALLOWED`, `SERVER_ERROR` |
| Profile/Onboarding | `VALIDATION_ERROR`, `PROFILE_LOOKUP_FAILED`, `PROFILE_UPDATE_FAILED`, `ONBOARDING_CREATE_FAILED` |
| Analytics | `ANALYTICS_RPC_FAILED`, `ANALYTICS_POLL_FAILED`, `ANALYTICS_CACHE_MISS` (metadata) |
| Civics | `CIVICS_RPC_FAILED`, `CIVICS_VALIDATION_ERROR`, `ADDRESS_LOOKUP_FAILED` |
| Admin/Candidate | `ADMIN_AUDIT_FAILED`, `CANDIDATE_SEND_FAILED` |
| WebAuthn | `WEBAUTHN_CREDENTIAL_STORE_FAILED`, `WEBAUTHN_CHALLENGE_PERSIST_FAILED`, `WEBAUTHN_VERIFICATION_FAILED` |

Expand this table whenever a new deterministic error surfaces so downstream clients know how to branch.

---

## 5. Contract Harness & MSW Fixtures
- **Contract tests** live under `web/tests/contracts/**` and execute handlers directly via `jest.isolateModules`. They expect production handlers to emit the envelopes described here.
- **Playwright/MSW** (`web/tests/msw/handlers` + `setupExternalAPIMocks`) serve the same payloads offline. Keep fixtures typed via `ApiSuccessResponse<T>` to prevent drift.

### Update Flow
1. Update handler ➜ ensure helper usage + metadata.
2. Refresh MSW fixture (`web/tests/msw/handlers/*.ts`) to mirror the payload.
3. Update contract test assertions.
4. Document in `docs/TESTING/api-contract-plan.md`.
5. If the change is externally visible, note it in `docs/archive/release-notes/CHANGELOG.md`.

When fixtures break:
- Run `npm run test:contracts -- --runTestsByPath web/tests/contracts/<route>.contract.test.ts`.
- Run `PLAYWRIGHT_USE_MOCKS=1 npm run test:e2e -- --grep @api` to confirm Playwright still boots offline.

---

## 6. Adding a New Route
1. Scaffold handler with `withErrorHandling`.
2. Define payload types in `web/lib/api/types.ts` or a feature-specific type file.
3. Emit envelope via helper.
4. Add Jest contract suite.
5. Add MSW fixture + Playwright coverage if user-facing.
6. Update this doc (Section 4/5) when introducing new codes or metadata fields.

Keeping this reference current ensures partners, QA, and automation owners can trust the API surface without reading every route file.


