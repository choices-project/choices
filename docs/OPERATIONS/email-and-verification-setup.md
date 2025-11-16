## Email and Verification Setup (Freemium/No-Custom-Domain Edition)

This guide explains how to operate the new email verification and candidate onboarding flows using freemium provider tiers and without a personal domain. It outlines what’s already implemented in code, what configuration is needed in each environment, and practical options when domain verification is unavailable.

### What’s implemented already
- Verification emails (Resend integration)
  - Endpoint issues a 6‑digit code, stores it, and sends the email via Resend:
    - `POST /api/candidates/verify/request`
    - `POST /api/candidates/verify/confirm`
  - Rate limits and analytics for verification requests
  - Webhook receiver for delivery/bounce signals:
    - `POST /api/webhooks/resend`
- Welcome email on onboarding
  - `POST /api/candidates/onboard` triggers a welcome email to the user (best‑effort; non‑blocking).
- Non‑mutable facts vs user‑editable presentation
  - Official records (representatives_core, finance, votes) remain immutable for users.
  - Fast‑tracked representatives can publish public‑facing overrides (photo, socials, short bio, campaign website, press contact) via:
    - `POST|PATCH /api/representatives/self/overrides`
  - Overrides are merged into read output for display only.
- Auditing and reversions
  - All candidate profile edits and representative overrides are audited (+ admin endpoints to view and revert).

### Environment variables
Set these in your hosting platform’s environment (never commit secrets):

- `RESEND_API_KEY`: Resend API key (staging and production keys separately).
- `EMAIL_FROM`: Sender address (see “No domain? Options” below). Recommended format: `verify@yourdomain` (when a domain exists).
- `ADMIN_MONITORING_KEY`: Strong random string used by admin endpoints (stats, audits, revert).
- `NEXT_PUBLIC_APP_URL` (or equivalent app base URL): Used for links and share URLs.
- `CRON_SECRET`: If you plan to trigger any HTTP cron jobs from an external scheduler.

The code already reads and uses these variables where needed. If any are missing, certain features become no‑ops with safe failure (e.g., email send returns a warning and does not block flows).

### No personal domain: practical options
You can still run verification email flows in freemium mode using the following approaches. Each has trade‑offs.

1) Resend “verified recipients” (sandbox) flow
   - On free tiers (or in sandbox-like modes), providers often restrict sending to a set of verified recipient emails.
   - In Resend, add the test recipient addresses (your own + any QA testers) to “verified recipients” in the dashboard.
   - Keep `EMAIL_FROM` to a default fallback (e.g., `no-reply@choices.app` or another placeholder) until you own a domain.
   - Pros: No domain needed, quick to test end‑to‑end.
   - Cons: You can only email verified recipients (not general users); not suitable for broad production.

2) SES/Transactional sandbox (similar model)
   - If you choose AWS SES free tier (sandbox), you must verify recipients or request production access.
   - Pros/Cons similar to Resend sandbox.

3) Magic‑code on screen (dev only)
   - When `RESEND_API_KEY` is missing or invalid, the code request endpoint still creates a challenge in DB, but we do not return the code and do not send the email.
   - For development only: temporarily add a feature flag to echo the code on screen or log it (never enable in production). This is not committed in the current codebase by design, to avoid security leaks.

4) Third‑party domain or subdomain later
   - When you can obtain a domain, verify it in Resend and switch `EMAIL_FROM` to a proper address (e.g., `verify@yourdomain`), and add DKIM/DMARC DNS for deliverability.

### Minimal viable configuration (freemium)
Use this to test end‑to‑end (limited audience):

1) In Resend:
   - Create an API key (staging).
   - Add your own email(s) as “verified recipients”.
   - Create a webhook (optional but recommended): `POST https://YOUR_BASE_URL/api/webhooks/resend`
2) In app env:
   - `RESEND_API_KEY`: set to the staging key.
   - `EMAIL_FROM`: set to `no-reply@choices.app` (placeholder sender) or any allowed default.
   - `NEXT_PUBLIC_APP_URL`: e.g., `https://your-staging-host`.
   - `ADMIN_MONITORING_KEY`: set a strong value.
3) Try it:
   - Create a candidate via UI → you should receive the welcome email (if your email is verified in Resend).
   - Request verification code → verify via code entry.

### What to expect in freemium mode
- Emails will only be delivered to “verified recipients” (until you verify a domain or upgrade plans).
- Some providers may stamp a banner/note on emails (“sent from sandbox”). That’s expected.
- Webhooks may be limited on free tiers; logs in provider dashboard typically suffice during early testing.

### Hosting and network
Ensure your hosting allows:
- Outbound HTTPS to Resend (https://api.resend.com)
- Public `POST` to the webhook URL `/api/webhooks/resend` if you enable webhooks (no secrets in URL; consider signing later).

### Abuse & rate limiting
Already in place:
- Verification code requests are rate‑limited (per-IP heuristics) and per-user logical limits in code.
- Candidate profile PATCH and overrides POST are rate‑limited and logged to analytics.
Recommended additional guardrails (optional):
- Adaptive limits for repeat abuse sources (WAF or edge rules if your host supports them).

### Security and privacy
- We never expose codes in API responses or logs.
- Audit trails exist for owner edits and override writes; admin can revert specific fields.
- To harden further (optional):
  - Sanitize candidate bios with a stricter HTML policy (current code uses plain strings—safe by default).
  - Add a URL allowlist for socials (e.g., `https://twitter.com`, `https://x.com`, `https://facebook.com`, etc.).
  - Configure CSP and reporting endpoints at your edge.

### Admin operations
- Admin endpoints require `ADMIN_MONITORING_KEY` header (or Bearer).
- Useful endpoints:
  - `GET /api/admin/candidates/stats` → counters and status breakdowns.
  - `GET /api/admin/audit/candidates` → candidate edit audit logs.
  - `GET /api/admin/audit/representatives` → representative override audit logs.
  - `POST /api/admin/audit/revert` → revert a single field to a previous value.

### Next steps when you get a domain
1) In Resend:
   - Add your domain → set DNS records (DKIM/CNAME per instructions).
   - (Recommended) Add DMARC policy (e.g., `p=quarantine` with a monitoring mailbox).
   - Set a dedicated sender: `verify@yourdomain`.
2) In app env:
   - Update `EMAIL_FROM` → `verify@yourdomain`.
   - Consider separate staging domain or sender (e.g., `verify@staging.yourdomain`).
3) Webhook signing (optional but recommended):
   - Enable webhook signing in Resend; add signature verification in `/api/webhooks/resend`.

### Troubleshooting
- Not receiving emails in freemium:
  - Confirm the recipient is “verified” in Provider dashboard.
  - Check spam folder.
  - Inspect provider logs (sent/failed/bounced).
  - Ensure `RESEND_API_KEY` and `EMAIL_FROM` are set.
- Verification code accepted but not linking representative:
  - Code confirm links a rep when there is a unique email domain or exact match; otherwise it completes verification without linking. You can still complete fast‑track via the existing official email endpoint or manual admin assistance.

### Quick reference (what you do vs what’s in code)
- You do now (freemium):
  - Set `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_APP_URL`, `ADMIN_MONITORING_KEY`.
  - In Resend: add verified recipient emails; create webhook if desired.
- Code already handles:
  - Sending verification codes and welcome emails.
  - Storing and validating codes; rate limits; analytics.
  - Public pages and publish toggles; owner inline edits.
  - Representative overrides and immutable official records.
  - Admin audit and revert operations.

### Suggested sequence for you
1) Set env vars in staging. Add your email as a verified recipient in Resend.
2) Onboard a test candidate; check you get the welcome email.
3) Request a verification code; confirm it; verify/publish the profile.
4) Perform a representative override (if fast‑tracked) and inspect audit logs.
5) When you obtain a domain, add DKIM/DMARC and switch `EMAIL_FROM`.

This setup gives you a safe, incremental path: fully functional flows for you and QA in freemium mode; upgrade to broad deliverability later by verifying a domain and loosening provider sandbox constraints.

---

## Upgrading to a real domain (choices-app.com via GoDaddy)

Follow these steps after purchasing choices-app.com. This replaces the freemium sandbox limitations with full deliverability and branded links.

### 1) Point the app to your domain (Vercel + GoDaddy)
- In Vercel → Project → Domains:
  - Add `choices-app.com` and (optionally) `www.choices-app.com`.
  - Set one as primary (e.g., apex choices-app.com) and redirect the other to it.
- In GoDaddy DNS, create records Vercel shows you:
  - For apex (choices-app.com): A/ANAME/ALIAS per Vercel guidance (or Vercel CNAME for providers that support it).
  - For www: CNAME to `cname.vercel-dns.com`.
- Wait for propagation; confirm Vercel shows “Configured” and TLS is active.

### 2) Verify the domain in Resend (email sending)
- In Resend → Domains:
  - Add `choices-app.com` as a sending domain.
  - Add the required DKIM CNAME records in GoDaddy (Resend displays exact host/value).
  - Optional (recommended): Add DMARC TXT
    - Host: `_dmarc.choices-app.com`
    - Value (start in monitor mode): `v=DMARC1; p=none; rua=mailto:you@choices-app.com`
    - After 1–2 weeks, consider `p=quarantine`.
- Wait for domain verify to complete in Resend (DKIM).

### 3) Choose senders and routing
- Use a dedicated transactional sender:
  - `verify@choices-app.com` (verification + transactional)
  - `no-reply@choices-app.com` (optional)
  - `press@choices-app.com` (optional, for replies; configure mailbox or forwarding in your mail provider)

### 4) Update environment variables (Vercel → Project → Settings → Environment Variables)
- Production:
  - `NEXT_PUBLIC_APP_URL=https://choices-app.com`
  - `EMAIL_FROM=verify@choices-app.com`
  - `RESEND_API_KEY=YOUR_RESEND_PROD_KEY`
  - `ADMIN_MONITORING_KEY=STRONG_RANDOM_STRING`
  - (Optional) `CRON_SECRET=STRONG_RANDOM_STRING`
- Staging/Preview:
  - Use a staging base URL (e.g., Vercel preview URL) and, if available, a staging sender or verified recipients in Resend.
- Redeploy so the app picks up new envs.

### 5) Configure Resend webhook
- In Resend → Webhooks:
  - Add: `POST https://choices-app.com/api/webhooks/resend`
  - Optional: Enable signing. If enabled, share the signing secret so we can verify signatures server‑side.

### 6) Clean up sandbox mode
- After DKIM verification + EMAIL_FROM set to your domain sender, you no longer need “verified recipients only.”
- Keep staging keys/senders for non‑production tests.

### 7) Branding and SEO
- Confirm OpenGraph/Twitter cards, favicon, and site name reflect choices‑app.com.
- Update any email template branding (logo, colors) when ready.

### 8) Deliverability best practices
- Warm up sending gradually and monitor bounce/complaint rates in Resend.
- Use DMARC `p=none` initially, then move to `p=quarantine` or `p=reject` once stable.
- Keep links on your domain; avoid generic link shorteners.

### 9) Quick validation checklist
- Visit `https://choices-app.com` (HTTPS + correct app).
- Trigger onboarding → welcome email arrives from `verify@choices-app.com`.
- Request verification code → email delivered; confirm code → candidate becomes verified/public when applicable.
- Edit representative overrides (if fast‑tracked) → verify audit entries appear; test admin revert.

### 10) Optional hardening
- Share your Resend webhook signing secret to enable signature verification in `/api/webhooks/resend`.
- Add a URL allowlist for socials; add content sanitization rules for bios (if you need stricter policies).
- Add a staging sender `verify@staging.choices-app.com` if you want strict separation.
*** End Patch

