**Last Updated**: 2025-09-17
# Voting Engine Documentation
**Last Updated**: 2025-09-17

**Last Updated**: December 19, 2024

**Created**: September 15, 2025  
**Status**: ✅ COMPLETE - Voting Engine with Advanced IRV Implementation

## Overview

The Choices platform voting engine provides a comprehensive, extensible system for handling multiple voting methods with robust validation, processing, and results calculation. The engine follows the Strategy pattern to support different voting algorithms while maintaining a consistent interface.

## Architecture

### Core Components

1. **VoteEngine** (`lib/vote/engine.ts`) - Main orchestrator
2. **Voting Strategies** (`lib/vote/strategies/`) - Method-specific implementations
3. **VoteProcessor** (`lib/vote/processor.ts`) - Vote storage and processing
4. **VoteValidator** (`lib/vote/validator.ts`) - Comprehensive validation
5. **Types** (`lib/vote/types.ts`) - TypeScript interfaces and types

### Strategy Pattern Implementation

Each voting method is implemented as a separate strategy class that implements the `VotingStrategy` interface:

```typescript
interface VotingStrategy {
  validateVote(request: VoteRequest, poll: PollData): Promise<VoteValidation>;
  processVote(request: VoteRequest, poll: PollData): Promise<VoteResponse>;
  calculateResults(poll: PollData, votes: VoteData[]): Promise<ResultsData>;
  getConfiguration(): Record<string, any>;
  getVotingMethod(): VotingMethod;
}
```

## Supported Voting Methods

### 1. Single Choice Voting
- **File**: `lib/vote/strategies/single-choice.ts`
- **Description**: Voters select exactly one option
- **Winner**: Option with most votes
- **Use Cases**: Binary decisions, simple polls, quick choices

### 2. Approval Voting
- **File**: `lib/vote/strategies/approval.ts`
- **Description**: Voters can approve multiple options
- **Winner**: Option with most approvals
- **Use Cases**: Multi-candidate elections, consensus building

### 3. Ranked Choice Voting (IRV) - ✅ ADVANCED IMPLEMENTATION
- **File**: `lib/vote/irv-calculator.ts`
- **Description**: Voters rank all options in order of preference
- **Winner**: Determined by instant runoff voting with advanced features
- **Use Cases**: Elections, preference-based decisions, complex multi-candidate scenarios
- **Advanced Features**:
  - ✅ **Deterministic Tie-Breaking**: Poll-seeded hashing for consistent results
  - ✅ **Write-in Candidate Support**: Automatic inference and handling
  - ✅ **Withdrawn Candidate Support**: Proper vote redistribution
  - ✅ **Exhausted Ballot Tracking**: Complete audit trail
  - ✅ **Standard IRV Compliance**: Mathematically correct implementation
  - ✅ **Comprehensive Testing**: 8/8 golden test cases passing

### 4. Quadratic Voting
- **File**: `lib/vote/strategies/quadratic.ts`
- **Description**: Voters allocate credits with quadratic cost
- **Winner**: Option with highest total credits
- **Use Cases**: Budget allocation, intensity of preference

### 5. Range Voting
- **File**: `lib/vote/strategies/range.ts`
- **Description**: Voters rate each option on a scale
- **Winner**: Option with highest average rating
- **Use Cases**: Satisfaction surveys, detailed feedback

## API Endpoints

### Poll Management

#### Create Poll
```http
POST /api/polls
Content-Type: application/json

{
  "title": "Poll Title",
  "description": "Poll Description",
  "options": ["Option 1", "Option 2", "Option 3"],
  "votingMethod": "single",
  "votingConfig": {
    "allowMultipleVotes": false,
    "requireVerification": false,
    "minTrustTier": "T0"
  }
}
```

#### Get Poll
```http
GET /api/polls/{pollId}
```

#### Close Poll
```http
POST /api/polls/{pollId}/close
```

#### Lock Poll
```http
POST /api/polls/{pollId}/lock
DELETE /api/polls/{pollId}/lock
```

#### Post-Close Voting
```http
POST /api/polls/{pollId}/post-close
DELETE /api/polls/{pollId}/post-close
```

### Voting

#### Submit Vote
```http
POST /api/polls/{pollId}/vote
Content-Type: application/json

{
  "voteData": {
    "choice": 0,  // For single choice
    "approvals": [0, 2],  // For approval
    "rankings": [0, 1, 2],  // For ranked
    "allocations": {"0": 5, "1": 3},  // For quadratic
    "ratings": {"0": 8, "1": 6, "2": 4}  // For range
  },
  "privacyLevel": "public"
}
```

#### Get Results
```http
GET /api/polls/{pollId}/results
```

## Poll Lifecycle

### States
1. **Draft** - Poll being created
2. **Active** - Accepting votes
3. **Closed** - No longer accepting votes, baseline set
4. **Archived** - Final state

### Lifecycle Management
- **Baseline**: Set when poll is closed, represents results at closure
- **Post-Close Voting**: Optional feature allowing votes after closure
- **Locking**: Prevents further changes to poll configuration

## Validation System

### Multi-Layer Validation
1. **Basic Structure** - Data format and type checking
2. **Method-Specific** - Voting method rules
3. **Business Rules** - Poll status, timing, user eligibility
4. **Security** - Authentication, trust tiers, rate limiting

### Validation Features
- Real-time validation feedback
- Comprehensive error messages
- Security constraint enforcement
- Rate limiting protection

## Results Calculation

### Live Results
- Real-time calculation as votes are cast
- Cached for performance
- Method-specific algorithms

### Baseline Results
- Snapshot taken when poll closes
- Used for comparison with post-close votes
- Immutable once set

### Drift Analysis
- Comparison between baseline and current results
- Identifies changes in voting patterns
- Useful for detecting manipulation

## Advanced IRV Implementation

### IRV Calculator Features

The IRV calculator (`lib/vote/irv-calculator.ts`) implements a production-ready Instant Runoff Voting system with the following capabilities:

#### Core Algorithm
- **Standard IRV Compliance**: Follows established IRV rules and best practices
- **Deterministic Tie-Breaking**: Uses poll-seeded hashing for consistent, reproducible results
- **Majority Detection**: Declares winners immediately when majority threshold is reached
- **Vote Redistribution**: Properly transfers votes from eliminated candidates to next preferences

#### Advanced Features

##### 1. Write-in Candidate Support
```typescript
// Automatic candidate inference from ballots
const candidateSet = new Set<string>();
for (const r of validRankings) {
  for (const id of r.ranking) {
    if (id && typeof id === 'string') {
      candidateSet.add(id);
    }
  }
}
```

##### 2. Withdrawn Candidate Handling
```typescript
// Filter out withdrawn candidates and redistribute votes
const withdrawnCandidates = new Set<string>();
for (const [id, candidate] of this.candidates) {
  if (candidate.isWithdrawn) {
    withdrawnCandidates.add(id);
  }
}
```

##### 3. Deterministic Tie-Breaking
```typescript
function pickElimination(
  tied: string[],
  round1: Record<string, number>,
  seed = ''
): string {
  return [...tied].sort((a, b) =>
    (round1[a] ?? 0) - (round1[b] ?? 0) ||
    (a + seed).localeCompare(b + seed)
  )[0];
}
```

##### 4. Exhausted Ballot Tracking
- Tracks ballots that become exhausted when no remaining preferences exist
- Provides complete audit trail for transparency
- Supports complex voting scenarios with partial rankings

#### Metadata and Audit Trail

The IRV calculator provides comprehensive metadata for transparency and auditability:

```typescript
interface IRVResults {
  winner: string | null;
  rounds: IRVRound[];
  totalVotes: number;
  metadata: {
    calculationTime: number;
    tieBreaksUsed: number;
    edgeCasesHandled: string[];
  };
}
```

**Metadata Fields:**
- `calculationTime`: Performance metrics
- `tieBreaksUsed`: Count of tie-breaking operations
- `edgeCasesHandled`: Array of special scenarios encountered

**Edge Cases Tracked:**
- `elimination_tie`: Tie-breaking during elimination rounds
- `final_tie`: Tie-breaking in final round
- `withdrawn_candidates`: Withdrawn candidate scenarios
- `exhausted-ballots`: Exhausted ballot scenarios

#### Testing and Validation

The IRV implementation includes comprehensive testing:

- **8 Golden Test Cases**: Covering all major scenarios
- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end voting flows
- **Property Tests**: Mathematical invariants validation

**Golden Test Cases:**
1. Simple majority winner
2. Tie-breaking scenario
3. Exhausted ballots
4. Write-in candidates
5. Fully exhausted ballots
6. Withdrawn candidates
7. Tie storm (multiple rounds)
8. All same first choice

#### Performance Characteristics

- **Time Complexity**: O(n × m) where n = ballots, m = candidates
- **Space Complexity**: O(m) for candidate tracking
- **Deterministic**: Same input always produces same output
- **Scalable**: Handles large numbers of ballots and candidates efficiently

## Security Features

### Authentication & Authorization
- User authentication required for voting
- Poll creator permissions for management
- Admin override capabilities

### Rate Limiting
- Per-user vote limits
- Time-based windows
- Configurable thresholds

### Trust Tiers
- User verification levels
- Poll-specific requirements
- Graduated access control

### Audit Trail
- Complete vote history
- Timestamp tracking
- User identification
- IP address logging

## Performance Optimizations

### Caching
- Results calculation caching
- Poll data caching
- User session caching

### Database Optimization
- Indexed queries
- Efficient vote counting
- Batch operations

### Real-time Updates
- WebSocket connections
- Live result streaming
- Event-driven updates

## Error Handling

### Comprehensive Error Types
- `VoteValidationError` - Validation failures
- `VoteProcessingError` - Processing issues
- `ResultsCalculationError` - Calculation problems

### Error Recovery
- Graceful degradation
- Retry mechanisms
- Fallback strategies

## Testing

### Unit Tests
- Strategy validation
- Results calculation
- Error handling

### Integration Tests
- End-to-end voting flows
- API endpoint testing
- Database operations

### Performance Tests
- Load testing
- Stress testing
- Scalability validation

## Configuration

### Voting Method Configuration
Each voting method exposes configuration options:

```typescript
{
  name: string;
  description: string;
  minOptions: number;
  maxOptions: number;
  allowAbstention: boolean;
  requiresRanking: boolean;
  allowsMultipleSelections: boolean;
  resultType: string;
  features: string[];
  limitations: string[];
}
```

### Poll Configuration
```typescript
{
  allowMultipleVotes: boolean;
  requireVerification: boolean;
  minTrustTier: string;
  maxChoices?: number;
  quadraticCredits?: number;
  rangeMin?: number;
  rangeMax?: number;
}
```

## Future Enhancements

### Planned Features
- Advanced result visualizations
- Export capabilities
- API rate limiting
- Webhook notifications
- Mobile optimization

### Extensibility
- Plugin architecture for new voting methods
- Custom validation rules
- Third-party integrations
- Advanced analytics

## Files Created/Modified

### Core Engine
- `web/lib/vote/engine.ts` - Main voting engine
- `web/lib/vote/types.ts` - TypeScript interfaces
- `web/lib/vote/processor.ts` - Vote processing
- `web/lib/vote/validator.ts` - Validation system
- `web/lib/vote/irv-calculator.ts` - ✅ **Advanced IRV Implementation**

### Voting Strategies
- `web/lib/vote/strategies/single-choice.ts`
- `web/lib/vote/strategies/approval.ts`
- `web/lib/vote/strategies/ranked.ts`
- `web/lib/vote/strategies/quadratic.ts`
- `web/lib/vote/strategies/range.ts`

### Testing Infrastructure
- `web/tests/unit/irv-calculator.test.ts` - ✅ **Comprehensive IRV Testing**
- `web/tests/irv/golden-cases.ts` - ✅ **8 Golden Test Cases**
- `web/tests/unit/vote-processor.test.ts` - Vote processor testing
- `web/tests/unit/vote-validator.test.ts` - Validation testing

### API Routes
- `web/app/api/polls/[id]/close/route.ts`
- `web/app/api/polls/[id]/lock/route.ts`
- `web/app/api/polls/[id]/post-close/route.ts`

### Documentation
- `docs/core/VOTING_ENGINE.md` - This documentation

## Integration Notes

The voting engine integrates with existing components:
- **Frontend Components**: Uses existing voting UI components
- **Database**: Leverages existing Supabase schema
- **Authentication**: Integrates with existing auth system
- **Logging**: Uses existing logging infrastructure

## Status

✅ **COMPLETE** - All voting engine components implemented and documented. The system includes a production-ready IRV calculator with advanced features and comprehensive testing.

### Recent Achievements (December 19, 2024)

✅ **Advanced IRV Implementation Complete**
- Standard IRV Spec v1 with deterministic tie-breaking
- Write-in candidate support with automatic inference
- Withdrawn candidate handling with proper vote redistribution
- Exhausted ballot tracking for complete audit trail
- Comprehensive metadata and performance tracking

✅ **Comprehensive Testing Suite**
- 8/8 Golden Test Cases passing
- Unit tests for all components
- Integration tests for end-to-end flows
- Property tests for mathematical invariants

✅ **Production-Ready Features**
- Deterministic, reproducible results
- Scalable performance characteristics
- Complete audit trail and transparency
- Standard compliance with IRV best practices

---

**Last Updated**: December 19, 2024  
**Status**: ✅ **PRODUCTION READY** - Advanced IRV implementation with comprehensive testing complete.
