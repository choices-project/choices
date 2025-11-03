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
- **votes** (11 columns)
  - `id`, `poll_id`, `user_id`, `option_id`
  - `trust_tier` (for analytics filtering only)
  - `vote_status`, `voter_session`
  - **No vote_weight column** - all votes equal

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

### Trust Tier Analytics (Not Weighting)
**All votes count equally** - no weighting applied to actual results.

**Analytics Only**: Trust tiers are recorded for post-hoc analysis:
- Filter votes by tier range (e.g., T2-T3 only)
- Compare T0-T1 vs T2-T3 to detect bot campaigns
- Identify propaganda by divergence between tiers

**RPC**: `get_poll_votes_by_trust_tier(poll_id, min_tier, max_tier)`

**Example**: Compare unverified (T0-T1) vs verified (T2-T3) vote patterns to detect coordinated manipulation.

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

