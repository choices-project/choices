# Voting Engine Documentation

**Created**: September 15, 2025  
**Updated**: 2025-09-16  
**Status**: Phase 3 Complete - Voting Engine & Results Implementation

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

### 3. Ranked Choice Voting
- **File**: `lib/vote/strategies/ranked.ts`
- **Description**: Voters rank all options in order of preference
- **Winner**: Determined by instant runoff voting
- **Use Cases**: Elections, preference-based decisions

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

### Voting Strategies
- `web/lib/vote/strategies/single-choice.ts`
- `web/lib/vote/strategies/approval.ts`
- `web/lib/vote/strategies/ranked.ts`
- `web/lib/vote/strategies/quadratic.ts`
- `web/lib/vote/strategies/range.ts`

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

✅ **Phase 3 Complete** - All voting engine components implemented and documented. The system is ready for integration testing and deployment.

---

**Last Updated**: 2025-09-16  
**Next Steps**: Integration with existing frontend components and comprehensive testing of the complete voting system.
