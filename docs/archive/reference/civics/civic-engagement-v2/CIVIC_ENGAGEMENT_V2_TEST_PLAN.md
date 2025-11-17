# Civic Engagement V2 Test Plan

> **Archived (Jan 2026):** This plan documents the deprecated Civic Engagement V2 effort. For current QA expectations, consult `docs/FEATURE_STATUS.md#civic_engagement_v2` plus the testing guidance in `docs/TESTING.md`.

**Feature:** Civic Engagement V2  
**Status:** Test Plan Created  
**Date:** January 2025

---

## Overview

This test plan covers testing for Civic Engagement V2 features including civic actions (petitions, campaigns, surveys, events), API endpoints, UI components, and integrations.

---

## Test Scope

### In Scope
- API endpoint functionality
- Database operations
- UI component rendering and interactions
- Analytics event tracking
- Integration with feeds and representatives
- Security and authorization
- Validation and error handling

### Out of Scope
- Performance/load testing (separate plan)
- Browser compatibility (covered by E2E)
- Accessibility audit (separate process)

---

## Test Categories

### 1. Unit Tests

#### API Routes
- ✅ GET /api/civic-actions - List with filters
- ✅ POST /api/civic-actions - Create action
- ✅ GET /api/civic-actions/[id] - Get single action
- ✅ PATCH /api/civic-actions/[id] - Update action
- ✅ DELETE /api/civic-actions/[id] - Delete action
- ✅ POST /api/civic-actions/[id]/sign - Sign action

**Test File:** `web/tests/integration/api/civic-actions.test.ts`

**Coverage:**
- Success cases
- Validation errors
- Authentication/authorization
- Feature flag gating
- Rate limiting
- Error handling

#### Utilities
- `createSophisticatedCivicAction`
- `getRepresentativesByLocation`
- `trackRepresentativeContact`
- `getTrendingCivicActions`
- Integration utilities

**Test Files:** `web/tests/unit/utils/civic-engagement.test.ts`

#### UI Components
- `CivicActionCard` - Rendering, interactions, sign functionality
- `CivicActionList` - List display, filtering, pagination
- `CreateCivicActionForm` - Form validation, submission

**Test Files:** `web/tests/unit/components/civic-actions/*.test.tsx`

---

### 2. Integration Tests

#### API + Database
- Create action → Verify database record
- Update action → Verify changes persisted
- Sign action → Verify signature count updated
- Delete action → Verify record removed
- List actions → Verify filtering works

**Test File:** `web/tests/integration/api/civic-actions-db.test.ts`

#### Analytics Integration
- Verify events tracked on create
- Verify events tracked on sign
- Verify events tracked on update/delete
- Verify event data structure

**Test File:** `web/tests/integration/analytics/civic-actions-analytics.test.ts`

#### Feed Integration
- Verify feed items created for public actions
- Verify feed items not created for private actions
- Verify feed items include correct metadata

**Test File:** `web/tests/integration/feeds/civic-actions-feeds.test.ts`

---

### 3. E2E Tests

#### User Flows
1. **Create Civic Action Flow**
   - Navigate to create page
   - Fill form
   - Submit
   - Verify action created
   - Verify redirect to detail page

2. **Sign Petition Flow**
   - View action list
   - Click on petition
   - Click sign button
   - Verify signature count updated
   - Verify button shows "Signed"

3. **Filter Actions Flow**
   - View action list
   - Apply status filter
   - Apply category filter
   - Verify filtered results

4. **Update Action Flow**
   - Create action
   - Navigate to edit
   - Update fields
   - Save
   - Verify changes reflected

**Test File:** `web/tests/e2e/civic-actions.spec.ts`

---

## Test Cases

### API Endpoints

#### GET /api/civic-actions
- ✅ Returns list of actions
- ✅ Filters by status
- ✅ Filters by action_type
- ✅ Filters by category
- ✅ Filters by urgency_level
- ✅ Filters by is_public
- ✅ Pagination works
- ✅ Sorting works
- ✅ Returns 403 when feature disabled
- ✅ Returns only public actions for unauthenticated users

#### POST /api/civic-actions
- ✅ Creates new action
- ✅ Validates required fields
- ✅ Validates field lengths
- ✅ Validates enum values
- ✅ Requires authentication
- ✅ Sets created_by to current user
- ✅ Tracks analytics event
- ✅ Returns 201 on success

#### GET /api/civic-actions/[id]
- ✅ Returns single action
- ✅ Returns 404 for non-existent
- ✅ Respects privacy (public/private)
- ✅ Allows creator to view private actions

#### PATCH /api/civic-actions/[id]
- ✅ Updates action
- ✅ Validates ownership
- ✅ Allows admin to update any
- ✅ Tracks analytics event
- ✅ Returns updated action

#### DELETE /api/civic-actions/[id]
- ✅ Deletes action
- ✅ Validates ownership
- ✅ Allows admin to delete any
- ✅ Tracks analytics event

#### POST /api/civic-actions/[id]/sign
- ✅ Signs action
- ✅ Increments signature count
- ✅ Prevents duplicate signatures
- ✅ Prevents signing inactive actions
- ✅ Prevents signing expired actions
- ✅ Tracks analytics event
- ✅ Returns updated signature count

### UI Components

#### CivicActionCard
- ✅ Renders action data
- ✅ Shows urgency badge
- ✅ Shows progress bar for petitions
- ✅ Handles sign action
- ✅ Shows signed state
- ✅ Links to detail page
- ✅ Handles expired actions
- ✅ Handles inactive status

#### CivicActionList
- ✅ Renders list of actions
- ✅ Shows loading state
- ✅ Shows error state
- ✅ Shows empty state
- ✅ Handles pagination
- ✅ Applies filters
- ✅ Handles sign action

#### CreateCivicActionForm
- ✅ Renders form fields
- ✅ Validates input
- ✅ Shows validation errors
- ✅ Submits form
- ✅ Handles success
- ✅ Handles errors
- ✅ Shows character counts

---

## Test Data

### Test Actions
```typescript
const testActions = {
  activePetition: {
    title: 'Test Petition',
    action_type: 'petition',
    status: 'active',
    is_public: true,
    urgency_level: 'high',
    required_signatures: 100,
    current_signatures: 50,
  },
  draftCampaign: {
    title: 'Draft Campaign',
    action_type: 'campaign',
    status: 'draft',
    is_public: false,
    urgency_level: 'medium',
  },
  expiredEvent: {
    title: 'Expired Event',
    action_type: 'event',
    status: 'active',
    is_public: true,
    end_date: '2020-01-01T00:00:00Z',
  },
};
```

### Test Users
- Authenticated user (can create/update own actions)
- Admin user (can update/delete any action)
- Unauthenticated user (can only view public actions)

---

## Test Environment Setup

### Prerequisites
- Feature flag `CIVIC_ENGAGEMENT_V2` enabled
- Database migration applied
- Test database with seed data
- Mock Supabase client for unit tests

### Test Execution

```bash
# Run all tests
npm test

# Run integration tests only
npm test -- tests/integration

# Run E2E tests
npm run test:e2e

# Run with coverage
npm test -- --coverage
```

---

## Test Metrics

### Coverage Goals
- API Routes: 90%+
- Utilities: 85%+
- UI Components: 80%+
- Integration: 75%+

### Performance Targets
- API response time: < 200ms
- Component render: < 100ms
- Form submission: < 500ms

---

## Known Issues

None currently.

---

## Test Status

- ✅ Test Plan: Complete
- ✅ Integration Tests: Created (`web/tests/integration/api/civic-actions.test.ts`)
- ✅ Unit Tests: Created
  - ✅ Component Tests: `web/tests/unit/components/civic-actions/*.test.tsx`
  - ✅ Utility Tests: `web/tests/unit/utils/sophisticated-civic-engagement.test.ts`
- ✅ E2E Tests: Created (`web/tests/e2e/civic-actions.spec.ts`)
- ⏳ Test Execution: Pending (ready to run)

---

**Last Updated:** January 2025

