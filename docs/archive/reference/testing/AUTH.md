## Auth Testing Quickstart

- **Feature flags & env**  
  Set `NEXT_PUBLIC_ENABLE_E2E_HARNESS=1` (already wired in Playwright config) so the auth harness routes are exposed. Local runs should also export `PLAYWRIGHT_BASE_URL` if the app is not served on the default `http://localhost:3000`.

- **Test dependencies**  
  Install `msw@~2.4.13` as a dev dependency (`npm install --save-dev msw@~2.4.13`). This is required for the shared Node/MSW handlers that power both Jest and Playwright runs.

- **MSW handlers**  
  The Jest test environment now boots `authServer` (`web/tests/msw/server.ts`) automatically. Handlers cover:
  - `/api/v1/auth/webauthn/native/register/options`
  - `/api/v1/auth/webauthn/native/register/verify`
  - `/api/v1/auth/webauthn/native/authenticate/options`
  - `/api/v1/auth/webauthn/native/authenticate/verify`
  - `/api/auth/login`, `/api/auth/register`, `/api/profile`

  Override responses in individual tests via `authServer.use(...)` if you need edge cases; reset happens in the global `afterEach`.

- **Playwright setup**  
  Use `setupExternalAPIMocks(page, { auth: true })` (see `web/tests/e2e/helpers/e2e-setup.ts`) to stub the same passkey/auth endpoints for browser tests. The helper now handles unroute cleanup automatically.
- **CI integration**  
  `npm run test:ci` runs `npx playwright test`, so `auth-access.spec.ts` executes by default in CI. Ensure the job exports `NEXT_PUBLIC_ENABLE_E2E_HARNESS=1` (already set in `tests/e2e/playwright.config.ts`) and surfaces MSW handlers before the test suite starts.

- **Passkey harness**  
  `/e2e/auth-access` exposes `<PasskeyRegister>` and `<PasskeyLogin>` with deterministic store wiring. Wait for `document.documentElement.dataset.authAccessHarness === 'ready'` before interacting. See `auth-access.spec.ts` for an example that stubs `navigator.credentials` and `PublicKeyCredential`.

- **Component coverage**  
  RTL tests live in `web/tests/unit/auth/` and `web/tests/unit/onboarding/`. They mock the shared WebAuthn helpers (`beginRegister`, `beginAuthenticate`) and assert UI state (`Registration Successful!`, `Authentication failed`, etc.) using the real `userStore`. The onboarding `AuthSetupStep` suite exercises email/passkey options via the new `forceInteractive` prop to cover the full user flow in tests.
  - The shared Jest environment now exposes a configurable `navigator` (language, platform, connection, credentials) and polyfills `setImmediate`. Prefer `await screen.findByRole(...)` over immediate `getByRole` calls so tests wait for the async harness initialisers.
  - If you need to override browser globals, use `Object.defineProperty` to mutate specific fields instead of replacing `window`/`navigator`; the environment guards expect the original objects to remain intact.

- **AuthProvider contract**  
  `AuthProvider.test.tsx` mocks the Supabase browser client and verifies sessions, store hydration, and profile fetches. Extend this pattern when you add regression tests for logout or session expiry.

- **Known gaps (Nov 12)**  
  - ✅ `auth-access.spec.ts` now passes end-to-end; `PasskeyLogin` updates the shared store, so the `auth-access-success` indicator flips to `true` after register or authenticate flows.  
- ✅ `/e2e/user-store.spec.ts` now exercises biometric support/availability, credential provisioning, success/error toggles, and `resetBiometric()` so store consumers can rely on deterministic passkey state in tests.  
  - ✅ Supabase client guardrails added for build-time rendering; `next build` no longer throws when API routes or feed modules import the auth services (only standard Next.js standalone copy warnings remain).

---

## 7. Running Against the Real Backend

- Set `PLAYWRIGHT_USE_MOCKS=0` (defaults to mocks when unset) so helpers skip MSW routing.
- Ensure `.env.test.local` defines `E2E_USER_EMAIL/E2E_USER_PASSWORD` and `E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD` for the pre-seeded Supabase users documented in `web/tests/archive/extra-docs/TEST_USERS.md`.
- Execute:

  ```bash
  PLAYWRIGHT_USE_MOCKS=0 npx playwright test web/tests/e2e/specs/auth-production.spec.ts --config web/tests/e2e/playwright.config.ts
  ```

- The suite uses `loginTestUser` / `loginAsAdmin` to exercise `/auth` against production code paths and assert dashboard/admin access without MSW overrides.

Keep this document updated as additional scenarios (e.g., logout flows, onboarding redirects) gain automated coverage.

