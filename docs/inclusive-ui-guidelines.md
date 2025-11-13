# Inclusive UI Guidelines

Last updated: 2025-11-13  
Status: Draft (governance review pending)

---

## 1. Purpose & Scope
- Establish baseline expectations for accessibility and internationalisation (i18n) across all user-facing surfaces.
- Apply to `web/app`, `web/components`, and `web/features` code paths, including harnesses used for automated audits.
- Complement existing engineering standards (`docs/TECHNICAL/testing-harness-playbooks.md`, design system specs).

## 2. Core Principles
- **Perceivable:** Provide semantic structure, descriptive copy, and media alternatives.
- **Operable:** Ensure keyboard-only, switch, and screen-reader workflows remain unblocked.
- **Understandable:** Surface consistent patterns, inline guidance, and accurate translations.
- **Robust:** Maintain automated checks (axe, Playwright) and predictable DOM for assistive tech.

## 3. Layout & Landmark Checklist
- Each page exposes at minimum `html[lang]`, `head` meta, `main`, and visible headings that reflect page hierarchy.
- Provide skip links for primary navigation experiences (`/`, `/admin`, `/polls`, `/onboarding`).
- When using nested layouts (modals, drawers), restore focus to trigger and keep tab order linear.

## 4. Component Requirements
| Area | Expectations | References |
| --- | --- | --- |
| Buttons, Links | Accessible names, ARIA truncated to essentials, visible focus rings. | `components/ui/button`, `components/ui/link` |
| Forms | Associate labels, show inline errors with `aria-describedby`, announce validation via polite region. | `features/onboarding`, `features/auth` |
| Dialogs & Overlays | Use `useAccessibleDialog`, trap focus, announce open/close, support ESC + close button. | `lib/accessibility/useAccessibleDialog.ts` |
| Notifications & Live Regions | Use `ScreenReaderSupport` helpers, choose `aria-live` politeness deliberately, auto-dismiss with graceful timeout. | `components/SiteMessages.tsx`, `features/pwa` |
| Data Visualisations | Provide textual summaries, keyboard support, captions. Use `AccessibleResultsChart` patterns for charts. | `components/accessible/AccessibleResultsChart.tsx` |
| Poll Filters & Cards | Surface translated labels/CTA text via `useI18n`, respect locale-aware number & date formatting, and expose clear ARIA labels for filter controls. | `features/polls/components/PollFiltersPanel.tsx`, `app/(app)/polls/page.tsx` |
| Feed Infinite Scroll | Localise loading/refresh states, provide descriptive aria-labels for scroll-to-top controls, and ensure pull-to-refresh gestures announce status. | `features/feeds/components/InfiniteScroll.tsx` |

## 5. Interaction Patterns
- **Keyboard:** Every interactive element must be reachable via `Tab` / `Shift+Tab`, trigger with `Enter`/`Space`. Provide skip controls for repeated menus.
- **Focus Management:** After route changes or async loading, programmatically move focus to the first meaningful element.
- **Announcements:** Broadcast significant state changes (`aria-live`) using existing helpers (e.g., vote submission, PWA updates).

## 6. Internationalisation Guidance
- All strings must call `t('namespace.key', { placeholders })`; no raw JSX literals in covered directories.
- Translation keys live under `web/messages/*.json`; keep namespaces small and domain focused (e.g., `polls.filters.*`, `polls.page.*`).
- Run `npm run i18n:extract` to update `messages/en.snapshot.json` whenever keys change.
- Use ICU message syntax for plurals, numbers, dates. Avoid concatenation; prefer `Intl.NumberFormat` / `Intl.DateTimeFormat` helpers (see polls listing example).

## 7. Testing Requirements
- **Automation:** Playwright specs must call `runAxeAudit` before/after major state changes.
- **Manual:** Schedule assistive technology spot checks (NVDA, VoiceOver) per release; log findings in `scratch/gpt5-codex/archive/inclusive-platform/manual-a11y-smoke-YYYY-MM-DD.md`.
- **Regression Gates:** CI step (`Verify i18n snapshot`) blocks stale message snapshots. Keep lint clean once `hasLegacyCopy` flag flips.

## 8. Design & Content Collaboration
- Partner with Design for contrast checks, iconography semantics, and responsive behaviour.
- Provide content guidelines for alt text, microcopy tone, and translation-ready placeholders.
- Maintain shared glossary in `docs/technical/i18n-workflow.md`.

## 9. Change Management
- Document deviations in pull requests; include screenshots or screen-reader transcripts when helpful.
- Update this guideline when new patterns ship (e.g., analytics dashboards, feeds).
- Review quarterly with Product, Design, and QA; capture action items under GOV-001.

---

### Appendices
- **A. Resources:** WCAG 2.2 summary, WAI-ARIA Authoring Practices, Next.js accessibility docs.
- **B. Contacts:** Accessibility Owner (Engineering), I18n Owner (Product/Localization), QA Lead.


