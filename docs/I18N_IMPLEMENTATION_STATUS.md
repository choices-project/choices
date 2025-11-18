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

## Extraction & Snapshot Workflow

1. **Local extraction:**  
   Run `npm run i18n:extract` from `web/` to execute the FormatJS CLI (wrapped by our timeout helper). The command scans `app/**`, `components/**`, `features/**`, and `lib/**` for `t()` usage and rewrites `messages/en.snapshot.json`.

2. **Snapshot diffs are required:**  
   Commit the updated `messages/en.snapshot.json` alongside any new keys in `messages/en.json` / `messages/es.json`. The snapshot is intentionally verbose so reviewers can confirm namespace changes without re-running extraction.

3. **CI enforcement:**  
   The **Web CI (Secure)** workflow now runs `npm run i18n:extract` in the “Verify i18n snapshot” step and fails the job if `messages/en.snapshot.json` is stale. This guarantees every PR keeps the snapshot synchronized and prevents missing keys from reaching main.

4. **Developer checklist:**  
   Before opening a PR, run `npm run i18n:extract`, review the snapshot diff, and ensure translations exist in both `en.json` and `es.json`. The updated snapshot makes it obvious when keys were added but not translated.

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

## Phase 3: Polls Features ✅ COMPLETE

### Polls Components

#### ✅ Poll Creation
- **`CreatePollForm.tsx`** - Fully localized
  - Form title, close button aria-label
  - Field labels, placeholders, counters
  - Action buttons (create, cancel, creating)
  - Namespace: `polls.create.form.*`

- **`CreatePollPage.tsx`** - Fully localized
  - Wizard steps (details, options, audience, review)
  - Privacy and voting method labels
  - Notifications (tooManyTags, signInRequired, accessDenied, rateLimit, validationErrors, creationFailed, pollCreated)
  - Share dialog (title, description, poll metadata, link copy, social share, milestone alerts)
  - Page header, error summary, footer navigation
  - Namespace: `polls.create.*`

- **`AccessiblePollWizard.tsx`** - Fully localized
  - Boolean setting labels (allowMultipleVotes, allowAnonymousVotes, showResults, allowComments, requireAuthentication, preventDuplicateVotes)
  - Namespace: `polls.create.wizard.audience.settings.*`

#### ✅ Poll Viewing & Interaction
- **`PollClient.tsx`** - Fully localized
  - Breadcrumbs, privacy/voting method labels
  - Error messages, poll option fallback text
  - Voting status messages (closed, notOpen, signInRequired, votingRestricted)
  - Notifications (voteRecorded, voteFailed, linkCopied, copyFailed)
  - Buttons (share, analytics, printSummary, vote, voting, voted)
  - Loading message, leading option section
  - Stats cards (totalVotes, participation, status)
  - Milestone alerts section
  - Poll creation date
  - Namespace: `polls.view.*`

- **`OptimizedPollResults.tsx`** - Fully localized
  - Status labels (ended, active, ongoing)
  - Error messages (title, retry)
  - Empty state, performance metrics
  - Privacy protection (kAnonymity, budget)
  - Voting status (canVote, cannotVote, hasVoted, notVoted)
  - Results summary and refreshing announcements
  - Namespace: `polls.results.*`

- **`PollCard.tsx`** - Fully localized
  - Untitled poll fallback, unknown creator
  - Created by/on/ends on dates
  - Options heading, option items, more options
  - Votes and participation counts
  - Voting method labels, status labels
  - Action buttons (view, vote)
  - Namespace: `polls.card.*`

#### ✅ Poll Management
- **`PostCloseBanner.tsx`** - Fully localized
  - Status info (closed, locked, post-close) with titles, descriptions, badges
  - Baseline established, locked at dates
  - Post-close voting available message
  - Management action buttons (enablePostClose, lockPoll)
  - Namespace: `polls.postCloseBanner.*`

- **`PollShare.tsx`** - Fully localized
  - Title, default title, native share text
  - Direct link label and copy button states
  - Social media platform names (Twitter, Facebook, LinkedIn, Email)
  - QR Code section (title, show/hide, alt text, generating, scan hint, download/copy)
  - Embed Poll section (title, code label, copy embed code)
  - Email share body
  - Namespace: `polls.share.*`

#### ✅ Poll Discovery & Filtering
- **`PollsPage.tsx`** - Fully localized
  - Page title and subtitle
  - Breadcrumbs (home, dashboard, polls)
  - Empty states (title, filters, ctaMessage)
  - CTAs (create, view, results)
  - Metadata (votes)
  - Pagination (showing, pageLabel, previous, next)
  - Namespace: `polls.page.*`

- **`PollFiltersPanel.tsx`** - Fully localized
  - Search placeholder and aria-label
  - Hashtags (label, addPlaceholder, addAria, remove)
  - Status filters (all, active, closed, trending)
  - Trending section (heading, headingWithCount, count)
  - Categories label
  - Namespace: `polls.filters.*`

#### ✅ Poll Templates
- **`PollTemplatesPage.tsx`** - Fully localized
  - Title and subtitle
  - Search placeholder
  - Categories (all, allTemplates)
  - Sort options (popular, recent, rating, name)
  - Difficulty labels (beginner, intermediate, advanced)
  - Metadata (estimatedTime, usageCount)
  - Results count, actions (use, preview)
  - Empty state (title, message, clearFilters)
  - Namespace: `polls.templates.*`

#### ✅ Community Poll Selection
- **`CommunityPollSelection.tsx`** - Fully localized
  - Title and subtitle
  - Week selection (select, current, last, twoWeeksAgo, threeWeeksAgo)
  - Tabs (trending, selected, analytics)
  - Selection criteria (title, engagement.*, platform.*)
  - Trending suggestions (title, suggestedBy, votes, cost, engagement)
  - Actions (vote, approve)
  - Selected polls (weekOf, totalVotes, criteria.title, polls.*)
  - Analytics (totalSuggestions, currentlyPublished, communityVotes, acrossFeatured, featuredPolls, thisWeek, categoryBreakdown)
  - Namespace: `polls.community.*`

---

## Phase 4: Feeds Experience ♻️ IN PROGRESS

### Feeds Components

#### ✅ Hashtag-Polls Feed
- **`HashtagPollsFeed.tsx`** - Fully localized
  - Date helpers (unknown, invalid, relative hours/yesterday)
  - Header and metrics (title, subtitle, feed score, poll count)
  - Filters (selected badge copy, trending label, sort controls)
  - Tabs (recommended, trending, analytics)
  - Recommended view (votes, match percent, empty states, CTA copy)
  - Trending/analytics panels (rank labels, select instructions, percentage helpers)
  - Error + empty states (retry, empty title)
  - Namespace: `feeds.hashtagPolls.*`

#### ✅ Unified Feed Core
- **`FeedCore.tsx`** - Fully localized
  - Error + retry state
  - Pull-to-refresh announcements
  - Header controls (title, refresh button, theme toggle aria labels)
  - Filters (district helper text, hashtag input placeholder/aria, trending heading, remove-tag aria)
  - Tabs (feed, polls, analytics) with empty-state copy
  - Item actions (bookmark/share labels)
  - Status summary ("Online", "{count} items")
  - Namespace: `feeds.core.*`

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

polls.*
  - create.* (form.*, privacy.*, votingMethod.*, notifications.*, share.*, wizard.*, page.*)
  - view.* (privacy.*, votingMethod.*, breadcrumbs.*, errors.*, status.*, options.*, notifications.*, buttons.*, loading.*, leadingOption.*, stats.*, milestones.*, created)
  - postCloseBanner.* (status.*, baselineEstablished, lockedAt, postCloseAvailable, buttons.*)
  - share.* (title, defaultTitle, nativeShareText, nativeShare, directLink.*, copy, copied, social.*, emailBody, qrCode.*, embed.*)
  - results.* (heading, refreshing, summary, status.*, error.*, empty, type, totalVotes, uniqueVoters, performance.*, privacy.*, votingStatus.*)
  - card.* (untitled, unknownCreator, createdBy, createdOn, endsOn, optionsHeading, optionItem, moreOptions, votes, participation, votingMethod.*, status.*, actions.*)
  - page.* (title, subtitle, breadcrumbs.*, empty.*, cta.*, metadata.*, pagination.*)
  - filters.* (search.*, hashtags.*, status.*, trending.*, categories.*)
  - templates.* (title, subtitle, search.*, categories.*, sort.*, difficulty.*, metadata.*, resultsCount, actions.*, empty.*)
  - community.* (title, subtitle, week.*, tabs.*, selection.*, trending.*, suggestion.*, actions.*, selected.*, analytics.*)
feeds.*
  - hashtagPolls.* (header, metrics, filters, tabs, analytics, error, empty, date)
  - core.* (header, themeToggle, filters, tabs, empty, actions, status, pullToRefresh)
```

### Translation Coverage

- **English (`en.json`):** ~2,420 lines, comprehensive coverage
- **Spanish (`es.json`):** ~2,420 lines, comprehensive coverage
- **Snapshot (`en.snapshot.json`):** Auto-generated, kept in sync via CI

---

## Linting & CI Integration

### Current Setup

#### ESLint Configuration
- **Location:** `web/eslint.config.js`
- **Rule:** `formatjs/no-literal-string-in-jsx`
- **Scope:** 
  - `app/(app)/candidates/**/*.{ts,tsx}` - **ERROR**
  - `components/shared/**/*.{ts,tsx}` - **ERROR**
  - `features/civics/**/*.{ts,tsx}` - **ERROR**
  - `features/contact/**/*.{ts,tsx}` - **ERROR**
  - `features/onboarding/**/*.{ts,tsx}` - **ERROR**
  - `features/polls/**/*.{ts,tsx}` - **ERROR**
  - `features/feeds/**/*.{ts,tsx}` - **ERROR**
- **Status:** ✅ Enforced and passing

#### Locale Lint Script
- **Command:** `npm run lint:locale`
- **Location:** `web/package.json`
- **Scope:** Candidates, shared components, civics, contact, polls, onboarding, feeds
- **CI:** Runs as a blocking step in **Web CI (Secure)**
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
- [x] Add `features/polls/**/*.{ts,tsx}` and `features/onboarding/**/*.{ts,tsx}` to the enforcement list
- [ ] Add remaining feature directories as they reach parity (feeds, profile, dashboard)

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
- [x] Polls components (Phase 3 complete)
- [x] Onboarding components (Profile/Auth/Values/Complete/Interests)
- [ ] Feeds components (HashtagPollsFeed + Unified Feed Core localized; enhancers/providers pending)
- [ ] Profile components
- [ ] Dashboard components

#### 5. Documentation
- [x] Document i18n extraction process in detail
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
- **Polls Components:** 13/13 (100%) ✅

### String Coverage
- **Total Keys (en.json):** ~2,420
- **Keys with Spanish Translations:** ~2,420 (100%) ✅
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
- ✅ Completed Phase 3: All polls components localized
  - ✅ `CreatePollForm.tsx` - Form fields, labels, placeholders, buttons
  - ✅ `CreatePollPage.tsx` - Wizard steps, notifications, share dialog (~150 keys)
  - ✅ `PollClient.tsx` - Viewing, voting, status messages, milestones (~80 keys)
  - ✅ `PostCloseBanner.tsx` - Status messages, dates, management buttons (~15 keys)
  - ✅ `PollShare.tsx` - Sharing UI, QR code, embed options, social platforms (~25 keys)
  - ✅ `OptimizedPollResults.tsx` - Results display, performance metrics, privacy status (~30 keys)
  - ✅ `PollCard.tsx` - Card display, status labels, voting methods, actions (~20 keys)
  - ✅ `PollsPage.tsx` - Breadcrumbs, empty states, pagination, CTAs (~15 keys)
  - ✅ `PollFiltersPanel.tsx` - Search, hashtags, status filters, categories
  - ✅ `PollTemplatesPage.tsx` - Templates browsing, search, filters, sorting (~25 keys)
  - ✅ `CommunityPollSelection.tsx` - Community selection UI, analytics, trending (~40 keys)
  - ✅ `AccessiblePollWizard.tsx` - Boolean setting labels localization
  - ✅ Poll create route page - Breadcrumbs localization
  - ✅ Added ~430+ translation keys for polls feature
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

