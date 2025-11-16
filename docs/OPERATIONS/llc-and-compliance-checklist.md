## LLC, Compliance, and Launch Checklist (Choices Platform)

This document is a practical, end‑to‑end checklist to get from “I own choices-app.com” to “I operate the app as a compliant business.” It assumes you’ll use ZenBusiness (or similar) to file the LLC and Vercel + Resend for hosting and email.

### 0) One‑page decisions (make these now)
- **State of formation**
  - Default: your home state (simplest).
  - Alternative: Delaware + foreign registration in your home state (more filings/fees; common for startups).
- **LLC name**: “Choices App LLC” (or variant) — confirm availability in your state registry.
- **Registered agent**: choose ZenBusiness (keeps your address private) or similar.

### 1) Form the LLC (ZenBusiness can do most of this)
- **Articles of Organization**: file with the state.
- **Operating Agreement**: include (single‑member is fine).
- **EIN**: obtain from IRS (free) or have ZenBusiness do it.
- **Initial compliance**: any state‑specific initial report/publication.

### 2) Banking & financial hygiene
- **Business bank account** (after EIN): open under LLC name + EIN.
- **Bookkeeping**: Wave, QuickBooks, or similar; keep personal and business separate.
- (If/when you accept payments) **Stripe**:
  - Legal entity: LLC name + EIN + bank account.
  - Set fraud/chargeback rules; configure payout schedule.

### 3) App hosting and domain
- **Vercel**: add `choices-app.com` to your project; set primary domain; redirect `www` → apex (or vice‑versa).
- **GoDaddy DNS**: create records Vercel provides (A/ANAME/CNAME); wait for TLS to activate.
- **NEXT_PUBLIC_APP_URL**: set to `https://choices-app.com` (Vercel Env → Production).

### 4) Email deliverability (Resend)
- **Add domain in Resend**: `choices-app.com` → add DKIM CNAMEs in GoDaddy DNS.
- **DMARC** (recommended): start with monitor mode
  - Host: `_dmarc.choices-app.com`
  - Value: `v=DMARC1; p=none; rua=mailto:you@choices-app.com`
  - Move to `p=quarantine` after you confirm good deliverability.
- **Sender identities**:
  - `verify@choices-app.com` (verification + transactional)
  - `no-reply@choices-app.com` (optional)
  - `press@choices-app.com` (optional, mailbox or forwarder)
- **Webhooks** (optional, recommended): Resend → `POST https://choices-app.com/api/webhooks/resend`
  - If you enable signing, share the secret so we can add signature verification.

### 5) App environment variables (Vercel → Project → Environment)
- Production:
  - `NEXT_PUBLIC_APP_URL=https://choices-app.com`
  - `EMAIL_FROM=verify@choices-app.com`
  - `RESEND_API_KEY=YOUR_RESEND_PROD_KEY`
  - `ADMIN_MONITORING_KEY=STRONG_RANDOM_STRING`
  - (Optional) `CRON_SECRET=STRONG_RANDOM_STRING`
- Staging/Preview:
  - Use staging base URL (Vercel preview) and a staging sender or “verified recipients” in Resend.

### 6) Legal, policies, and transparency
- **Terms of Service & Privacy Policy** (must‑have for launch):
  - Reference: email verification, analytics, audit logs, rate limits, user‑generated content, moderation, data retention.
  - Add an email contact for legal/privacy (e.g., `legal@choices-app.com`).
- **AUP / Community Guidelines**: short and clear; align with your moderation tools.
- **Takedown/DMCA**: a simple form or email path for reports; document response flow.
- **Data retention**: pick timeframes for audit logs (e.g., 12–24 months) and document them.

> Open Source note (MIT): The business filings (LLC/EIN) are unchanged by open‑sourcing the code. What changes is outbound/inbound licensing and contributor policies:
> - Outbound: Project is licensed under **MIT** (LICENSE at repo root).
> - Inbound: Use **DCO** (Developer Certificate of Origin) — contributors sign‑off commits (`git commit -s`). See CONTRIBUTING.md.
> - Code of Conduct: CODE_OF_CONDUCT.md applies across project spaces.
> - Security: SECURITY.md explains private disclosure for vulnerabilities.
> - Trademarks: TRADEMARKS.md clarifies name/logo use (separate from MIT code license).

### 7) Security & privacy hardening
- **Secrets**: store all keys in Vercel Secrets (not in code).
- **MFA**: enable on Resend, Vercel, Stripe, and your bank.
- **CSP headers**: add a baseline Content‑Security‑Policy and Report‑To endpoint (optional now, recommended later).
- **Sanitization**: keep bios as plain text or add stricter HTML sanitization; add URL allowlist for socials.

### 8) Admin & moderation operations
- **Admin access**: share `ADMIN_MONITORING_KEY` securely with operators.
- **Audit UI**: use admin endpoints to view candidate/override edits and revert single fields.
- **Moderation**: define strike paths and escalation steps (what triggers removal/revert).

### 9) Test & launch checklist
- **Verification flow**: onboard → welcome email → request code → receive email → confirm → publish.
- **Overrides flow** (fast‑tracked rep): submit override → view on public page → confirm audit entry → test admin revert.
- **Deliverability**: check inbox placement (not spam); monitor provider logs and webhook analytics.
- **SEO/social**: verify OpenGraph/Twitter cards render for `/candidates/[slug]` public pages.

### 10) Taxes and compliance timing
- **Federal**: single‑member LLC defaults to pass‑through (Schedule C); keep clean books.
- **State**: track annual reports, franchise tax. ZenBusiness can auto‑file reminders.
- **S‑Corp election**: consider later with accountant if/when profit warrants payroll optimization.

### 11) Optional upgrades (post‑launch)
- **Webhook signature verification** (Resend) for `/api/webhooks/resend`.
- **Staging sender**: `verify@staging.choices-app.com` for stricter environment isolation.
- **Stripe + subscriptions**: only when you’re ready to accept payments.
- **Trademark**: if you plan to defend the brand.

### Your minimal action plan (in order)
1) Decide formation state, LLC name, registered agent → have ZenBusiness file LLC, Operating Agreement, EIN.
2) Open business bank account; connect bookkeeping.
3) Point `choices-app.com` to Vercel; verify TLS.
4) In Resend: add domain, DKIM, (optional) DMARC; set sender `verify@choices-app.com`.
5) Set app env vars; redeploy.
6) Populate ToS/Privacy/AUP links in the app footer.
7) Run end‑to‑end tests (email verification, publish, overrides, admin revert).
8) Monitor deliverability; tighten DMARC to `p=quarantine` once stable.

Keep this file as your operational playbook; check off items and add dates/owners as you proceed. If you need, I can generate ToS/Privacy/AUP templates tailored to the app’s current feature set and wire footer links.*** End Patch

