# Analytics Feature

**Last Updated**: November 3, 2025  
**Status**: ✅ Operational  
**Location**: `/web/features/analytics`

---

## Implementation

### Components (10 files)
- `features/analytics/components/EnhancedAnalyticsDashboard.tsx`

### Services
- `features/analytics/lib/analytics-service.ts` (606 lines) - CANONICAL
- `features/analytics/lib/enhanced-analytics-service.ts` (555 lines) - Enhanced version
- `lib/types/analytics.ts` (515 lines) - Analytics service class

### Hooks
- `features/analytics/hooks/useEnhancedAnalytics.ts`

### Types
- `features/analytics/types/analytics.ts`
- `lib/core/services/analytics/types/analytics.ts`

---

## Database

### Tables
- **poll_participation_analytics** (20 columns, added Nov 2025)
  - Structured analytics per poll participation
  - Trust tier, demographics, verification status
  - Replaces generic analytics_events for poll data
  
- **analytics_events** (9 columns)
  - Generic event tracking
  - `event_type`, `event_data` (JSONB), `user_id`
  
- **analytics_event_data** (6 columns)
  - Key-value event data
  
- **trust_tier_analytics** (6 columns)
  - Tier change tracking only
  - NOT for poll analytics
  
- **trust_tier_progression** (9 columns)
  - Detailed tier progression tracking

---

## API Endpoints

### `GET /api/analytics`
General analytics

### `GET /api/analytics/poll/[id]`
Poll-specific analytics

### `GET /api/analytics/user/[id]`
User analytics

### `GET /api/analytics/summary`
Platform-wide summary

### `POST /api/analytics/enhanced`
Enhanced analytics (custom queries)

### `GET /api/analytics/enhanced-unified/[id]`
Unified analytics view

---

## Key Functionality

### Poll Participation Tracking
**Function**: `recordPollAnalytics(userId, pollId, demographicData)`
- Inserts to `poll_participation_analytics` table (Nov 2025 migration)
- Records: trust tier, demographics, verification status
- File: `lib/types/analytics.ts:107-169`

### User Analytics
**Function**: `getUserAnalytics(userId)`
- Calculates engagement from user's votes
- Metrics: total_votes_cast, total_polls_participated, avg_engagement
- File: `lib/types/analytics.ts:445-493`

### Trust Tier Calculation
**Function**: `calculateTrustTierScore(userId)`
- Factors: voting history, biometric verification, phone/identity verification
- Returns: TrustTierScore object
- File: `lib/types/analytics.ts:27-101`

---

## RPC Functions Used

- `get_comprehensive_analytics(p_poll_id, p_trust_tiers)`
- `get_real_time_analytics(p_poll_id, p_time_window)`
- `analyze_geographic_intelligence(p_poll_id)`
- `analyze_poll_sentiment(p_poll_id)`

---

## Tests

**Location**: `features/analytics/__tests__/` (if exists)

---

## Migration Notes (November 2025)

- Created `poll_participation_analytics` table for structured analytics
- Changed from storing in `analytics_events.event_data` JSONB
- Now uses dedicated table with indexed columns
- Faster aggregation queries (GROUP BY trust_tier, region)

---

_Provides platform-wide and poll-specific analytics_

