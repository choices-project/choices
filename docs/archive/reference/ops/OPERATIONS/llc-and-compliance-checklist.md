## Entity Choice, Compliance, and Launch Checklist (Choices Platform)
This checklist remains prominent for operational readiness. Track execution status in `docs/ROADMAP_SINGLE_SOURCE.md`.

This document is a practical, end‑to‑end checklist to get from “I own choices-app.com” to “I operate the app as a compliant organization.” It covers both LLC and Nonprofit (501(c)(3)) paths and Vercel + Resend for hosting and email.

### 0) One‑page decisions (make these now)
- **Entity type**
  - Nonprofit (501(c)(3)) — mission‑first; donations and many grants become available; volunteer moderators allowed; additional governance (board), annual filings, and public disclosure.
  - LLC (for‑profit) — faster setup; compatible with SBIR/contracts; classic donations not tax‑deductible; volunteers problematic (use stipends/payroll).
- **State of formation**
  - Default: your home state (simplest) for either entity.
  - Alternative: Delaware (if later complexity/VC planned) + foreign registration in your home state.
- **Organization name**: e.g., “Choices Foundation” (nonprofit) or “Choices App LLC” (for‑profit).
- **Registered agent**: ZenBusiness or similar (keeps your address private).

### 1) Form the entity
#### If Nonprofit (501(c)(3)) — recommended for mission alignment
- **Incorporate nonprofit** with the state (Articles of Incorporation with charitable purpose + dissolution clause).
- **Board of directors**: at least 3 (varies by state); adopt bylaws and initial resolutions.
- **EIN**: obtain from IRS (free).
- **501(c)(3) application**: file IRS Form 1023 (standard) or 1023‑EZ (if eligible); prepare narrative of activities, budgets for 3 years, and conflict‑of‑interest policy.
- **State charitable registration** (if required) for fundraising.
- **Annual filings**: IRS Form 990/990‑EZ/990‑N + state reports.

#### If LLC (for‑profit)
- **Articles of Organization**: file with the state.
- **Operating Agreement**: include (single‑member is fine).
- **EIN**: obtain from IRS (free) or via ZenBusiness.
- **Initial compliance**: any state‑specific report/publication.

### 2) Banking & financial hygiene
- **Business bank account** (after EIN): open under LLC name + EIN.
- **Bookkeeping**: Wave, QuickBooks, or similar; keep personal and business separate.
- (If/when you accept payments) **Stripe**:
  - Legal entity: LLC name + EIN + bank account.
  - Set fraud/chargeback rules; configure payout schedule.

> Nonprofit note: You can still use Stripe for donations/fees. Ensure your 501(c)(3) status (or fiscal sponsorship) is reflected for donor tax receipts. Keep restricted vs unrestricted funds tracked.

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
1) Decide entity (Nonprofit vs LLC), formation state, name, registered agent.
   - If Nonprofit: incorporate + EIN → file 1023/1023‑EZ with board, bylaws, COI policy and 3‑yr budgets.
   - If LLC: file Articles + Operating Agreement + EIN.
2) Open business bank account; connect bookkeeping.
3) Point `choices-app.com` to Vercel; verify TLS.
4) In Resend: add domain, DKIM, (optional) DMARC; set sender `verify@choices-app.com`.
5) Set app env vars; redeploy.
6) Populate ToS/Privacy/AUP links in the app footer.
7) Run end‑to‑end tests (email verification, publish, overrides, admin revert).
8) Monitor deliverability; tighten DMARC to `p=quarantine` once stable.

---

## Nonprofit vs LLC: Opportunities and Trade‑offs

### Opportunities unlocked by Nonprofit (501(c)(3))
- **Donations & tax‑deductibility**: Individuals and foundations can donate; many require 501(c)(3) status.
- **Grants**: Broad access to federal/state/local/civic/philanthropic grants not open to for‑profits.
- **Volunteers**: True volunteers can lawfully contribute moderation/support without wage issues.
- **Public trust & governance**: Board oversight and public 990s can build credibility for civic tech.

### Trade‑offs for Nonprofit
- **Time to status**: 1023 processing can take months (1023‑EZ faster if eligible). Consider **fiscal sponsorship** as a bridge.
- **Governance overhead**: Board meetings, minutes, bylaws, conflict-of‑interest policies, public disclosures.
- **Revenue flexibility**: Commercial product add‑ons may require a separate taxable subsidiary or UBIT management.

### Opportunities with LLC (for‑profit)
- **Speed**: Quick to form and pivot.
- **Government innovation funds**: SBIR/STTR and certain contracts are for‑profit friendly.
- **Commercial revenue**: Fewer restrictions on monetization.

### Trade‑offs for LLC
- **Donations**: Not tax‑deductible to donors; many foundation grants unavailable (unless via fiscal sponsorship or as a subrecipient).
- **Volunteers**: Risky; use stipends/payroll instead.

### Hybrid/bridge options
- **Fiscal sponsorship**: A nonprofit “sponsor” receives deductible donations/grants on your behalf while you operate; later spin out as your own 501(c)(3).
- **Sister entities**: A 501(c)(3) for mission; an LLC/subsidiary for commercial add‑ons (clear cost allocation & governance needed).

Keep this file as your operational playbook; check off items and add dates/owners as you proceed. If you need, I can generate ToS/Privacy/AUP templates tailored to the app’s current feature set and wire footer links.*** End Patch

