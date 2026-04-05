# In-app feedback and GitHub Issues

_Last updated: April 5, 2026_

Choices uses **two complementary channels**. They are not duplicates: each has a different audience and data trail.

---

## 1. In-app feedback widget (end users & testers)

- **What:** **`EnhancedFeedbackWidget`** — floating control (when enabled) on the **landing page** and **authenticated app shell**. Submissions go to **`POST /api/feedback`** and are stored for **admin review** (see **Admin → Feedback**, route **`/admin/feedback`**).
- **When to use:** UX issues, vague bugs, ideas, accessibility or performance notes, and **in-context** reports (the payload can include page path, device, session journey, optional screenshot—see `web/components/EnhancedFeedbackWidget.tsx` and `web/app/api/feedback/route.ts`).
- **Types in the widget:** `bug`, `feature`, `general`, `performance`, `accessibility`, `security` (user-facing “security concern” — **not** a substitute for private reporting in [SECURITY.md](../SECURITY.md)).
- **Flags / env:** Feature flag **`FEEDBACK_WIDGET`** (`web/lib/core/feature-flags.ts`). Widget can be hidden with **`NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET=1`** (`web/lib/config/env.ts`).

**Maintainers:** Triage in the admin console; correlate duplicates, then **open a GitHub Issue** from **Admin → Feedback** ( **`IssueGenerationPanel`** ) when **`GITHUB_ISSUES_TOKEN`** and **`GITHUB_ISSUES_REPOSITORY`** are set—see **[`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md)**—or create/link issues **manually** if those vars are unset (API returns **503** until configured).

---

## 2. GitHub Issues (contributors & reproducible work)

- **What:** This repository’s **Issues** tab (templates: bug, feature, documentation).
- **When to use:** You are **developing** Choices, need a **public** discussion, or can supply **repro steps**, **commit range**, **CI logs**, and **Node/npm versions**. This is the right place for patch-sized scope and DCO-signed PRs.
- **When *not* to use:** [SECURITY.md](../SECURITY.md) — never file exploitable vulnerabilities as public issues.

**Overlap:** If you hit a bug **in the deployed app**, you may still use the **widget** first (richer context for triage). If you are **fixing it in code**, open or reference a **GitHub Issue** (or note the widget submission ID in the PR if maintainers shared it).

---

## 3. How the pieces fit together

| Channel | Typical user | Lands in | Best for |
|---------|--------------|----------|----------|
| Feedback widget | Site visitor / tester | Supabase **`feedback`** via API | Context-rich product signal |
| GitHub Issue | Contributor / maintainer | GitHub | Trackable OSS work, PRs, `Closes #…` |
| SECURITY email | Reporter | Private inbox | Vulnerabilities |

Issue templates in **`.github/ISSUE_TEMPLATE/`** are written so they **point widget users** at the right default while keeping **GitHub** focused on actionable, technical reports.

---

## 4. Related code and docs

- Widget: `web/components/EnhancedFeedbackWidget.tsx`
- Public API: `web/app/api/feedback/route.ts` (**`POST /api/feedback`**)
- Admin UI: `web/app/(app)/admin/feedback/` (includes **`IssueGenerationPanel.tsx`**, wired on the feedback page)
- Admin API: **`GET /api/admin/feedback`**, **`POST /api/admin/feedback/[id]/respond`**, **`PATCH /api/admin/feedback/[id]/status`**, **`GET /api/admin/feedback/export`**, **`POST /api/admin/feedback/[id]/generate-issue`**, **`POST /api/admin/feedback/bulk-generate-issues`** (`web/app/api/admin/feedback/`)
- **GitHub:** Issue creation uses the GitHub REST API; requires server env **`GITHUB_ISSUES_TOKEN`** (PAT with `issues:write` on the target repo) and **`GITHUB_ISSUES_REPOSITORY`** (`owner/repo`). Successful runs persist **`metadata.githubIssue`** on the feedback row.
- E2E harness: `web/app/(app)/e2e/feedback/page.tsx`
- Architecture entry point: `docs/ARCHITECTURE.md` § **Where to change what**
- Feature flags: `docs/FEATURE_FLAGS.md` (**`FEEDBACK_WIDGET`**)
- Historical ops notes: `docs/archive/reference/troubleshooting-feed-and-feedback-2025.md`
