# UX Improvements: Recommended Packages

This list highlights packages that would materially improve user experience and developer ergonomics. Add only when a feature or refactor needs them.

## High impact

1. `react-hook-form` + `@hookform/resolvers`
   - Consistent form validation and error handling across the app.
   - Fewer bespoke input handlers; better accessibility defaults.

2. `@tanstack/react-virtual`
   - Virtualized lists for feeds, representatives, polls, and admin tables.
   - Reduces scroll jank and improves perceived performance.

3. `@floating-ui/react`
   - Reliable positioning for tooltips, menus, and popovers.
   - Better collision handling across responsive layouts.

## Medium impact

1. `@testing-library/user-event`
   - More accurate interaction tests (keyboard, typing, focus).
   - Keeps RTL tests aligned with real user behavior.

## Adoption plan

1. Pick one surface (e.g., profile edit form) and migrate to `react-hook-form`.
2. Virtualize the heaviest list (start with representatives search results).
3. Replace custom popover positioning in admin menus with `@floating-ui/react`.

Track updates in `docs/ROADMAP_SINGLE_SOURCE.md` before adding new dependencies.
