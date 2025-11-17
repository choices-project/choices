# Internationalization (i18n) Implementation Status

**Last Updated:** January 2025  
**Status:** Phase 1 & 2 Complete ✅ | ESLint Scope Expanded ✅ | Message Templates Localized ✅ | Candidate Flows Complete ✅

This document tracks the comprehensive internationalization effort across the Choices web application, ensuring all user-facing strings are translatable and properly extracted.

---

## Overview

The i18n system uses:
- **Library:** `next-intl` with custom `useI18n` hook
- **Extraction:** `@formatjs/cli` via `npm run i18n:extract`
- **Linting:** ESLint `formatjs/no-literal-string-in-jsx` rule
- **Message Catalogues:** `web/messages/en.json` and `web/messages/es.json`
- **Snapshot:** `web/messages/en.snapshot.json` (auto-generated)

---

## Phase 1: Core Civic Features ✅ COMPLETE

### Civics Components

#### ✅ Address Lookup & Navigation
- **`AddressLookupForm.tsx`** - Fully localized
  - Form labels, placeholders, privacy copy
  - Error states, status badges
  - CTA buttons and helper text
  - Namespace: `civics.addressLookup.*`
  
- **`CivicsNavigation.tsx`** - Fully localized
  - Header title/subtitle
  - Navigation links (representatives, update location)
  - Settings button aria-label
  - Address update modal (title, description, labels, placeholders, buttons)
  - Mobile menu (toggle labels, region label, location display, edit CTA)
  - Error messages
  - Namespace: `civics.navigation.*`

#### ✅ Representative Components
- **`RepresentativeCard.tsx`** - Fully localized
  - District labels, committee headings/items
  - "+N more" hints, website labels
  - Data quality badges
  - Follow/unfollow buttons (including loading states)
  - Contact CTA, error messaging
  - Namespace: `civics.representatives.card.*`

- **`RepresentativeList.tsx`** - Fully localized
  - Loading states, error messages
  - Empty state messages
  - Namespace: `civics.representatives.list.*`

- **`RepresentativeSearch.tsx`** - Fully localized
  - All labels, placeholders, button texts
  - Filter options (state names, party, office, level)
  - Namespace: `civics.representatives.search.*`

#### ✅ Civic Actions
- **`CivicActionCard.tsx`** - Fully localized
  - Action type/urgency badges
  - Draft label, signature progress
  - Metadata ("Ends ..."), inactive status warnings
  - CTA buttons
  - Namespace: `civics.actions.card.*`

- **`CivicActionList.tsx`** - Fully localized
  - Loading skeleton text
  - Error display (with translated retry CTA)
  - Empty state, creation CTA
  - "Load more" spinner/button
  - Namespace: `civics.actions.list.*`

- **`CreateCivicActionForm.tsx`** - Fully localized
  - All labels, helper text, placeholders
  - Validation errors, button states
  - Submission errors
  - Action types and urgency levels
  - Namespace: `civics.actions.create.*`

#### ✅ Election Countdown
- **`ElectionCountdownBadge.tsx`** - Fully localized
  - Default copy, countdown text
  - Dates with locale-aware formatting
  - Pluralization support
  - Namespace: `civics.countdown.badge.*`

- **`ElectionCountdownCard.tsx`** - Fully localized
  - Headings, descriptions, loaders
  - Errors, empty states
  - Remaining-count copy, dates
  - Pluralization and locale-aware formatting
  - Namespace: `civics.countdown.card.*`

- **`civicsCountdownUtils.ts`** - Fully localized
  - Election notification strings
  - Countdown labels ("Election today", "Election tomorrow", "Election in X days")
  - Fallback titles, notification messages
  - Namespace: `civics.countdown.notifications.*`

#### ✅ Engagement & Interaction
- **`EngagementMetrics.tsx`** - Fully localized
  - Action buttons (like, comment, share, bookmark)
  - Analytics labels (views, engagement rate)
  - Trending indicators
  - Last updated timestamps
  - Namespace: `civics.engagement.*`

- **`TouchInteractions.tsx`** - Fully localized
  - Surface labels (active/disabled)
  - Live announcements for touch lifecycle
  - Gesture events (tap, swipes, pinches, long-press)
  - Screen reader announcements via polite live region
  - Namespace: `civics.touchInteractions.*`

#### ✅ Supporting Components
- **`AttributionFooter.tsx`** - Fully localized
  - Headings, "last updated" copy
  - "+N more" badge
  - Namespace: `civics.attribution.*`

- **`CivicsLure.tsx`** - Fully localized
  - Header, location labels, stats
  - Candidate sections, engagement highlights
  - CTA buttons, social proof
  - Live region announcements
  - Namespace: `civics.lure.*`

- **`PrivacyStatusBadge.tsx`** - Fully localized
  - Feature-disabled, "checking" states
  - Health/error fallback messages
  - Namespace: `civics.privacy.*`

- **`ProgressiveDisclosure.tsx`** - Fully localized
  - Expand/collapse button aria-labels
  - Namespace: `common.progressiveDisclosure.*`

- **`VoterRegistrationCTA.tsx`** - Fully localized
  - Headings, timestamps, loader aria-labels
  - CTA buttons, section headers
  - Fallback messages
  - Namespace: `civics.registration.*`

### Contact Components

#### ✅ Contact Representatives
- **`ContactRepresentativesSection.tsx`** - Fully localized
  - Feature-disabled/auth-required cards
  - Header copy, election context
  - CTA buttons, thread list messaging
  - Namespace: `contact.representatives.*`

- **`ContactModal.tsx`** - Fully localized
  - Dialog states, elections context
  - Template tooling, validation errors
  - Success banners, footer actions
  - Namespace: `contact.modal.*`

- **`BulkContactModal.tsx`** - Fully localized
  - Dialog live announcements
  - Disabled-state copy, header/selection text
  - Election summaries, template tooling
  - Validation errors, success alerts
  - Footer/CTA labels
  - Namespace: `contact.bulkModal.*`

### Candidate Components

#### ✅ Candidate Profile
- **`app/(app)/candidates/[slug]/page.tsx`** - Fully localized
  - All user-facing strings
  - Status messages with typed `flashTone` state
  - "Suggest a correction" section:
    - Badge, dialog title/description
    - Issue types, details, contact email
    - Source fields, all buttons and messages
  - Namespace: `candidates.profile.*`

---

## Phase 2: Shared Components ✅ COMPLETE

### Global Navigation
- **`GlobalNavigation.tsx`** - Fully localized
  - ✅ Navigation links, auth buttons
  - ✅ Mobile menu toggle aria-label
  - ✅ All aria-labels translated

### Other Shared Components
- **`BurgerMenu.tsx`** - ✅ Fully localized
  - ✅ "Close menu" aria-label
  - ✅ Menu item labels (profile, settings, contribute)
  - ✅ Section titles (Menu, Contribute, Settings)
  - ✅ Contribution options (code, documentation, testing, community, sharing)
  - ✅ Settings items (privacy, notifications, account)
  - ✅ User fallback text
  - ✅ Namespace: `navigation.menu.*`

- **`ThemeSelector.tsx`** - ✅ Fully localized
  - ✅ "Select theme" aria-label
  - ✅ "Theme options" aria-label
  - ✅ "Theme" label
  - ✅ Theme change announcements
  - ✅ Namespace: `common.theme.*`

- **`DeviceList.tsx`** - ✅ Fully localized
  - ✅ "Device list" aria-label
  - ✅ "Your Devices" heading
  - ✅ "Add Device" button
  - ✅ Loading, error, and empty states
  - ✅ Namespace: `common.devices.*`

- **`SiteMessages.tsx`** - ✅ Fully localized
  - ✅ "Dismiss message" aria-label
  - ✅ Namespace: `common.messages.*`

---

## Message Catalogue Structure

### Current Namespaces

```
common.*
  - actions.* (cancel, retry)
  - placeholders.*
  - progressiveDisclosure.*

navigation.*
  - home, polls, dashboard, profile, settings, logout, login, register
  - languageSelector.live.*
  - mobileMenu.* (open, close, label, location, edit)

civics.*
  - addressLookup.*
  - navigation.*
  - representatives.* (card, list, search)
  - actions.* (card, list, create)
  - countdown.* (badge, card, notifications)
  - engagement.* (actions, analytics, trending, lastUpdated)
  - touchInteractions.*
  - attribution.*
  - lure.*
  - privacy.*
  - registration.*

contact.*
  - representatives.*
  - modal.*
  - bulkModal.*

candidates.*
  - profile.* (correction.*)
```

### Translation Coverage

- **English (`en.json`):** ~1,990 lines, comprehensive coverage
- **Spanish (`es.json`):** ~1,990 lines, comprehensive coverage
- **Snapshot (`en.snapshot.json`):** Auto-generated, kept in sync via CI

---

## Linting & CI Integration

### Current Setup

#### ESLint Configuration
- **Location:** `web/eslint.config.js`
- **Rule:** `formatjs/no-literal-string-in-jsx`
- **Scope:** 
  - `app/(app)/candidates/**/*.{ts,tsx}` - **ERROR**
  - `components/shared/**/*.{ts,tsx}` - **ERROR** ✅
  - `features/civics/**/*.{ts,tsx}` - **ERROR**
  - `features/contact/**/*.{ts,tsx}` - **ERROR** ✅
- **Status:** ✅ Enforced and passing

#### Locale Lint Script
- **Command:** `npm run lint:locale`
- **Location:** `web/package.json`
- **Scope:** Candidates, civics, contact, and shared components
- **Status:** ✅ Passing with zero violations

#### CI Integration
- **Workflow:** `.github/workflows/web-ci.yml`
- **Steps:**
  1. `npm run lint` (soft fail)
  2. `npm run lint:locale` (hard fail) ✅
  3. Contract tests
  4. `npm run i18n:extract` ✅
  5. Snapshot diff check ✅
- **Status:** ✅ Fully integrated

---

## Testing Status

### Unit Tests
- ✅ `AddressLookupForm.test.tsx` - Updated to mock `useI18n` with real catalogue data
- ✅ Tests use `data-testid` instead of hard-coded English strings

### Manual Testing
- ⚠️ Candidate flows - Needs explicit i18n testing
- ⚠️ Contact flows - Needs explicit i18n testing
- ⚠️ Civics flows - Needs explicit i18n testing

### Locale Switching
- ✅ `LanguageSelector` component functional
- ✅ Live region announcements work in both locales
- ⚠️ End-to-end locale switching tests needed

---

## Remaining Work

### High Priority (P1)

#### 1. Expand ESLint Scope ✅ COMPLETE
- [x] Add `features/contact/**/*.{ts,tsx}` to formatjs error block
- [x] Add `components/shared/**/*.{ts,tsx}` to formatjs error block
- [x] Update `lint:locale` script globs accordingly
- [ ] Add other feature directories as they reach parity (polls, feeds, profile, dashboard, onboarding)

#### 2. Shared Components Localization ✅ COMPLETE
- [x] `BurgerMenu.tsx` - Localize menu labels and aria-labels
- [x] `ThemeSelector.tsx` - Localize aria-labels
- [x] `DeviceList.tsx` - Localize headings and aria-labels
- [x] `SiteMessages.tsx` - Localize aria-labels
- [x] `GlobalNavigation.tsx` - Complete remaining aria-labels

#### 3. Message Templates ✅ COMPLETE
- [x] Localize template titles and descriptions in `lib/contact/message-templates.ts`
- [x] Localize placeholder labels
- [x] Created `template-localization.ts` utility for template localization
- [x] Updated `useMessageTemplates` hook to return localized templates
- [x] Added all template translations to message catalogues (6 templates, ~70 placeholder keys)
- [ ] Consider template body localization (complex - template bodies contain user-generated content placeholders, may require separate approach)

### Medium Priority (P2)

#### 4. Additional Feature Areas
- [ ] Polls components
- [ ] Feeds components
- [ ] Profile components
- [ ] Dashboard components
- [ ] Onboarding components

#### 5. Documentation
- [ ] Document i18n extraction process in detail
- [ ] Create developer guide for adding new translations
- [ ] Document locale switching behavior
- [ ] Document pluralization patterns

#### 6. Testing
- [ ] Add i18n-specific test utilities
- [ ] Create test fixtures for both locales
- [ ] Add E2E tests for locale switching
- [ ] Add visual regression tests for translated UI

### Low Priority (P3)

#### 7. Advanced Features
- [ ] Date/time formatting utilities (locale-aware)
- [ ] Number formatting utilities (locale-aware)
- [ ] Currency formatting (if needed)
- [ ] RTL language support (if needed)

---

## Best Practices

### Adding New Translations

1. **Use descriptive keys:**
   ```typescript
   // Good
   t('civics.actions.card.buttons.sign')
   
   // Avoid
   t('button1')
   ```

2. **Keep namespaces organized:**
   - Match component structure
   - Group related strings together
   - Use consistent naming patterns

3. **Always update both locales:**
   - `en.json` - English (source of truth)
   - `es.json` - Spanish translations
   - Keep keys in sync and alphabetized

4. **Use pluralization:**
   ```typescript
   t('civics.countdown.card.remaining', {
     count: additionalElections,
   })
   ```

5. **Run checks before committing:**
   ```bash
   npm run lint:locale
   npm run i18n:extract
   ```

### Common Patterns

#### Aria Labels
```typescript
<button
  aria-label={t('civics.engagement.actions.like')}
>
  <HeartIcon />
</button>
```

#### Error Messages
```typescript
const errorMessage = error instanceof Error
  ? error.message
  : t('civics.navigation.errors.fetchFailed');
```

#### Loading States
```typescript
{isLoading
  ? t('civics.countdown.badge.loading')
  : t('civics.countdown.badge.countdown.today')}
```

#### Live Region Announcements
```typescript
announce(
  t('civics.lure.live.locationUpdated', { location: locationLabel }),
  'polite'
);
```

---

## Metrics & Progress

### Component Coverage
- **Civics Components:** 15/15 (100%) ✅
- **Contact Components:** 3/3 (100%) ✅
- **Candidate Components:** 1/1 (100%) ✅
- **Shared Components:** 5/5 (100%) ✅

### String Coverage
- **Total Keys (en.json):** ~1,990
- **Keys with Spanish Translations:** ~1,990 (100%) ✅
- **Extracted to Snapshot:** 100% ✅

### Linting Coverage
- **Files Under Lint:** ~50+ files
- **Violations:** 0 ✅
- **CI Status:** Passing ✅

---

## Troubleshooting

### Common Issues

#### 1. Locale Lint Fails
```bash
# Check which files have violations
npm run lint:locale

# Fix by replacing literal strings with t() calls
# Then re-run to verify
npm run lint:locale
```

#### 2. Snapshot Out of Sync
```bash
# Regenerate snapshot
npm run i18n:extract

# Commit the updated snapshot
git add web/messages/en.snapshot.json
git commit -m "chore: update i18n snapshot"
```

#### 3. Missing Translation Key
```typescript
// If key doesn't exist, add to both en.json and es.json
// Then re-run extraction
npm run i18n:extract
```

#### 4. Pluralization Not Working
```typescript
// Ensure count parameter is passed
t('civics.countdown.card.remaining', { count: 5 })

// Check message format in en.json:
// "remaining": "+{count} {count, plural, one {additional election} other {additional elections}} tracked"
```

---

## Related Documentation

- **Workflow Guide:** `docs/INTERNATIONALIZATION.md` - Day-to-day i18n workflow
- **Roadmap:** `scratch/final_work_TODO/ROADMAP.md` - Section I.1 Internationalization
- **Testing:** `docs/TESTING.md` - Includes i18n testing utilities

---

## Changelog

### January 2025
- ✅ Completed Phase 1: All civics, contact, and candidate components localized
- ✅ Completed Phase 2: All shared components localized
  - ✅ `BurgerMenu.tsx` - Full menu system localization
  - ✅ `ThemeSelector.tsx` - Theme selection aria-labels
  - ✅ `DeviceList.tsx` - Device management UI
  - ✅ `SiteMessages.tsx` - Message dismissal
- ✅ Expanded ESLint scope to include shared components and contact features
  - ✅ Added `components/shared/**/*.{ts,tsx}` to formatjs error block
  - ✅ Added `features/contact/**/*.{ts,tsx}` to formatjs error block
  - ✅ Updated `lint:locale` script to cover all localized areas
- ✅ Message Templates Localization
  - ✅ Created `template-localization.ts` utility
  - ✅ Updated `useMessageTemplates` hook to return localized templates
  - ✅ Localized all 6 template titles, descriptions, and placeholder labels/examples
  - ✅ Added ~70 translation keys for template metadata
  - ✅ Updated validation to use localized labels
- ✅ Candidate Flow Strings Complete
  - ✅ Candidate profile page fully localized
  - ✅ All user-facing strings extracted and translated
  - ✅ Status messages and "Suggest a correction" section localized
- ✅ Added mobile menu localization to `CivicsNavigation`
- ✅ Localized election notification strings in `civicsCountdownUtils`
- ✅ All locale lint checks passing
- ✅ CI integration complete
- ✅ Roadmap updated to reflect completed tasks

### December 2024
- ✅ Initial i18n extraction tooling setup
- ✅ ESLint formatjs rule configuration
- ✅ Base message catalogues created
- ✅ `useI18n` hook implementation

---

**Next Review:** After Phase 2 completion (shared components)

