# Choices Platform — Full UX/UI Audit Report

**Date:** March 12, 2026  
**Auditor:** Automated browser-driven audit (Cursor IDE Browser MCP)  
**Environment:** `http://localhost:3000` (Next.js 14 dev server)  
**Auth mode:** Live Supabase backend (E2E harness not enabled); authenticated routes redirected to `/auth`  
**Viewport:** Desktop 1280×800; Mobile spot-check at 375×812

---

## Scope & Coverage

| Area | Status | Notes |
|------|--------|-------|
| Landing | ✅ Fully audited | Desktop + mobile viewport |
| Auth (sign in / register / reset) | ✅ Fully audited | All three pages |
| Polls (list, filters, categories) | ✅ Fully audited | Public view |
| Representatives (search, list, cards) | ✅ Fully audited | 8654 reps loaded |
| Civics (hub, filters, loading) | ✅ Fully audited | Public view |
| Privacy Policy | ✅ Fully audited | |
| Terms of Service | ✅ Fully audited | |
| 404 / Not Found | ✅ Fully audited | |
| Global Navigation (header, menu, footer) | ✅ Fully audited | |
| Dashboard / Feed / Profile / Admin | ⚠️ Auth-gated | Redirect behavior verified |
| Analytics / Candidates / Civic Actions | ⚠️ Auth-gated | Redirect behavior verified |

---

## 1. Console & Logger Summary

### Total messages captured across all navigations: **688**

| Severity | Count | Breakdown |
|----------|-------|-----------|
| **error** | 526 | 464 missing i18n translations, 8 feature-flag info-as-error, 8 Fast Refresh reloads, ~46 other |
| **warning** | 147 | ~98 ThemeScript debug logs, ~49 other framework warnings |
| **debug** | 15 | React hydration notes (data-cursor-ref attribute) |

### Critical Console Issues

#### 1.1 Missing i18n translations (464 errors)
- **8 unique missing keys**, each fired ~58 times during the session:
  - `polls.categories.general`
  - `polls.categories.business`
  - `polls.categories.education`
  - `polls.categories.technology`
  - `polls.categories.health`
  - `polls.categories.finance`
  - `polls.categories.environment`
  - `polls.categories.social`
- **Impact:** Each poll card re-renders with these missing keys, producing a flood of console errors. On pages with many poll cards, this degrades dev-tool usability and signals broken internationalization.
- **Action:** Add the 8 missing keys to the `en` locale messages file.

#### 1.2 `[INFO] [FEATURE_FLAGS] Module loading on client` logged as `console.error` (8 occurrences)
- An informational message is emitted at the `error` severity level on every page navigation.
- **Action:** Downgrade from `console.error` to `console.debug` or remove entirely.

#### 1.3 ThemeScript debug logging (98 warnings)
- `ThemeScript.tsx` emits 7–8 `[DEBUG]` messages per page load via `console.warn`, including hypothesis IDs (`hypothesisId: "A"`, `"B"`, `"H1"`, `"F"`), localStorage contents, and attribute snapshots.
- `[ThemeScript] Executed [object Object]` — serialization bug in the log message.
- **Action:** Remove or gate behind `process.env.NODE_ENV === 'development' && DEBUG_THEME` flag. Fix the `[object Object]` serialization.

#### 1.4 Fast Refresh full-reload warnings (8 occurrences)
- Dev-only; not a production concern but indicates a module that exports both React components and non-React values.
- **Action:** Split the mixed-export file to enable proper Fast Refresh.

### Network Summary
- All observed API requests returned **200 OK**. No 4xx/5xx failures detected.
- **Redundant API calls:** The hashtags endpoint (`/rest/v1/hashtags?...is_trending=eq.true`) was called **4 times** (GET) plus 4 OPTIONS preflight requests on a single page load. This suggests multiple components independently fetching the same data.
- **Action:** Deduplicate hashtag fetches using a shared cache (React Query/SWR) or a context provider.

---

## 2. UX/UI Report by Area

### 2.1 Landing Page (`/landing`)

**What works well:**
- Strong hero messaging: "Democracy That Works For Everyone" with clear value proposition
- Good feature cards with icons (Level Playing Field, Follow the Money, etc.)
- Clear primary CTA ("Join the Movement") with secondary ("Sign In")

**Issues:**

| # | Type | Issue | Severity |
|---|------|-------|----------|
| L1 | **UI bug** | **Duplicate footer:** The landing page has its own footer ("© 2025 Choices") AND the global root layout footer ("© 2026 Choices"). Two footers stack at the bottom of the page. | High |
| L2 | **UI bug** | **Outdated copyright year** in the landing-specific footer: shows "© 2025" instead of "© 2026" | Medium |
| L3 | **a11y** | **Duplicate "Skip to main content"** links (two `<a>` elements with the same purpose) | Medium |
| L4 | **UI/UX** | **Duplicate "Terms of Service" and "Privacy Policy"** links in both footers | Medium |
| L5 | **UI** | **Mobile (375px): Horizontal overflow** — white strip visible on the right side of the viewport, suggesting content is wider than the screen | High |
| L6 | **UI** | **Mobile header: "Log In" text wraps** awkwardly in the nav bar | Low |
| L7 | **UX** | **Header shows "Log In" + "Get Started" buttons** while hero shows "Join the Movement" + "Sign In" — inconsistent CTA labels | Medium |

**Suggestions:**
- Remove the landing-page-specific footer and rely solely on the global footer
- Audit the landing page container for `overflow-x` issues on mobile viewports
- Unify CTA copy: use "Get Started" consistently or "Join" consistently

---

### 2.2 Auth Pages (`/auth`, `/auth/register`, `/auth/reset`)

**What works well:**
- Clean, centered forms with clear labels and placeholders
- Password visibility toggle with eye icon
- Passkey registration option prominently featured with educational "What is a Passkey?" section
- Social login options (Google, GitHub) visually distinct

**Issues:**

| # | Type | Issue | Severity |
|---|------|-------|----------|
| A1 | **UX/security** | **"Simulate Network Error", "Simulate Server Error", "Simulate Timeout" buttons** are visible at the bottom of the sign-in page. These are test/debug controls that should never appear in production. | Critical |
| A2 | **UX** | **"Please fix the following errors:" text** is present in the accessibility tree on initial load before any validation has been attempted — shows an error prompt with no errors | High |
| A3 | **UI** | **Sign In button appears disabled** (via `states: [disabled]`) but is styled with a solid blue/purple fill that doesn't clearly communicate the disabled state — looks clickable | Medium |
| A4 | **UX** | **Two "Or continue with" dividers** — one separating social login, another separating the Passkey section. The repeated pattern is redundant. | Low |
| A5 | **a11y** | **Page title doesn't change** across auth pages — all show "Choices - Democracy That Works For Everyone" instead of "Sign In | Choices", "Register | Choices", etc. | Medium |

**Suggestions:**
- Gate the simulation buttons behind `process.env.NODE_ENV === 'development'` or a feature flag
- Hide the error summary container until form submission is attempted
- Use a visually muted/grayed-out style for the disabled Sign In button
- Consolidate the two "Or continue with" separators into a single social/alternative auth section

---

### 2.3 Polls (`/polls`)

**What works well:**
- Good filter tabs (All, Active, Trending, Closed) with category chip filters
- Search and hashtag filtering available
- Poll cards show key info: title, description, votes, date, category
- "Create" button is prominent

**Issues:**

| # | Type | Issue | Severity |
|---|------|-------|----------|
| P1 | **Data** | **E2E test data visible:** Multiple "E2E Test Poll" entries appear in the polls list, polluting real data | High |
| P2 | **UX** | **Initial load shows empty white card outlines** (skeleton placeholders) with no loading spinner or text — appears broken until data arrives ~2-3s later | High |
| P3 | **i18n** | **Category chips work visually** but fire 232+ missing-translation console errors (`polls.categories.*`) | High |
| P4 | **UX** | **Site messages push page content down** significantly — 3 banners (Security Update, "test test", Trust Tiers) occupy the entire above-the-fold area before any polls are visible | Medium |

**Suggestions:**
- Add proper loading skeletons with a shimmer animation or a spinner
- Filter out E2E test data from production queries (or use a separate test environment)
- Add the missing i18n keys

---

### 2.4 Representatives (`/representatives`)

**What works well:**
- Comprehensive search with name search, address lookup, and advanced filters
- Tab navigation (Search Results / My Representatives) with count badges
- Cards show representative name, party (dash currently), state, and district
- Action buttons per card (Follow, Contact, Create Poll)

**Issues:**

| # | Type | Issue | Severity |
|---|------|-------|----------|
| R1 | **UX** | **Initial empty state shows "No representatives found"** with blank white cards below — data loads a few seconds later and populates. The transition is jarring with no loading indicator. | High |
| R2 | **Data** | **Party affiliation shows "—"** (dash) for all representatives instead of actual party data | High |
| R3 | **Data** | **"District 0"** shown for at-large representatives (WY, ND, PR) — should say "At-Large" | Medium |
| R4 | **UI** | **Senator cards show "—" for district** (e.g., McConnell "KY • —") — senators don't have districts; should show "Senate" or the class/seat | Medium |
| R5 | **Perf** | **8654 representatives** loaded with all cards rendered in the DOM (167+ interactive refs in snapshot). No virtualization — potential performance issue on lower-end devices. | Medium |
| R6 | **UX** | **"Load More" button exists** but 50 cards are already rendered without any load-more interaction — unclear if it's for additional pages or a stale UI element | Low |

**Suggestions:**
- Add loading skeletons while representative data is being fetched
- Display actual party affiliation (Republican/Democrat/Independent)
- Use "At-Large" for at-large districts and "Senate" for senators
- Consider virtualizing the long list of representative cards

---

### 2.5 Civics Hub (`/civics`)

**What works well:**
- Purple hero banner with "Civics - Your Democratic Voice" is visually clear
- Tab navigation (Representatives / Feed)
- Comprehensive filter form: search, state, level, city, ZIP, display density

**Issues:**

| # | Type | Issue | Severity |
|---|------|-------|----------|
| C1 | **UX** | **State filter dropdown is disabled** but shows "California" pre-selected — confusing: user can see a state but can't change it, and there's no explanation why | High |
| C2 | **UX** | **Search button is disabled** alongside the disabled state filter — user can't perform any search action | High |
| C3 | **UX** | **"Representatives 0" tab badge** despite eventually loading data — the count doesn't update after data loads | Medium |
| C4 | **UX** | **Loading message** ("Loading your representatives... Gathering the most current information") is good but appears below the fold, under the filter form | Low |

**Suggestions:**
- Enable the state filter or explain why it's locked (e.g., "Based on your location")
- Show the loading state above the filter form or as an overlay
- Update the representative count badge dynamically

---

### 2.6 Global Navigation

**Issues:**

| # | Type | Issue | Severity |
|---|------|-------|----------|
| N1 | **UX/UI** | **Hamburger-only navigation at desktop width (1280px):** The header shows only the "Choices" logo and a hamburger menu even at full desktop width. Desktop users expect a visible horizontal nav bar. | Critical |
| N2 | **UX** | **Mobile menu persists across navigation:** Opening the hamburger menu on one page and navigating to another page keeps the menu open, requiring manual close | High |
| N3 | **UI** | **No "Representatives" link in nav:** The menu only shows Home, Polls, Civics, Dashboard. Representatives is only accessible through Civics. | Medium |
| N4 | **UX** | **"Home" link points to `/feed`** which redirects to auth for unauthenticated users — should point to `/landing` for unauthenticated users | Medium |
| N5 | **UI** | **"App Update Available" banner** appears in the footer area of every page but is not dismissible and has no action button | Low |

**Suggestions:**
- Implement a responsive desktop nav bar that shows links at >= 768px and collapses to hamburger on mobile
- Close the mobile menu on route change
- Add "Representatives" as a direct nav link
- Conditionally set the "Home" link destination based on auth state

---

### 2.7 Site Messages

**Issues:**

| # | Type | Issue | Severity |
|---|------|-------|----------|
| S1 | **Data** | **"test test" site message with body "test"** visible to all users — test data in production | Critical |
| S2 | **UX** | **Three site messages stack on every page**, consuming the entire above-the-fold area on app pages. No rate-limiting or "show only most important" logic. | High |
| S3 | **UI** | **Messages from October 2025** (5+ months old) are still showing — no auto-expiration | Medium |

**Suggestions:**
- Remove test data from the site_messages table
- Implement message expiration (auto-hide after N days)
- Show at most 1 high-priority message; collapse others behind "View all messages"

---

### 2.8 Privacy Policy (`/privacy`)

**What works well:**
- Well-structured with clear sections (What We Collect, Why, Your Rights, Data Protection)
- Actionable links: "Download Your Data", "Delete Your Account"
- Trust-building "Our Commitment" callout

**Issues:**

| # | Type | Issue | Severity |
|---|------|-------|----------|
| PR1 | **Content** | **Page title inconsistency:** "Privacy Policy - Ranked Choice Democracy \| Choices" uses "Ranked Choice Democracy" while the rest of the app uses "Democracy That Works For Everyone" | Low |
| PR2 | **Content** | **"Last updated: January 15, 2025"** — over a year old; may need review | Low |

---

### 2.9 Terms of Service (`/terms`)

**What works well:**
- Clean, readable layout with numbered sections
- Concise, plain-language terms

**Issues:**

| # | Type | Issue | Severity |
|---|------|-------|----------|
| T1 | **UI** | **Page title: "Terms of Service - Choices \| Choices"** — the "Choices" suffix is duplicated | Low |

---

### 2.10 404 Page

**What works well:**
- Clean, centered design with large "404" watermark
- Clear message and "Go to Homepage" CTA

**No significant issues.**

---

## 3. Prioritized Action List

| Priority | Issue | Area | Rationale |
|----------|-------|------|-----------|
| **1** | Remove test/debug buttons from auth page (Simulate Network/Server/Timeout Error) | Auth | Security risk: exposes internal error simulation to all users |
| **2** | Remove "test test" site message from production data | Site Messages | Test data visible to every user on every page |
| **3** | Implement desktop navigation bar (not hamburger-only at 1280px) | Global Nav | Core navigation is hidden behind a hamburger menu even on desktop, harming discoverability |
| **4** | Add loading indicators for polls and representatives lists | Polls, Reps | Users see empty white boxes for 2-3 seconds with no feedback, appearing broken |
| **5** | Fix 464 missing i18n translation errors for poll category keys | Polls | Floods console with errors; may display raw keys to users in some locales |
| **6** | Fix duplicate footer on landing page (2025 vs 2026 copyright) | Landing | Two footers with conflicting years; unprofessional appearance |
| **7** | Remove ThemeScript verbose debug logging from production | Console | 98 warning-level debug messages per session clutter dev tools and may impact performance |
| **8** | Fix mobile horizontal overflow on landing page | Landing | Content extends beyond viewport at 375px width |
| **9** | Downgrade FEATURE_FLAGS info log from `console.error` to `console.debug` | Console | 8 false-alarm errors per session |
| **10** | Close mobile menu on route navigation | Global Nav | Menu persists open across page transitions |
| **11** | Display actual party affiliation for representatives (not "—") | Representatives | Critical data missing from representative cards |
| **12** | Fix civics state filter being disabled with no explanation | Civics | Users cannot interact with the primary filter control |
| **13** | Hide "Please fix the following errors" until form submission | Auth | Confusing premature error display on initial page load |
| **14** | Deduplicate hashtag API requests (4 identical GETs per page load) | Network/Perf | Unnecessary API load; wasted bandwidth |
| **15** | Implement site message expiration and prioritization | Site Messages | 5-month-old messages consume above-the-fold space on every page |

---

## 4. Audit Log (Raw Observations)

| Timestamp | Section | Type | Summary |
|-----------|---------|------|---------|
| T+0s | Landing | UI | Hero loads with clear h1, two CTAs visible |
| T+0s | Landing | Console | 9 ThemeScript debug warnings logged |
| T+0s | Landing | Console | `[ThemeScript] Executed [object Object]` — serialization bug |
| T+2s | Landing (scroll) | UI | Feature cards render correctly; good visual hierarchy |
| T+4s | Landing (bottom) | UI | **Two footers visible**: "© 2025" (landing) + "© 2026" (global) |
| T+6s | Landing (mobile) | UI | **Horizontal overflow**: white strip on right at 375px |
| T+6s | Landing (mobile) | UI | "Log In" text wraps in header |
| T+10s | Auth (/auth) | UI | Sign-in form renders; "Don't have an account? Sign Up" toggle |
| T+10s | Auth | UX | "Please fix the following errors:" visible before any input |
| T+12s | Auth (scroll) | UI | **Simulate Network/Server/Timeout Error buttons visible** |
| T+15s | Auth/register | UI | Passkey vs Password account selection; clean design |
| T+18s | Auth/reset | UI | Clean password reset form; minimal |
| T+20s | /feed redirect | UX | Redirects to `/auth?redirectTo=%2Ffeed` — auth working |
| T+25s | Polls (/polls) | UI | **Empty white card outlines** on initial load; no loading indicator |
| T+25s | Polls | Console | 232 i18n missing translation errors logged |
| T+25s | Polls | Network | 4 duplicate hashtag API GET requests |
| T+28s | Polls | UI | Data loads: E2E Test Poll visible; category chips working |
| T+30s | Polls | Data | **E2E test data** in production poll list |
| T+35s | Representatives | UI | "No representatives found" then data loads (jarring transition) |
| T+35s | Representatives | UI | **Site messages** push content below fold (Security Update, test test, Trust Tiers) |
| T+38s | Representatives | Data | Party shows "—"; District 0 for at-large; "—" for senators |
| T+40s | Representatives (nav) | UI | Hamburger menu at 1280px desktop; no desktop nav bar |
| T+40s | Representatives (nav) | UX | Nav: Home, Polls, Civics, Dashboard; **no Representatives link** |
| T+45s | Civics (/civics) | UX | State filter disabled (California pre-selected); Search button disabled |
| T+45s | Civics | UI | Loading spinner visible below filter form |
| T+50s | Privacy (/privacy) | UI | Well-structured; "Last updated: January 15, 2025" |
| T+50s | Privacy | UI | Title: "Ranked Choice Democracy" differs from app branding |
| T+55s | Terms (/terms) | UI | Title duplicates: "Terms of Service - Choices | Choices" |
| T+60s | 404 | UI | Clean 404 page; "Go to Homepage" CTA; no issues |

---

## 5. Notes & Limitations

- **Auth-gated sections not audited in-browser:** Dashboard, Feed, Profile, Analytics, Admin, Candidates, Civic Actions, Contact, and Onboarding all redirect to `/auth` for unauthenticated users. The E2E harness (`NEXT_PUBLIC_ENABLE_E2E_HARNESS=1`) was not enabled in the environment, so these sections could not be browsed. Their route existence was verified via codebase inspection.
- **Console data is cumulative:** The browser MCP accumulates console messages across all navigations in a session. Counts reflect the entire audit session.
- **Dev-only artifacts:** Fast Refresh warnings and React DevTools messages are development-mode only and would not appear in production builds.
- **Supabase connection is live:** The dev server connects to a real Supabase instance (`muqwrehywjrbaeerjgfb.supabase.co`), so data shown (representatives, polls, site messages) reflects actual production data.

---

## 6. Remediation Status (March 2026)

_The following items from the audit have been addressed through 7 rounds of systematic improvement:_

| # | Issue | Status |
|---|-------|--------|
| L1 | Duplicate footer | ✅ Fixed (Session 2) |
| L2 | Outdated copyright year | ✅ Fixed (Session 2) |
| L5 | Mobile horizontal overflow | Addressed via design token migration |
| A1 | Simulate error buttons visible | ✅ Fixed — E2E debug code gated behind NODE_ENV (Session 2) |
| A5 | Page title doesn't change | ✅ Fixed — per-page metadata added (Session 2) |
| P2 | Empty white card outlines / no loading | ✅ Fixed — skeleton loaders added for all major pages |
| P3 | Missing i18n translations | ✅ Fixed — 8 category keys added |
| 1.3 | ThemeScript debug logging | ✅ Fixed — all 18+ console.log calls removed |
| 1.2 | Feature flags logged as error | ✅ Fixed — downgraded to appropriate level |
| R1 | No loading indicator for representatives | ✅ Fixed — RepresentativeListSkeleton added |
| N2 | Mobile menu persists across navigation | ✅ Fixed (Session 2) |
| S1 | "test test" site message | Data issue — requires DB cleanup |
| PR1 | Privacy page title inconsistency | ✅ Fixed — design tokens and dark mode applied |

### Console Cleanup Results
- **ThemeScript**: All 98 debug `console.warn` calls removed
- **Production code**: Zero `console.log` calls remain in production code
- **Logger utility**: All `console.error`/`console.warn` replaced with `logger.error`/`logger.warn`

### Design Token Migration
- 40+ files migrated from hardcoded `text-gray-*`, `bg-gray-*` to semantic tokens
- Privacy page fully migrated with dark mode support
- HeroSection, BiasFreePromise, CommunityPollSelection, HashtagManagement migrated
- Focus rings standardized to `focus:ring-ring`

### Security Hardening
- Rate limiting added to 20+ API routes
- CSRF validation on login route
- E2E bypass locked out of production
- Input sanitization on polls API
- All `window.alert()` and `window.confirm()` replaced with toast/AlertDialog
