# Voting Feature

**Last Updated**: November 3, 2025  
**Status**: ✅ Operational  
**Location**: `/web/features/voting`

---

## Implementation

### Components (8 files)
- `features/voting/components/VotingInterface.tsx` (231 lines) - Main voting UI
- Various voting method components

### Actions
- `shared/actions/vote.ts` - Server action for voting
  - Validates poll end date
  - Checks `allow_multiple_votes` column (Nov 2025 migration)
  - Prevents duplicate votes
  - Records vote + analytics

### Store
- Part of `lib/stores/pollsStore.ts`

---

## Database

### Tables
- **votes** (12 columns)
  - `id`, `poll_id`, `user_id`, `option_id`
  - `trust_tier`, `vote_weight`
  - `vote_status`, `voter_session`
  
- **trust_weighted_votes** (9 columns)
  - Trust-weighted vote calculations
  - `trust_tier`, `trust_weight`, `weighted_vote`

---

## API Endpoints

### `POST /api/polls/[id]/vote`
Submit vote
- Auth: Required
- Validation:
  - Poll not ended
  - User hasn't voted (unless allow_multiple_votes)
  - Valid option IDs
- Records: Vote + poll_participation_analytics

### `POST /api/vote`
Alternative voting endpoint

---

## Voting Logic

### Duplicate Vote Prevention
**File**: `shared/actions/vote.ts:60-72`
```typescript
if (!poll.allow_multiple_votes) {
  // Check for existing vote
  // Reject if found
}
```

### Trust Weighting
- T0: Weight 1.0
- T1: Weight 1.5
- T2: Weight 2.0
- T3: Weight 3.0

**RPC**: `calculate_trust_weighted_votes(p_poll_id)`

---

## Voting Methods

Implemented in `features/voting/`:
- Single choice
- Approval voting
- Ranked choice
- Quadratic voting
- Range voting

---

_Core voting system with trust weighting_

