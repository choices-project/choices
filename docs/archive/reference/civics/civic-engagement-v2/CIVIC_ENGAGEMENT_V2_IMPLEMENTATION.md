# Civic Engagement V2 Implementation Summary

> **Archived (Jan 2026):** Civic Engagement V2 has been superseded by the current Civic Actions workstream. See `docs/FEATURE_STATUS.md#civic_engagement_v2` and the latest API/analytics docs (`docs/CIVIC_ACTIONS.md`, `docs/ANALYTICS_PIPELINE.md`) for up-to-date guidance.

**Status:** ✅ **Core Implementation Complete**  
**Date:** January 2025  
**Feature Flag:** `CIVIC_ENGAGEMENT_V2` (currently disabled)

---

## Overview

Civic Engagement V2 adds enhanced civic engagement features including petitions, campaigns, surveys, events, and other civic actions with comprehensive tracking, analytics, and integration capabilities.

---

## ✅ Completed Components

### 1. Database Schema (✅ Complete)

**Migration:** `supabase/migrations/2025-01-22_001_enhance_civic_actions_v2.sql`

**Enhancements:**
- `urgency_level` column (low, medium, high, critical) with validation
- `is_public` column with indexing for public/private actions
- `target_representatives` array column (replaces single `target_representative_id`)
- `metadata` JSONB column for flexible data storage
- RLS policies for security (select, insert, update, delete)
- Performance indexes for trending queries and filtering

### 2. API Routes (✅ Complete)

**Base Routes:**
- `GET /api/civic-actions` - List actions with filtering, pagination, sorting
- `POST /api/civic-actions` - Create new civic action
- `GET /api/civic-actions/[id]` - Get single action
- `PATCH /api/civic-actions/[id]` - Update action
- `DELETE /api/civic-actions/[id]` - Delete action
- `POST /api/civic-actions/[id]/sign` - Sign/endorse action

**Features:**
- Comprehensive Zod validation
- Rate limiting on all endpoints
- Authentication checks
- Ownership verification
- Analytics event tracking
- Error handling

### 3. Utilities (✅ Complete)

**Updated:** `web/lib/utils/sophisticated-civic-engagement.ts`

**Functions:**
- `createSophisticatedCivicAction` - Real database operations
- `getRepresentativesByLocation` - Queries representatives_core
- `trackRepresentativeContact` - Creates contact_messages records
- `getTrendingCivicActions` - Database queries with trending algorithm
- `calculateCivicEngagementMetrics` - Metrics calculation
- `getCivicEngagementRecommendations` - User recommendations

### 4. UI Components (✅ Complete)

**Location:** `web/features/civics/components/civic-actions/`

**Components:**
- `CivicActionCard` - Displays action with sign functionality, progress bars, urgency badges
- `CivicActionList` - List with filtering, pagination, loading states
- `CreateCivicActionForm` - Form for creating new actions with validation

**Features:**
- Feature flag gating
- Responsive design
- Loading and error states
- Accessibility support
- Progress tracking for petitions

### 5. Analytics Tracking (✅ Complete)

**File:** `web/features/civics/analytics/civicActionsAnalyticsEvents.ts`

**Event Types:**
- `civic_action_created`
- `civic_action_viewed`
- `civic_action_signed`
- `civic_action_updated`
- `civic_action_deleted`
- `civic_action_shared`
- `civic_action_list_viewed`
- `civic_action_filter_applied`
- `civic_action_create_form_started`
- `civic_action_create_form_submitted`
- `civic_action_create_form_cancelled`
- `civic_action_representative_targeted`
- `civic_action_trending_viewed`

**Integration:**
- Analytics events tracked in API routes
- Events stored in `analytics_events` table
- Non-blocking (failures don't break requests)

### 6. Integration Utilities (✅ Complete)

**File:** `web/lib/utils/civic-actions-integration.ts`

**Functions:**
- `createCivicActionFeedItem` - Creates feed items for actions
- `linkCivicActionToRepresentatives` - Links actions to representatives
- `getCivicActionsForRepresentative` - Gets actions for a rep
- `getTrendingCivicActionsForFeed` - Gets trending actions for feeds

---

## 📋 Remaining Work

### 1. Testing (⏳ Pending)

**Tasks:**
- Create integration tests for API routes
- Add unit tests for UI components
- Add E2E tests for user flows
- Test analytics event tracking
- Test integration with feeds and representatives

**Files to Create:**
- `web/tests/integration/api/civic-actions.test.ts`
- `web/tests/unit/components/civic-actions/CivicActionCard.test.tsx`
- `web/tests/e2e/civic-actions.spec.ts`

### 2. Documentation (⏳ Pending)

**Tasks:**
- Document API endpoints
- Document user flows
- Create usage examples
- Document analytics events
- Update feature documentation

**Files to Create/Update:**
- `docs/API/civic-actions.md`
- `docs/FEATURES/civic-engagement-v2.md`

---

## 🚀 Usage

### Enabling the Feature

Set the feature flag in `web/lib/core/feature-flags.ts`:

```typescript
export const FEATURE_FLAGS = {
  // ...
  CIVIC_ENGAGEMENT_V2: true, // Enable the feature
} as const;
```

### Creating a Civic Action

```typescript
import { CreateCivicActionForm } from '@/features/civics/components/civic-actions';

<CreateCivicActionForm
  onSuccess={(actionId) => {
    router.push(`/civic-actions/${actionId}`);
  }}
/>
```

### Listing Civic Actions

```typescript
import { CivicActionList } from '@/features/civics/components/civic-actions';

<CivicActionList
  filters={{ status: 'active', action_type: 'petition' }}
  onSign={async (actionId) => {
    // Handle sign action
  }}
/>
```

### API Usage

```typescript
// Create action
const response = await fetch('/api/civic-actions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Support Climate Action',
    description: 'Urgent petition for climate legislation',
    action_type: 'petition',
    urgency_level: 'high',
    required_signatures: 1000,
    is_public: true,
  }),
});

// Sign action
await fetch(`/api/civic-actions/${actionId}/sign`, {
  method: 'POST',
});
```

---

## 📊 Database Schema

### civic_actions Table

**New Columns:**
- `urgency_level` TEXT NOT NULL DEFAULT 'medium' CHECK (urgency_level IN ('low', 'medium', 'high', 'critical'))
- `is_public` BOOLEAN NOT NULL DEFAULT true
- `target_representatives` INTEGER[] (array of representative IDs)
- `metadata` JSONB DEFAULT '{}'::jsonb

**Indexes:**
- `civic_actions_urgency_level_idx` - Urgency filtering
- `civic_actions_is_public_idx` - Public actions filtering
- `civic_actions_target_representatives_idx` - GIN index for array queries
- `civic_actions_metadata_idx` - GIN index for JSONB queries
- `civic_actions_status_public_idx` - Status + public filtering
- `civic_actions_trending_idx` - Trending queries

---

## 🔒 Security

- **RLS Policies:** All operations protected by Row Level Security
- **Authentication:** Required for create, update, delete operations
- **Ownership:** Users can only modify their own actions (admins can delete any)
- **Rate Limiting:** Applied to all endpoints
- **Input Validation:** Zod schemas for all inputs

---

## 📈 Analytics

All civic action events are tracked in the `analytics_events` table with:
- Event type
- User ID
- Action ID
- Event data (metadata)
- Timestamp

Events are non-blocking - failures don't break the main operation.

---

## 🔗 Integration Points

1. **Feeds:** Civic actions can be added to user feeds
2. **Representatives:** Actions can target specific representatives
3. **Analytics:** Comprehensive event tracking
4. **Trust Tiers:** Civic engagement affects user trust scores

---

## 🎯 Next Steps

1. **Enable Feature Flag:** Set `CIVIC_ENGAGEMENT_V2: true`
2. **Run Migration:** Apply database migration
3. **Test:** Run integration and E2E tests
4. **Deploy:** Deploy to staging for testing

**Quick Start:** See `docs/CIVIC_ENGAGEMENT_V2_QUICK_START.md` for immediate usage examples.

---

## 📝 Notes

- Feature is currently disabled by default (feature flag)
- All components check feature flag before rendering
- Analytics tracking is non-blocking
- Integration utilities are ready for use
- UI components follow existing design patterns

---

**Last Updated:** January 2025  
**Implementation Status:** ✅ Core Complete - Testing & Documentation Pending

