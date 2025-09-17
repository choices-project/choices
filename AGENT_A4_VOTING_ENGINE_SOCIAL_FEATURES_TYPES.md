# Agent A4: Voting Engine & Social Features Types

**Created**: 2025-09-16  
**Scope**: Fix TypeScript `any` types in voting and social modules  
**Files**: 15 files, ~100 errors  
**Estimated Time**: 6-7 hours

## Target Files & Error Counts

### High Priority (Critical Errors)
1. **`lib/social/candidate-tools.ts`** - 1+ `any` type + 20+ unused vars + anonymous export
2. **`lib/social/social-discovery.ts`** - 6+ `any` types + 15+ unused vars + anonymous export
3. **`lib/social/network-effects.ts`** - 2+ `any` types + 10+ unused vars + anonymous export
4. **`lib/vote/finalize.ts`** - 10+ `any` types + unused vars

### Medium Priority
5. **`lib/vote/strategies/ranked.ts`** - 1+ `any` type + prefer-const errors
6. **`lib/vote/irv-calculator.ts`** - require() import + unused vars + prefer-const
7. **`lib/vote/processor.ts`** - 2+ `any` types + unused imports
8. **`lib/vote/validator.ts`** - 1+ `any` type + unused vars
9. **`lib/vote/types.ts`** - 8+ `any` types
10. **`lib/social/viral-detection.ts`** - 8+ `any` types + unused vars

### Lower Priority
11. **`lib/vote/engine.ts`** - 1+ `any` type
12. **`lib/vote/engine.test.ts`** - 1+ `any` type
13. **`lib/vote/strategies/approval.ts`** - 1+ `any` type
14. **`lib/vote/strategies/quadratic.ts`** - 1+ `any` type
15. **`lib/vote/strategies/range.ts`** - 1+ `any` type

## Detailed Error Analysis

### `lib/social/candidate-tools.ts` (1+ any + 20+ unused vars)
```typescript
// Lines with `any` types:
747:92  Error: Unexpected any. Specify a different type.

// Unused vars (many):
506:39  Warning: 'candidateId' is defined but never used.
511:37  Warning: 'candidateId' is defined but never used.
516:46  Warning: 'candidateId' is defined but never used.
525:45  Warning: 'candidateId' is defined but never used.
540:48  Warning: 'candidateId' is defined but never used.
550:47  Warning: 'candidateId' is defined but never used.
559:45  Warning: 'candidateId' is defined but never used.
569:42  Warning: 'candidateId' is defined but never used.
589:41  Warning: 'candidateId' is defined but never used.
594:42  Warning: 'candidateId' is defined but never used.
599:45  Warning: 'candidateId' is defined but never used.
604:39  Warning: 'candidateId' is defined but never used.
609:48  Warning: 'candidateId' is defined but never used.
618:47  Warning: 'candidateId' is defined but never used.
635:37  Warning: 'candidateId' is defined but never used.
760:47  Warning: 'websiteUrl' is defined but never used.
760:67  Warning: 'candidateId' is defined but never used.
769:37  Warning: 'candidateId' is defined but never used.

// Anonymous export:
779:1  Warning: Assign object to a variable before exporting as module default
```

**Key Tasks**:
1. Fix anonymous default export
2. Type candidate tool functions
3. Fix unused variable warnings by prefixing with `_`
4. Create proper candidate data types

### `lib/social/social-discovery.ts` (6+ any + 15+ unused vars)
```typescript
// Lines with `any` types:
97:29  Error: Unexpected any. Specify a different type.
246:57 Error: Unexpected any. Specify a different type.
257:71 Error: Unexpected any. Specify a different type.
276:68 Error: Unexpected any. Specify a different type.
286:93 Error: Unexpected any. Specify a different type.
658:83 Error: Unexpected any. Specify a different type.

// Unused vars (many):
242:41  Warning: 'userId' is defined but never used.
257:46  Warning: 'pollId' is defined but never used.
276:43  Warning: 'userId' is defined but never used.
286:46  Warning: 'connectionId' is defined but never used.
286:68  Warning: 'pollId' is defined but never used.
// ... and many more

// Anonymous export:
773:1  Warning: Assign object to a variable before exporting as module default
```

**Key Tasks**:
1. Fix anonymous default export
2. Type social discovery algorithms
3. Fix unused variable warnings
4. Create proper social network types

### `lib/social/network-effects.ts` (2+ any + 10+ unused vars)
```typescript
// Lines with `any` types:
370:57 Error: Unexpected any. Specify a different type.
606:57 Error: Unexpected any. Specify a different type.

// Unused vars (many):
196:13  Warning: 'poll' is assigned a value but never used.
374:46  Warning: 'pollId' is defined but never used.
489:48  Warning: 'userId' is defined but never used.
489:64  Warning: 'sessionId' is defined but never used.
494:50  Warning: 'userId' is defined but never used.
494:66  Warning: 'candidateId' is defined but never used.
494:87  Warning: 'date' is defined but never used.
499:46  Warning: 'userId' is defined but never used.
499:62  Warning: 'since' is defined but never used.
504:50  Warning: 'userId' is defined but never used.
504:66  Warning: 'sessionId' is defined but never used.
554:21 Error: Unexpected any. Specify a different type.
588:5  Warning: 'currentRanking' is defined but never used.
589:5  Warning: 'newCandidateId' is defined but never used.
590:5  Warning: 'insights' is defined but never used.
618:46  Warning: 'pollId' is defined but never used.

// Anonymous export:
737:1  Warning: Assign object to a variable before exporting as module default
```

**Key Tasks**:
1. Fix anonymous default export
2. Type network effects algorithms
3. Fix unused variable warnings
4. Create proper social influence types

### `lib/vote/finalize.ts` (10+ any types)
```typescript
// Lines with `any` types:
54:12  Error: Unexpected any. Specify a different type.
87:27  Error: Unexpected any. Specify a different type.
89:31  Error: Unexpected any. Specify a different type.
246:30 Error: Unexpected any. Specify a different type.
277:30 Error: Unexpected any. Specify a different type.
295:77 Error: Unexpected any. Specify a different type.
326:57 Error: Unexpected any. Specify a different type.
357:14 Error: Unexpected any. Specify a different type.
556:49 Error: Unexpected any. Specify a different type.
563:49 Error: Unexpected any. Specify a different type.

// Unused vars:
125:13 Warning: 'ballotCommitments' is assigned a value but never used.
```

**Key Tasks**:
1. Define vote finalization result types
2. Type ballot commitment and verification data
3. Create proper election result types
4. Fix unused variable warnings

## Implementation Strategy

### 1. Create Voting Engine Type Definitions
Create `lib/vote/types.ts`:
```typescript
// Voting Strategy Types
export interface VotingStrategy {
  name: string;
  type: 'single-choice' | 'ranked' | 'approval' | 'range' | 'quadratic';
  config: VotingConfig;
}

export interface VotingConfig {
  allowAbstention: boolean;
  maxSelections: number;
  minSelections: number;
  allowWriteIns: boolean;
  requireAllRanks: boolean;
}

// Ballot Types
export interface Ballot {
  id: string;
  pollId: string;
  userId: string;
  selections: BallotSelection[];
  timestamp: Date;
  signature: string;
  commitment: string;
}

export interface BallotSelection {
  candidateId: string;
  rank: number;
  score: number;
  isWriteIn: boolean;
  writeInText?: string;
}

export interface BallotCommitment {
  commitment: string;
  nonce: string;
  timestamp: Date;
  userId: string;
  pollId: string;
}

// Vote Processing Types
export interface VoteResult {
  pollId: string;
  totalVotes: number;
  results: CandidateResult[];
  strategy: string;
  processedAt: Date;
  metadata: VoteMetadata;
}

export interface CandidateResult {
  candidateId: string;
  name: string;
  votes: number;
  percentage: number;
  rank: number;
  eliminated: boolean;
  rounds: RoundResult[];
}

export interface RoundResult {
  round: number;
  votes: number;
  percentage: number;
  eliminated: boolean;
  transfers: TransferResult[];
}

export interface TransferResult {
  fromCandidate: string;
  toCandidate: string;
  votes: number;
  reason: 'elimination' | 'surplus' | 'exhausted';
}

export interface VoteMetadata {
  strategy: string;
  totalRounds: number;
  quota: number;
  threshold: number;
  exhaustedBallots: number;
  invalidBallots: number;
}

// IRV Specific Types
export interface IRVResult extends VoteResult {
  rounds: IRVRound[];
  winner: string;
  quota: number;
}

export interface IRVRound {
  round: number;
  candidates: IRVCandidateResult[];
  eliminated: string[];
  transfers: TransferResult[];
}

export interface IRVCandidateResult {
  candidateId: string;
  votes: number;
  percentage: number;
  status: 'active' | 'eliminated' | 'elected';
}
```

### 2. Create Social Features Type Definitions
Create `lib/social/types.ts`:
```typescript
// Social Network Types
export interface SocialConnection {
  id: string;
  userId: string;
  connectedUserId: string;
  type: 'friend' | 'follower' | 'following' | 'colleague';
  strength: number;
  createdAt: Date;
  lastInteraction: Date;
}

export interface SocialInfluence {
  userId: string;
  influenceScore: number;
  reach: number;
  engagement: number;
  credibility: number;
  lastCalculated: Date;
}

export interface NetworkEffect {
  pollId: string;
  userId: string;
  influence: number;
  reach: number;
  impact: number;
  timestamp: Date;
}

// Candidate Tools Types
export interface CandidateProfile {
  id: string;
  name: string;
  party: string;
  position: string;
  district: string;
  state: string;
  bio: string;
  website: string;
  socialMedia: SocialMediaLinks;
  endorsements: Endorsement[];
  issues: Issue[];
  fundraising: FundraisingData;
}

export interface SocialMediaLinks {
  twitter?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
}

export interface Endorsement {
  id: string;
  organization: string;
  type: 'endorsement' | 'support' | 'opposition';
  date: Date;
  description: string;
}

export interface Issue {
  id: string;
  name: string;
  position: string;
  description: string;
  priority: number;
  category: string;
}

export interface FundraisingData {
  totalRaised: number;
  totalSpent: number;
  cashOnHand: number;
  debt: number;
  topContributors: Contributor[];
  spendingByCategory: SpendingCategory[];
}

export interface Contributor {
  name: string;
  amount: number;
  type: 'individual' | 'organization' | 'pac';
  date: Date;
}

export interface SpendingCategory {
  category: string;
  amount: number;
  percentage: number;
}

// Social Discovery Types
export interface DiscoveryAlgorithm {
  name: string;
  type: 'collaborative' | 'content-based' | 'hybrid';
  config: DiscoveryConfig;
}

export interface DiscoveryConfig {
  minSimilarity: number;
  maxResults: number;
  includeInactive: boolean;
  weightFactors: WeightFactors;
}

export interface WeightFactors {
  votingHistory: number;
  demographics: number;
  interests: number;
  connections: number;
  engagement: number;
}

export interface DiscoveryResult {
  userId: string;
  candidates: DiscoveredCandidate[];
  polls: DiscoveredPoll[];
  connections: DiscoveredConnection[];
  score: number;
  reason: string;
}

export interface DiscoveredCandidate {
  candidateId: string;
  name: string;
  matchScore: number;
  reasons: string[];
  commonInterests: string[];
  sharedConnections: number;
}

export interface DiscoveredPoll {
  pollId: string;
  title: string;
  matchScore: number;
  reasons: string[];
  category: string;
  endDate: Date;
}

export interface DiscoveredConnection {
  userId: string;
  name: string;
  matchScore: number;
  mutualConnections: number;
  sharedInterests: string[];
}

// Viral Detection Types
export interface ViralMoment {
  id: string;
  pollId: string;
  candidateId?: string;
  type: 'poll' | 'candidate' | 'issue';
  viralityScore: number;
  reach: number;
  engagement: number;
  velocity: number;
  peakTime: Date;
  duration: number;
  factors: ViralFactor[];
}

export interface ViralFactor {
  type: 'social_media' | 'news' | 'influencer' | 'event' | 'controversy';
  impact: number;
  description: string;
  source: string;
  timestamp: Date;
}

export interface ViralThreshold {
  minReach: number;
  minEngagement: number;
  minVelocity: number;
  timeWindow: number;
  category: string;
}
```

### 3. Fix Import/Export Issues
```typescript
// Before (anonymous export):
export default {
  // ... object
};

// After (named export):
const candidateTools = {
  // ... object
};
export default candidateTools;
```

### 4. Type Implementation Examples

#### Before (with `any`):
```typescript
export async function calculateNetworkEffect(
  pollId: string,
  userId: string
): Promise<any> {
  const influence = await getUserInfluence(userId);
  return {
    influence: influence.score,
    reach: influence.reach
  };
}
```

#### After (properly typed):
```typescript
export async function calculateNetworkEffect(
  pollId: string,
  userId: string
): Promise<NetworkEffect> {
  const influence = await getUserInfluence(userId);
  return {
    pollId,
    userId,
    influence: influence.score,
    reach: influence.reach,
    impact: influence.score * influence.reach,
    timestamp: new Date()
  };
}
```

## Testing Strategy

### 1. Unit Tests
- Test voting strategy implementations
- Test social discovery algorithms
- Test network effects calculations
- Test viral detection logic

### 2. Integration Tests
- Test vote processing end-to-end
- Test social features integration
- Test candidate tools functionality
- Test viral moment detection

### 3. Performance Tests
- Test voting engine performance
- Test social algorithm efficiency
- Test network effect calculations
- Test viral detection accuracy

## Success Criteria

### Phase 1: Critical Fixes
- [ ] Zero `any` types in `candidate-tools.ts`
- [ ] Zero `any` types in `social-discovery.ts`
- [ ] Zero `any` types in `network-effects.ts`
- [ ] Zero `any` types in `vote/finalize.ts`

### Phase 2: Complete Module
- [ ] All 15 files have zero `any` types
- [ ] All anonymous exports converted to named exports
- [ ] All require() imports converted to ES6
- [ ] All unused variables prefixed with `_` or removed

### Phase 3: Validation
- [ ] `npm run build` completes successfully
- [ ] `npm run lint` passes with zero errors
- [ ] All TypeScript strict mode checks pass
- [ ] Voting engine and social features work correctly

## File-by-File Checklist

### High Priority Files
- [ ] `lib/social/candidate-tools.ts` - 1+ `any` + 20+ unused vars + anonymous export → 0
- [ ] `lib/social/social-discovery.ts` - 6+ `any` + 15+ unused vars + anonymous export → 0
- [ ] `lib/social/network-effects.ts` - 2+ `any` + 10+ unused vars + anonymous export → 0
- [ ] `lib/vote/finalize.ts` - 10+ `any` types + unused vars → 0

### Medium Priority Files
- [ ] `lib/vote/strategies/ranked.ts` - 1+ `any` + prefer-const → 0
- [ ] `lib/vote/irv-calculator.ts` - require() + unused vars + prefer-const → 0
- [ ] `lib/vote/processor.ts` - 2+ `any` + unused imports → 0
- [ ] `lib/vote/validator.ts` - 1+ `any` + unused vars → 0
- [ ] `lib/vote/types.ts` - 8+ `any` types → 0
- [ ] `lib/social/viral-detection.ts` - 8+ `any` + unused vars → 0

### Lower Priority Files
- [ ] `lib/vote/engine.ts` - 1+ `any` type → 0
- [ ] `lib/vote/engine.test.ts` - 1+ `any` type → 0
- [ ] `lib/vote/strategies/approval.ts` - 1+ `any` type → 0
- [ ] `lib/vote/strategies/quadratic.ts` - 1+ `any` type → 0
- [ ] `lib/vote/strategies/range.ts` - 1+ `any` type → 0

## Notes

- Focus on voting engine types first as they're critical for core functionality
- Social features have many unused variables that can be safely prefixed with `_`
- Anonymous exports need to be converted to named exports for better tree-shaking
- Test thoroughly as voting and social changes can affect user experience
- Coordinate with other agents for shared type definitions
- Consider performance implications of social algorithms
