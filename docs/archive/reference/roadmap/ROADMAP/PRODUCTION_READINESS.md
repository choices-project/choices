## Production Readiness Roadmap (Single Source of Truth)

This document lists all remaining work to reach “production‑grade” across product, infrastructure, security, compliance, and operations. Treat it as the canonical backlog until launch; update status here as items complete.

Legend: [P0]=blocking for launch, [P1]=launch‑critical, [P2]=post‑launch polish

### 1) Infrastructure & Domain [P0]
- DNS: choices-app.com → Vercel primary; www redirect confirmed; TLS active
- Environment variables (prod):
  - NEXT_PUBLIC_APP_URL=https://choices-app.com
  - EMAIL_FROM=verify@choices-app.com
  - RESEND_API_KEY=prod key
  - ADMIN_MONITORING_KEY=strong value
  - (Optional) CRON_SECRET
- Vercel project settings: build cache, Node version, region (latency choice), secrets management

### 2) Email Deliverability (Resend) [P0]
- Resend domain verification (choices-app.com): DKIM CNAME records live, verified
- DMARC TXT: _dmarc.choices-app.com → start with p=none, add rua mailbox
- Sender identity: verify@choices-app.com configured and tested
- Webhook: POST /api/webhooks/resend added in Resend; verify events received
- (Optional) Webhook signing enabled → add signature verification code

### 3) Candidate Verification & Fast‑Track [P0]
- Verify request/confirm: full happy‑path test (create code, email received, confirm, link rep if unique)
- Edge cases: expired code, wrong code, resend code rate limit
- Official email fast‑track (existing) tested on verified sender/domain
- Representative overrides: owner edit limited to public‑facing fields only; read path merges overrides; audit rows created

### 4) Admin Observability & Controls [P0]
- Admin stats endpoint live and returning reasonable data
- Admin audit endpoints: candidates + representatives list/diff verified
- Admin revert endpoint: field‑level revert tested against both audit tables
- Admin key rotation plan (change ADMIN_MONITORING_KEY without downtime)

### 5) Security Baseline [P0]
- Secrets stored in Vercel secret manager; verify no secrets in git
- Rate limits:
  - Verify/request: per-IP and per‑user limits holding in prod env
  - Candidate PATCH and overrides POST: rate limits + analytics logging confirmed
- Input validation:
  - Candidate PATCH: URL validation, bio length, social link checks
  - Overrides POST: URL validation, short bio length, socials check
- Logging: no sensitive data (e.g., verification codes) logged; analytics metadata limited (domains not full emails)

### 6) Privacy & Compliance [P0]
- ToS & Privacy Policy added to site footer, reflecting:
  - Verification emails, analytics events, audit logs, moderation
  - Data retention (e.g., 12–24 months for audit logs)
  - User rights/process to request deletion or report issues
- Security policy: SECURITY.md email monitored

### 7) Moderation & Reporting [P1]
- Field/content report endpoint (user → admin queue)
- Basic triage UI or admin endpoint workflow (list/filter/resolve)
- Moderator playbook (escalation, turnaround, appeals) documented

### 8) Testing & Quality [P0]
- Contract tests:
  - /api/candidates/onboard
  - /api/candidates/[slug] (PATCH validation + publish toggle)
  - /api/candidates/verify/request + /confirm
  - /api/representatives/self/overrides
  - Admin: stats, audit list, revert
- E2E:
  - Candidate: onboard → welcome email → verify request/confirm → publish
  - Representative: overrides edit → read merge → audit & revert
  - Email webhook: event received and logged
- CI pipeline: lint, type‑check, unit/contract, and key E2E smoke

### 9) Performance & Caching [P1]
- Candidate pages: ETag/If‑None‑Match on GET; short CDN cache for public pages
- Representative read: cache merged result (short TTL), fallback on cache miss
- Monitor cold start and TTFB on Vercel

### 10) Analytics & Dashboards [P1]
- Funnel: start→verified→published (events emitted and confirmed)
- Admin KPIs endpoint or page: counts, publish rate, time‑to‑verify
- Deliverability dashboard: code sent, delivered, bounced (aggregate webhook events)

### 11) i18n, a11y, SEO [P2]
- i18n: extract strings in candidate flow; pluggable locales scaffolding
- a11y: keyboard nav, ARIA for candidate page and edit controls; color‑contrast pass
- SEO/meta: OpenGraph/Twitter cards for candidate public pages

### 12) Documentation & Runbooks [P1]
- Updated README (done); add quick links to ops docs
- Email & verification ops (done): confirm domain/DKIM steps after live test
- LLC/Nonprofit ops: chosen path confirmed; if Nonprofit, add 1023/1023‑EZ prep docs
- Runbook: incident response (email outage, rate‑limit spikes), admin key rotation, revert procedure

### 13) Governance & Open Source [P1]
- MIT license (done), DCO sign‑offs (CONTRIBUTING.md done), CoC (done), SECURITY (done), TRADEMARKS (done)
- Add footer links to ToS/Privacy and governance docs
- Add “suggest correction” link near public profile to reduce support load

### 14) Funding Readiness (Optional but Recommended) [P2]
- SAM.gov registration + UEI (if grants/contracts planned)
- NAICS codes + SBA small business profile (if LLC path retained for SBIR/contracting)
- Nonprofit path: if selected, start 1023/1023‑EZ and consider fiscal sponsorship in parallel

### 15) Launch Checklist (Final Gate) [P0]
- Live smoke checks (staging → prod):
  - Homepage reachable (choices-app.com)
  - Onboard → welcome email delivered
  - Verify request → email delivered; code confirm success
  - Publish toggle works; public page loads with SEO tags
  - Overrides edit works; admin audit populated; revert works
- Logs/metrics:
  - Errors monitored (Sentry), rate‑limit breach alerts in logs
  - Email failures visible via Resend + webhook analytics
- Backups/snapshots: DB backups scheduled; restore tested on staging

---

### Appendix A — Items Completed (Do not remove, append as completed)
- Candidate onboarding, publish, inline owner edit
- Verification flow (request/confirm), code storage, rate limits, analytics
- Representative overrides with audit + merged read path
- Admin audit list and revert endpoints
- Email integration with Resend; webhook endpoint
- Ops docs: email/domain; entity checklist; governance docs; README update

---

### Ownership & Status
Use this section to add assignees and status. Example:
- Owner: @you • Review: @maintainer • Target: YYYY‑MM‑DD
- Status: Not started / In progress / Blocked / Done

P0 owners:
- Infra & Domain
- Email Deliverability
- Candidate Verification & Fast‑Track
- Admin Observability & Controls
- Security Baseline
- Privacy & Compliance
- Testing & Quality
- Launch Checklist

Keep this file authoritative; all new tasks must be added here before implementation.

