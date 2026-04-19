# Keyboard Navigation Audit Checklist

_Last updated: March 2026_

Manual checklist for the roadmap item **2.2 Keyboard navigation audit**. E2E coverage: `tests/e2e/specs/accessibility/keyboard-navigation.spec.ts` (skip link, marketing home focusables, dashboard main).

## Scope

- **Tab order** — Logical flow through each page; no trapped focus.
- **Focus visibility** — Focus ring visible on all interactive elements.
- **Modals/dialogs** — Focus trapped inside; Escape closes; focus returns to trigger on close.

## Pages to Verify

| Page | Notes |
|------|--------|
| `/` (marketing home) | Skip link first, then primary CTAs; legacy `/landing` redirects here (308) |
| `/auth` | Form fields, submit, links |
| `/dashboard` | Nav, main content, any widgets |
| `/feed` | Filters, items, load more |
| `/civics` | State filter, rep cards, load more |
| `/representatives` | Sidebar, list, filters |
| `/polls` | Filters, poll cards, create CTA |
| `/polls/[id]` | Vote options, results, share |
| `/profile` | Tabs, form fields, save |
| `/admin` | Sidebar, dashboard widgets |
| `/admin/feedback` | Filters, list, detail modal |
| `/admin/users` | Search, filters, role actions |

## Modals / Dialogs

- **Vote confirmation** (polls) — Bottom sheet / dialog; Escape closes; focus returns to vote button.
- **Device list / QR** — useAccessibleDialog (focus trap, Escape).
- **Feedback detail** (admin) — Focus trap, Escape.
- **Alert dialogs** (delete user, etc.) — Focus on primary action; Escape cancels.

## Quick Test

1. Use **Tab** only (no mouse) to reach all interactive elements.
2. Use **Shift+Tab** to go backward; order should be consistent.
3. Open each modal; confirm **Escape** closes it and focus returns.
4. Confirm **Skip to main content** is first focusable on key pages (one skip link, rendered inside `NextIntlClientProvider` so copy matches locale; accessible name comes from link text only).

## Related

- `docs/ROADMAP.md` — Accessibility QA (section 2.2)
- `docs/HEADING_HIERARCHY.md` — heading structure and data-testid fallbacks
- `web/tests/e2e/specs/accessibility/keyboard-navigation.spec.ts` — automated checks
