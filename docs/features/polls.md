# Polls Feature

**Last Updated**: November 3, 2025  
**Status**: ✅ Operational  
**Location**: `/web/features/polls`

---

## Implementation

### Components (23 files)
- **Location**: `features/polls/components/`
- **Key Files**:
  - `PollCard.tsx` - Poll display card
  - `PollResults.tsx` - Results visualization
  - `VotingInterface.tsx` - Voting UI

### Pages
- `features/polls/pages/create/page.tsx` - Poll creation wizard (uses Zustand store)

### Hooks (1 file)
- `features/polls/hooks/usePollWizard.ts` - Bridge to Zustand store (migration complete)

### Store
- `lib/stores/pollWizardStore.ts` - Poll creation state (Zustand)
- `lib/stores/pollsStore.ts` - Poll data state

### Types
- `features/polls/types/index.ts` - Poll type definitions
- `types/poll.ts` - Core poll types

---

## Database

### Tables
- **polls** (59 columns)
  - `id`, `title`, `description`, `question`
  - `created_by`, `voting_method`, `status`
  - `allow_multiple_votes` (added Nov 2025)
  - `poll_settings` (JSONB), `options` (JSONB)
  - `end_date`, `end_time`, `category`, `hashtags`
  
- **poll_options** (7 columns)
  - `id`, `poll_id`, `text`, `vote_count`
  
- **votes** (12 columns)
  - `id`, `poll_id`, `user_id`, `option_id`
  - `trust_tier`, `vote_weight`
  
- **poll_participation_analytics** (20 columns, added Nov 2025)
  - `user_id`, `poll_id`, `trust_tier`, `trust_score`
  - Demographics: `age_group`, `geographic_region`, `education_level`
  - Verification: `biometric_verified`, `phone_verified`, `identity_verified`

---

## API Endpoints

### `POST /api/polls`
Create new poll
- Auth: Required
- Body: `{ title, description, question, options, voting_method, settings }`
- Returns: `{ pollId }`

### `GET /api/polls`
List polls
- Auth: Public
- Query: `?status=active&limit=20`
- Returns: `{ polls: [] }`

### `GET /api/polls/[id]`
Get poll details
- Auth: Public
- Returns: Poll with options and results

### `POST /api/polls/[id]/vote`
Submit vote
- Auth: Required
- Body: `{ optionIds: [] }`
- Validation: Checks `allow_multiple_votes`, poll end date
- Records: Vote + analytics

### `GET /api/polls/trending`
Get trending polls
- Auth: Public
- Returns: Polls sorted by `trending_score`

---

## Voting Methods

- **single**: One choice per user
- **approval**: Multiple choices allowed
- **ranked**: Rank choices in order
- **quadratic**: Credits-based voting
- **range**: Score each option (0-10)

**Implementation**: `features/voting/` handles voting logic

---

## Tests

**Location**: `features/polls/__tests__/` (if exists)  
**E2E**: Poll creation, voting flow

---

## Key Features

- Poll creation wizard (6 steps, Zustand state)
- Trust-weighted voting (T0-T3 tiers)
- Multiple voting methods
- Analytics tracking (participation, demographics)
- Hashtag integration
- Category filtering
- Allow multiple votes configuration

---

## Dependencies

- Zustand (state management)
- Poll wizard store migrated November 2025
- Old `usePollWizard` hooks archived

---

_Premier feature of the application_

