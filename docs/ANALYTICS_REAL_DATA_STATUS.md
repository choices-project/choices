# Analytics Real Data Implementation Status

**Date:** November 30, 2025  
**Status:** Partial - Some endpoints use real data, others use mocks

## Overview

This document tracks the migration from mock analytics data to real Supabase queries across the application.

## Completed - Real Data ✅

### 1. Share Analytics ✅

**Status:** Using real Supabase queries

**Files:**
- `web/app/api/share/route.ts`

**Implementation:**
- ✅ POST endpoint inserts real events into `analytics_events` table
- ✅ GET endpoint queries real data from `analytics_events` table
- ✅ Supports filtering by platform, poll_id, and date range
- ✅ Returns aggregated share metrics

**Data Source:**
- Table: `analytics_events`
- Event type: `share`
- Fields: `event_type`, `event_data`, `created_at`, `user_id`

### 2. Analytics Store ✅

**Status:** Has methods for real data fetching

**Files:**
- `web/lib/stores/analyticsStore.ts`

**Implementation:**
- ✅ `fetchDemographics()` - Fetches from Supabase (with fallback)
- ✅ `fetchTrends()` - Fetches from Supabase (with fallback)
- ✅ `fetchTemporal()` - Fetches from Supabase (with fallback)
- ✅ `fetchPollHeatmap()` - Fetches from Supabase (with fallback)
- ✅ `fetchTrustTierComparison()` - Fetches from Supabase (with fallback)

**Note:** These methods have fallback functions but are designed to use real data when available.

## Remaining - Mock Data ⚠️

### 1. AnalyticsPanel Component ✅

**Status:** Now uses real data

**File:**
- `web/components/lazy/AnalyticsPanel.tsx`

**Implementation:**
- ✅ Replaced mock data with API calls to `/api/analytics/dashboard`
- ✅ Fetches real data from Supabase:
  - User growth: Queries `user_profiles` table with date grouping
  - Poll activity: Queries `polls` and `votes` tables
  - Voting methods: Queries `polls` table for voting method distribution
  - System performance: Placeholder (would integrate with monitoring)
- ✅ Added loading and error states
- ✅ Supports date range filtering via query parameter

**API Endpoint:**
- `/api/analytics/dashboard` - Returns aggregated analytics data

### 2. Admin Dashboard Analytics ✅

**Status:** Now uses real data

**File:**
- `web/app/api/admin/dashboard/route.ts`

**Implementation:**
- ✅ Replaced mock data with real Supabase queries
- ✅ `loadAdminAnalytics()` function now:
  - Queries `user_profiles` for user growth (last 7 days)
  - Queries `polls` and `votes` for poll activity
  - Queries `polls` for top categories with vote counts
  - Aggregates data by date
  - Groups by category and counts polls/votes
- ✅ Maintains caching (10 minutes TTL)
- ✅ Error handling with fallback to empty arrays

**Privacy:**
- ✅ Uses admin Supabase client (respects RLS)
- ✅ Only aggregates data (no individual user info)
- ✅ Date range limited to 7 days

## Implementation Status

### Phase 1: Admin Dashboard Analytics ✅ COMPLETE

1. ✅ **Updated `loadAdminAnalytics()` function**
   - Replaced mock data with real Supabase queries
   - Added date range support (7 days)
   - Added error handling with fallbacks
   - Maintained caching (10 minutes TTL)

2. ✅ **Added aggregation queries**
   - User growth by date (cumulative)
   - Poll activity by date (polls and votes)
   - Top categories with poll/vote counts

3. ✅ **Added privacy filters**
   - Admin-only access (uses admin Supabase client)
   - Only aggregates data (no individual user info)
   - Date range limited to 7 days

### Phase 2: AnalyticsPanel Component ✅ COMPLETE

1. ✅ **Created `/api/analytics/dashboard` endpoint**
   - Aggregates user growth data from `user_profiles`
   - Aggregates poll activity data from `polls` and `votes`
   - Aggregates voting methods data from `polls`
   - Returns system performance metrics (placeholder)

2. ✅ **Updated AnalyticsPanel component**
   - Replaced mock data with API calls
   - Added loading states
   - Added error handling
   - Supports date range filtering via query parameter

3. ⚠️ **Real-time updates** (Future enhancement)
   - Consider WebSocket or polling for live updates
   - Add refresh button
   - Add auto-refresh option

### Phase 3: Enhanced Analytics (Low Priority)

1. **Add more analytics endpoints**
   - User engagement metrics
   - Poll performance metrics
   - Voting patterns
   - Geographic distribution (if available)

2. **Add analytics dashboard UI**
   - Charts and visualizations
   - Date range picker
   - Export functionality
   - Real-time updates

## Privacy & Security Considerations

### Data Privacy

1. **User Data Anonymization**
   - Aggregate user data (don't expose individual user info)
   - Use date ranges and groupings
   - Remove PII from analytics data

2. **RLS Policies**
   - Ensure analytics queries respect RLS
   - Admin endpoints should use service role key
   - Public endpoints should use anon key with proper RLS

3. **Data Retention**
   - Consider data retention policies
   - Archive old analytics data
   - Clean up expired data

### Security

1. **Access Control**
   - Admin analytics: Require admin authentication
   - Public analytics: Use RLS policies
   - Rate limit analytics endpoints

2. **Query Performance**
   - Add indexes on frequently queried columns
   - Use caching for expensive queries
   - Limit date ranges to prevent slow queries

## Database Schema

### Existing Tables

- `analytics_events` - Event tracking table
  - Fields: `id`, `event_type`, `event_data`, `user_id`, `created_at`
  - Used for: Share events, user actions, errors

- `user_profiles` - User profile data
  - Fields: `user_id`, `created_at`, `updated_at`
  - Used for: User growth metrics

- `polls` - Poll data
  - Fields: `id`, `created_at`, `category`, `voting_method`
  - Used for: Poll activity, voting methods, categories

- `votes` - Vote data
  - Fields: `id`, `poll_id`, `created_at`
  - Used for: Vote counts, poll activity

### Required Indexes

```sql
-- For user growth queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- For poll activity queries
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at);
CREATE INDEX IF NOT EXISTS idx_polls_category ON polls(category);

-- For vote counts
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);

-- For analytics events
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created ON analytics_events(event_type, created_at);
```

## Related Documentation

- `docs/ROADMAP_SINGLE_SOURCE.md` - Main roadmap (P1: Analytics real data)
- `web/app/api/share/route.ts` - Example of real analytics implementation
- `web/lib/stores/analyticsStore.ts` - Analytics store with real data methods

## Next Steps

1. **Immediate:** Update admin dashboard analytics to use real data
2. **Short-term:** Create analytics dashboard API endpoint
3. **Medium-term:** Update AnalyticsPanel component to use real data
4. **Long-term:** Add enhanced analytics features and visualizations

