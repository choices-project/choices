# Trust Tier Design Philosophy

**Last Updated**: November 4, 2025  
**Status**: Design Principle

---

## Core Principle: Equal Votes, Filtered Analytics

### The Problem
Disinformation campaigns use bots and fake accounts to manipulate poll results, creating false narratives about public opinion.

### Our Solution
**All votes count equally** - but we can filter results by trust tier for analytics to detect manipulation.

---

## Implementation

### Trust Tiers (T0-T3)
- **T0**: Email only (no verification)
- **T1**: Phone verified
- **T2**: Biometric verified (WebAuthn)
- **T3**: Identity verified

### Vote Recording
Every vote is stored with:
- `poll_id`, `user_id`, `option_id`
- `trust_tier` (T0-T3) - **for analytics only**
- **No weighting applied**

---

## Analytics Capabilities

### Filter by Trust Tier Range
```sql
-- Example: Get votes from verified users only (T2-T3)
SELECT * FROM get_poll_votes_by_trust_tier(
  poll_id := 'abc-123',
  min_trust_tier := 2,
  max_trust_tier := 3
);
```

### Compare Across Tiers
```sql
-- Compare unverified (T0-T1) vs verified (T2-T3)
-- Large divergence suggests bot campaign
```

### Bot Detection
If T0-T1 votes heavily favor Option A, but T2-T3 votes favor Option B:
- **Hypothesis**: Option A is being pushed by bots/propaganda
- **Reality**: Verified humans prefer Option B

---

## Why This Works

1. **Democratic**: No vote discrimination - everyone's voice counts
2. **Not Ableist**: Doesn't penalize people who can't complete certain verifications
3. **Analytical**: Can still identify coordinated manipulation
4. **Flexible**: Filter by any combination of tiers, not locked to specific verification methods
5. **Research-Backed**: Used in academic studies to detect inauthentic behavior

---

## What We Removed (Nov 2025)

### Removed Infrastructure
- ❌ `trust_weighted_votes` table
- ❌ `calculate_trust_weighted_votes()` RPC function
- ❌ `votes.vote_weight` column

### Reason
These could be misused to weight votes, which is discriminatory and against our principles.

---

## Migration Applied

**File**: `supabase/migrations/20251104_remove_trust_weighting.sql`
- Dropped trust-weighting infrastructure
- Added `get_poll_votes_by_trust_tier()` RPC for analytics
- Indexed `votes(poll_id, trust_tier, option_id)` for performance

---

_Design ensures democratic voting while enabling sophisticated bot detection_

