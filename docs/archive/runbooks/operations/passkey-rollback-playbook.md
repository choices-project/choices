# Passkey Rollback Playbook

_Last updated: 2025-11-12_

This runbook describes how to disable the WebAuthn/passkey feature set quickly and safely if we need to roll back the launch. Follow the sections in order. All commands assume you have access to the production environment variables and Supabase service role credentials.

---

## 1. Disable the Feature Flag
- Set `NEXT_PUBLIC_ENABLE_PASSKEYS=0` in the environment (Vercel: flip the project-level env var and redeploy; self-hosted: export before restart).
- For existing containers, trigger a fast redeploy / restart so the React app hides passkey UI (`PasskeyControls`, passkey sections in onboarding/auth pages).
- Confirm in production that `/auth` and `/onboarding` no longer render passkey buttons (check for the absence of `data-testid="webauthn-register"`).

## 2. Block New WebAuthn API Calls
- Update API routes to short-circuit:
  - Set `SUPPRESS_WEBAUTHN_NATIVE=1` (or apply the corresponding feature flag toggle) so `/api/v1/auth/webauthn/native/*` returns `503 Service Unavailable`.
  - If the toggle is not available, temporarily deploy a patch that returns `{ success: false, error: 'Passkeys disabled' }` from `register/options`, `register/verify`, `authenticate/options`, and `authenticate/verify`.
- Confirm in logs that subsequent requests receive the disabled message.

## 3. Revoke Stored Credentials in Supabase
1. Connect to Supabase (SQL editor or `psql` using the service role key).
2. Back up existing rows:
   ```sql
   create table if not exists webauthn_credentials_backup as
   select now() as exported_at, *
   from webauthn_credentials
   where is_active = true;
   ```
3. Mark credentials inactive so the auth provider rejects them:
   ```sql
   update webauthn_credentials
   set is_active = false,
       revoked_at = now(),
       revoke_reason = 'feature rollback'
   where is_active = true;
   ```
4. Optional (only if product demands full delete):
   ```sql
   delete from webauthn_credentials
   where is_active = false and revoked_at is not null;
   ```
5. Clear pending challenges to avoid stuck login prompts:
   ```sql
   delete from webauthn_challenges
   where created_at < now() - interval '5 minutes';
   ```

## 4. Reset User Store State in Production
Even with the UI hidden, logged-in users may have passkey success flags cached. Flush them so components fall back to email/OAuth flows.

- From an ops shell (or a one-off script), call the user store reset harness:
  ```bash
  curl -X POST \
    -H "Authorization: Bearer $ADMIN_API_TOKEN" \
    "$PROD_BASE_URL/api/internal/user-store/reset-biometric"
  ```
  _If the endpoint is not yet deployed,_ push a Hotfix that calls `useUserStore.getState().resetBiometric()` during app boot when `NEXT_PUBLIC_ENABLE_PASSKEYS=0`.

- Verify via `/e2e/auth-access` harness (enable `NEXT_PUBLIC_ENABLE_E2E_HARNESS=1`, login as test user) that `data-testid="auth-access-success"` remains `false` after triggering passkey actions.

## 5. Communicate to End Users & Support
- Publish a status page entry and Slack/Discord notice: “Passkeys temporarily disabled while we investigate issues; email and OAuth login remain available.”
- Provide support with a scripted response that explains why passkeys disappeared and invite users to re-register once the feature returns.

## 6. Monitoring & Follow-up
- Watch Supabase error logs and Sentry for lingering WebAuthn-related warnings—expect a drop to zero within a few minutes.
- Track auth success rates to ensure users continue logging in via email/OAuth.
- Create a Jira ticket (or equivalent) referencing this rollback and documenting root cause / planned fix.

---

### Roll-forward Checklist
When re-enabling passkeys:
1. Re-activate the feature flag.
2. Remove API short-circuit.
3. Restore any needed credentials from `webauthn_credentials_backup`.
4. Deploy the fix and rerun Playwright `auth-access.spec.ts`.
5. Announce the return of passkeys to users/support.

Keep this document updated as the implementation evolves.

