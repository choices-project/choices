# Voting Integrity Policy

**Project**: Choices Platform  
**Date**: November 5, 2025  
**Status**: ✅ Enforced  
**Principle**: Open-source, bias-free, democratic

---

## 🗳️ Core Principle

### A Vote Is A Vote. Period.

**Every vote counts equally in poll results. NO EXCEPTIONS.**

- 1 person = 1 vote
- ALL votes are counted exactly as cast
- NO vote weighting in results
- NO vote multipliers
- NO vote adjustments
- NO vote "quality" factors

**This is non-negotiable. The platform is open-source and bias-free.**

---

## ✅ What's Allowed

### Poll Results (Actual Vote Counts)
- ✅ Count every vote as exactly 1
- ✅ Show total vote counts
- ✅ Show vote percentages
- ✅ Display results as voted
- ✅ Allow filtering by time period
- ✅ Allow anonymous voting (still counts as 1)

### Advanced Analytics (AFTER voting, SEPARATE from results)
- ✅ **Segment by trust tier** (for comparison, not weighting)
  - Show: "T0 users voted 500-200-100"
  - Show: "T3 users voted 300-400-50"
  - Purpose: Identify potential bot patterns
  - **Does NOT change the official poll result**

- ✅ **Bot detection analytics**
  - Flag suspicious voting patterns
  - Show admins potential bot activity
  - Compare behavior across trust tiers
  - **Does NOT remove or reweight votes**

- ✅ **Engagement scoring** (for display ranking ONLY)
  - Rank polls in analytics dashboard
  - Show which polls are "hot"
  - **Does NOT affect poll results**

---

## ❌ What's Forbidden

### NEVER in Poll Results
- ❌ Weight votes by trust tier
- ❌ Give some votes more value than others
- ❌ Discount potential bot votes
- ❌ Apply multipliers or coefficients
- ❌ Filter out votes from results (except user opt-out for privacy)
- ❌ Hide votes from any user group
- ❌ Adjust totals based on user characteristics

### NEVER in Vote Counting
- ❌ `vote_count * trust_multiplier`
- ❌ `IF trust_tier > 2 THEN count ELSE discount`
- ❌ Weighted averages in results
- ❌ Quality-adjusted tallies
- ❌ Credibility factors

---

## 📋 Implementation Rules

### Rule 1: Poll Results = Unweighted COUNT()
```sql
-- ✅ CORRECT: Simple count
SELECT COUNT(*) FROM votes WHERE poll_id = $1;

-- ❌ WRONG: Weighted count
SELECT SUM(CASE WHEN trust_tier >= 2 THEN 1.0 ELSE 0.5 END) FROM votes;
```

### Rule 2: Display Results As-Is
```typescript
// ✅ CORRECT: Show exact counts
const results = {
  option_a: 500,  // Exactly 500 votes
  option_b: 300,  // Exactly 300 votes
  total: 800      // Exactly 800 total
};

// ❌ WRONG: Adjusted counts
const results = {
  option_a: 500 * 0.9,  // NEVER!
  option_b: 300 * 1.1   // NEVER!
};
```

### Rule 3: Analytics Are Separate
```typescript
// ✅ CORRECT: Analyze votes separately from results
const pollResults = {
  official_results: { a: 500, b: 300 },  // Unweighted, official
  analytics: {
    by_trust_tier: {
      T0: { a: 200, b: 100 },  // Segmented for analysis
      T3: { a: 300, b: 200 }   // NOT affecting official results
    },
    bot_likelihood: {
      T0: 35,  // 35% might be bots - ANALYTICS ONLY
      T3: 2    // 2% might be bots - ANALYTICS ONLY
    }
  }
};

// The official result is STILL 500-300, regardless of analytics
```

---

## 🔍 Current Code Audit Results

### ✅ Verified Clean (No Vote Weighting)

1. **`/api/polls/[id]/vote/route.ts`** ✅
   - Votes inserted as-is
   - No weighting applied
   - Each vote stored once

2. **`/api/polls/[id]/results/route.ts`** ✅
   - Uses `get_poll_results_by_trust_tier` RPC
   - **Filters by tier** (for analytics comparison)
   - **Does NOT weight votes**
   - Returns simple COUNT per option

3. **`/api/analytics/poll-heatmap/route.ts`** ✅
   - Uses "engagement score" for DISPLAY RANKING ONLY
   - Does NOT affect poll results
   - Clearly documented as analytics-only

### 🚨 Functions to Monitor (Exist but NOT Used)

1. **`calculate_trust_weighted_votes`** - Database function
   - **Status**: Defined in schema but **NEVER CALLED** in code ✅
   - **Action**: Document as "DO NOT USE" or remove entirely
   - **Risk**: Future developer might use it incorrectly

---

## 📜 Policy for Future Development

### Before Implementing ANY Vote-Related Feature

**ASK THESE QUESTIONS**:

1. ❓ Does this change how votes are counted?
   - If YES → **REJECT** (unless it's a bug fix for 1:1 counting)

2. ❓ Does this apply different math to different votes?
   - If YES → **REJECT** (votes must be equal)

3. ❓ Does this affect poll results?
   - If YES → Ensure it's 1:1 counting only

4. ❓ Is this analytics AFTER voting?
   - If YES → OK, but must be clearly separated from official results

### Code Review Checklist

When reviewing ANY voting code:
- [ ] Votes counted as 1:1?
- [ ] No multipliers or weights in results?
- [ ] Analytics clearly separated from official results?
- [ ] Comments explain this is analytics-only (if applicable)?
- [ ] No coefficients or adjustments to vote counts?

---

## 🎓 Why This Matters

### Open-Source Principles
1. **Transparency**: Anyone can audit the code
2. **Trust**: Users must trust vote counts are accurate
3. **Democracy**: Every voice counts equally
4. **Integrity**: Results reflect actual votes, not adjusted calculations

### Legal/Ethical
1. **Accuracy**: Reported results must match actual votes
2. **Fairness**: No bias for or against any group
3. **Honesty**: What users see is what was voted
4. **Accountability**: Open to public scrutiny

---

## ✅ Current Status

**Vote Counting**: ✅ Clean - All votes count as 1:1  
**Poll Results**: ✅ Clean - Exact counts displayed  
**Analytics**: ✅ Properly separated from results  
**Documentation**: ✅ Policy established

**Unused Risky Functions**:
- `calculate_trust_weighted_votes` - EXISTS but NOT USED ✅

**Recommendation**: Document or remove unused weighted vote function to prevent future misuse.

---

## 📞 Questions for Clarification

### Current Implementation

**Q: Is the engagement score in poll-heatmap acceptable?**
- Purpose: Ranks polls in admin analytics (which to show first)
- Does NOT affect poll results
- Just helps admins see "hot" polls
- **Answer**: ?

**Q: Should trust tier analytics be separate views?**
- Show "All Votes: 500-300" (official result)
- Show "T0 votes: 200-100" (analytics)
- Show "T3 votes: 300-200" (analytics)
- Official result is still 500-300
- **Answer**: User confirmed YES ✅

**Q: Should I remove `calculate_trust_weighted_votes` entirely?**
- It's defined but never used
- Could be misused by future developers
- **Answer**: ✅ YES - Migration executed successfully (November 5, 2025)
- **Status**: Function permanently removed from database

---

**Last Updated**: November 5, 2025  
**Status**: Policy established, awaiting final clarification on edge cases

