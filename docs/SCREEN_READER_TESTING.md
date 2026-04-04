# Screen Reader Testing Checklist

_Last updated: March 14, 2026_

Manual QA checklist for NVDA (Windows), JAWS (Windows), and VoiceOver (macOS/iOS). See `docs/ROADMAP.md` §2.2.

---

## Setup

| Tool | Platform | Notes |
|------|----------|-------|
| **NVDA** | Windows | Free, open source. Download: https://www.nvaccess.org/ |
| **JAWS** | Windows | Commercial; trial available. |
| **VoiceOver** | macOS | Built-in: Cmd+F5 to toggle. iOS: Settings → Accessibility → VoiceOver |

---

## Key Flows to Test

### 1. Auth (Sign in / Register)

- [ ] Focus moves to first field (email) on page load
- [ ] Tab order: email → password → submit
- [ ] Required fields announced
- [ ] Error messages announced (e.g. "Invalid credentials")
- [ ] Success redirect announced or focus moves to next page landmark

### 2. Voting

- [ ] Poll options announced with labels
- [ ] Vote button has clear label
- [ ] Success feedback announced (e.g. "Vote recorded")
- [ ] Ranked polls: order of options clear; drag/drop alternatives announced

### 3. Dashboard / Feed

- [ ] Page title/heading announced
- [ ] Skip to main content works
- [ ] Feed items announced in logical order
- [ ] Interactive elements (like, share, bookmark) have labels

### 4. Civics / Representatives

- [ ] Representative cards announced with name, party, office
- [ ] Follow/Contact buttons have clear labels
- [ ] Search/filter controls announced

### 5. Modals and Dialogs

- [ ] Focus trapped inside modal when open
- [ ] Escape closes modal and returns focus
- [ ] Modal title/description announced on open

---

## Quick Checks

- **Landmarks**: Main content in `<main>`, nav in `<nav>`, forms labeled
- **Headings**: Logical hierarchy (h1 → h2 → h3)
- **Images**: All have `alt` (or `alt=""` for decorative)
- **Buttons/Links**: Descriptive text, not "Click here"
- **Live regions**: Dynamic updates (e.g. vote count) use `aria-live` where appropriate

---

## Reference

- [WCAG 2.1 Understanding Docs](https://www.w3.org/WAI/WCAG21/Understanding/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
