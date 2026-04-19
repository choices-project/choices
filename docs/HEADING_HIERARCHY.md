# Heading Hierarchy Guide

_Last updated: March 2026_

Expected h1→h2→h3 order for key pages. Use for manual accessibility QA and E2E selector stability. Some pages may be flaky in E2E due to hydration timing—prefer `data-testid` selectors where available.

## Critical Pages

| Page | Expected Structure | data-testid Fallback |
|------|--------------------|----------------------|
| `/` (marketing) | h1 (hero) | — |
| `/auth` | h1 Sign In / Sign Up | `login-form`, `auth-form` |
| `/dashboard` | h1 Dashboard/Welcome | — |
| `/feed` | h1 Feed | — |
| `/civics` | h1 Civics/Representatives | `state-filter` |
| `/representatives` | h1 Representatives | — |
| `/polls` | h1 Polls | — |
| `/polls/[id]` | h1 (poll title) | — |
| `/profile` | h1 Profile | — |
| `/admin` | h1 Dashboard | — |
| `/admin/feedback` | h1 Feedback Management | `admin-feedback-page` |
| `/admin/users` | h1 User Management | `user-management`, `user-management-title` |
| `/admin/analytics` | h1 Analytics | — |

## Rules

1. **One h1 per page** — Primary page title
2. **h2 for major sections** — e.g. "Poll Options", "Results"
3. **h3 for subsections** — e.g. filter groups, card titles
4. **No level skipping** — Don't go from h1 to h3

## E2E Stability

When heading-based selectors are flaky (hydration, dynamic content):

- Use `data-testid` attributes for critical elements
- Use `getByRole('heading', { name: /pattern/i })` with flexible patterns
- Add `waitForPageReady` before asserting headings
- Consider `assertAnyVisible` with multiple fallback selectors (see `mvp-smoke.spec.ts`)

## Related

- `docs/ROADMAP.md` §2.2 Accessibility QA
- `web/tests/e2e/specs/mvp-smoke.spec.ts` — assertAnyVisible pattern
