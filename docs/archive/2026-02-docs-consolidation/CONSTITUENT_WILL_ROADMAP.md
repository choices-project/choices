# Constituent Will vs Actual Vote - Implementation Roadmap

**Date:** 2026-01-25  
**Status:** 🚀 In Progress  
**Goal:** Enable constituents to create polls showing how they want their representatives to vote, then compare those results to actual votes

## Vision

Constituents can:
1. Create polls about how they want their representative to vote on specific bills
2. See how their representative actually voted
3. View accountability scores showing alignment/misalignment
4. Access full bill text and context to understand what was voted on

## Architecture Overview

```
┌─────────────────┐
│  Client (User)   │
│  - Create Poll   │
│  - View Results  │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│  API Routes     │  ← Server-only, secure
│  - /api/polls   │
│  - /api/account │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Services       │  ← Server-only, 'use server'
│  - Poll Service │
│  - Promise Fulf │
│  - GovInfo MCP  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MCP Tools      │  ← Agent context only
│  - Bill Content │
│  - Search Bills │
└─────────────────┘
```

## Phases

### Phase 1: Foundation & MCP Integration (Week 1-2) ✅ IN PROGRESS

**Goal:** Set up server-only services and MCP client

**Tasks:**
- [x] Create GovInfo MCP service wrapper (server-only)
- [x] Create Promise Fulfillment service (server-only)
- [x] Add runtime security checks
- [x] Create API routes for accountability
- [ ] **Implement MCP client connection** ⏳ CURRENT
- [ ] Test MCP tool calls from API routes
- [ ] Add error handling and fallbacks

**Deliverables:**
- Server-only services with security guarantees
- Working MCP client (or agent API endpoint)
- API routes ready for integration

### Phase 2: Poll Type Enhancement (Week 2-3)

**Goal:** Add "Constituent Will" poll type for bill voting

**Tasks:**
- [ ] Add `poll_type: 'constituent_will'` to poll schema
- [ ] Add bill metadata fields to polls table:
  - `bill_id` (GovInfo package ID)
  - `representative_id`
  - `bill_title`
  - `bill_summary`
- [ ] Create poll creation UI for constituent will polls
- [ ] Add bill search/selection in poll creation
- [ ] Pre-populate poll options (Yes/No/Abstain) for bill polls
- [ ] Add bill context display in poll UI

**Deliverables:**
- New poll type in database
- Enhanced poll creation form
- Bill search and selection UI

### Phase 3: Vote Comparison Engine (Week 3-4)

**Goal:** Compare poll results to actual votes

**Tasks:**
- [x] Implement `analyzeConstituentWill()` service method
- [ ] Enhance poll results API to include:
  - Constituent preference calculation
  - Alignment with actual vote
  - Accountability score
- [ ] Create vote lookup service (integrate with existing vote data)
- [ ] Add bill context fetching (summary, key provisions)
- [ ] Calculate alignment scores

**Deliverables:**
- Working comparison engine
- Enhanced poll results with accountability data
- Vote lookup integration

### Phase 4: Accountability Dashboard (Week 4-5)

**Goal:** Create UI showing constituent will vs actual votes

**Tasks:**
- [ ] Create accountability dashboard page
- [ ] Design comparison cards showing:
  - Poll results (constituent will)
  - Actual vote
  - Alignment score
  - Bill context
- [ ] Add representative profile integration
- [ ] Create "How I Voted vs How You Wanted" section
- [ ] Add bill text viewer (collapsible)
- [ ] Add related bills and amendments display

**Deliverables:**
- Accountability dashboard UI
- Comparison visualization
- Bill context viewer

### Phase 5: Integration & Polish (Week 5-6)

**Goal:** Integrate with existing features and polish UX

**Tasks:**
- [ ] Integrate with representative profiles
- [ ] Add to electoral feed
- [ ] Create shareable accountability reports
- [ ] Add notifications when representative votes
- [ ] Create "Representative Report Card" feature
- [ ] Add analytics and metrics
- [ ] Performance optimization
- [ ] Error handling and edge cases

**Deliverables:**
- Fully integrated feature
- Polished UX
- Analytics and reporting

## Technical Implementation Details

### Database Schema Changes

```sql
-- Add to polls table
ALTER TABLE polls ADD COLUMN IF NOT EXISTS poll_type VARCHAR(50) DEFAULT 'standard';
ALTER TABLE polls ADD COLUMN IF NOT EXISTS bill_id VARCHAR(255);
ALTER TABLE polls ADD COLUMN IF NOT EXISTS representative_id INTEGER;
ALTER TABLE polls ADD COLUMN IF NOT EXISTS bill_title TEXT;
ALTER TABLE polls ADD COLUMN IF NOT EXISTS bill_summary TEXT;

-- Create index for accountability queries
CREATE INDEX IF NOT EXISTS idx_polls_constituent_will 
  ON polls(representative_id, bill_id) 
  WHERE poll_type = 'constituent_will';
```

### API Endpoints

1. **GET /api/accountability/constituent-will**
   - Query: `representativeId`, `billId`, `pollId`
   - Returns: Comparison analysis

2. **POST /api/accountability/promise-fulfillment**
   - Body: Promise data
   - Returns: Fulfillment analysis

3. **GET /api/polls/bill-context**
   - Query: `billId`
   - Returns: Bill summary, key provisions, related bills

4. **POST /api/polls/constituent-will**
   - Body: Poll data with bill metadata
   - Returns: Created poll with bill context

### Service Methods

```typescript
// Promise Fulfillment Service
analyzeConstituentWill(representativeId, billId, pollId)
analyzePromiseFulfillment(promise)

// GovInfo MCP Service
getBillContent(packageId, format)
getPackageSummary(packageId)
searchBills(query, filters)
getRelatedBills(packageId)
```

## Security Considerations

✅ **Already Implemented:**
- Server-only services with `'use server'`
- Runtime assertions preventing client access
- API routes require authentication
- MCP tools only in agent context

⚠️ **To Implement:**
- Rate limiting on MCP calls
- Caching strategy for bill content
- Input validation on bill IDs
- Authorization checks (users can only create polls for their representatives)

## Success Metrics

1. **Functionality:**
   - Users can create constituent will polls
   - Poll results compare to actual votes
   - Accountability scores are accurate
   - Bill context is accessible

2. **Performance:**
   - Poll creation < 2 seconds
   - Comparison analysis < 3 seconds
   - Bill content loading < 5 seconds

3. **User Engagement:**
   - Poll creation rate
   - Accountability dashboard views
   - Share rate of accountability reports

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| MCP unavailable | High | Graceful degradation, cached bill data |
| Bill ID mismatch | Medium | Validation, fuzzy matching |
| Vote data missing | Medium | Fallback to "not voted" status |
| Performance issues | Medium | Caching, pagination, lazy loading |

## Dependencies

- ✅ GovInfo MCP server (installed, needs client implementation)
- ✅ Poll system (exists, needs enhancement)
- ✅ Representative data (exists)
- ⏳ Vote data integration (needs verification)
- ⏳ Bill metadata storage (needs implementation)

## Next Steps

1. **Immediate:** Implement MCP client connection
2. **Short-term:** Add poll type and database schema
3. **Medium-term:** Build UI components
4. **Long-term:** Integrate and polish

## Notes

- All MCP services are server-only and secure
- Users cannot access MCP tools directly
- Services use runtime checks to prevent client access
- API routes handle all user interactions
- MCP tools only called from server context
