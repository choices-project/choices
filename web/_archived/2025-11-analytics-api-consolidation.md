# Archived: Analytics API Consolidation

**Archived**: November 04, 2025  
**Reason**: Consolidated to single enhanced-unified endpoint  
**Migration**: All callers updated to use `/api/analytics/enhanced-unified/[id]`

## What Was Archived?

### 1. `/api/analytics/unified/[id]/route.ts` (927 lines)
- **Created**: 2025-10-26
- **Purpose**: Comprehensive unified analytics with Redis caching
- **Features**: AI providers, all analytics methods, caching
- **Used by**: 4 components (auth-analytics, analyticsStore x2, AIHealthStatus)
- **Replaced by**: enhanced-unified (merged all features)

### 2. `/api/analytics/poll/[id]/route.ts` (40 lines)
- **Purpose**: Get poll-specific analytics
- **Method**: `AnalyticsService.getPollAnalytics(pollId)`
- **Redundant**: Main route.ts handles `?type=poll&id=...`
- **Replaced by**: enhanced-unified or route.ts

### 3. `/api/analytics/summary/route.ts` (28 lines)
- **Purpose**: Get analytics summary
- **Method**: `AnalyticsService.getAnalyticsSummary()`
- **Redundant**: Main route.ts handles `?type=summary`
- **Replaced by**: enhanced-unified or route.ts

### 4. `/api/analytics/user/[id]/route.ts` (40 lines)
- **Purpose**: Get user-specific analytics
- **Method**: `AnalyticsService.getUserAnalytics(userId)`
- **Redundant**: Main route.ts handles `?type=user&id=...`
- **Replaced by**: enhanced-unified or route.ts

## Why Consolidated?

1. **Duplicate Code**: unified and enhanced-unified did the same thing (1,626 lines)
2. **Better Architecture**: enhanced-unified uses new RPC functions + has Redis caching now
3. **Confusion**: 7 analytics routes when 2 would suffice
4. **Maintenance**: Each route needed updates for schema changes

## Current Analytics API Structure

### Active Routes:

1. **`/api/analytics/route.ts`** - General analytics, public stats
   - GET with type parameter (public, summary, poll, user)
   - Handles basic queries without AI/complex analysis

2. **`/api/analytics/enhanced-unified/[id]/route.ts`** - Comprehensive poll analytics
   - All analytics methods (sentiment, bot-detection, temporal, trust-tier, geographic, comprehensive, enhanced)
   - AI provider selection + fallbacks
   - Redis caching with configurable TTL
   - New schema RPC functions
   - Performance monitoring

3. **`/api/analytics/enhanced/route.ts`** - Admin dashboard analytics
   - GET: Dashboard, poll, trust-tier, bot-detection, system-health, site-messages
   - POST: Track sessions, features, metrics, health
   - Specialized for admin UI

## Migration Changes

### Code Updates (4 files):
1. `features/analytics/lib/auth-analytics.ts`
   - `/api/analytics/unified/auth-events` → `/api/analytics/enhanced-unified/auth-events`
   - Added `use-new-schema=true`

2. `lib/stores/analyticsStore.ts` (2 endpoints)
   - `/api/analytics/unified/events` → `/api/analytics/enhanced-unified/events`
   - `/api/analytics/unified/report` → `/api/analytics/enhanced-unified/report`
   - Added `use-new-schema=true`

3. `components/business/analytics/AIHealthStatus.tsx`
   - `/api/analytics/unified/health` → `/api/analytics/enhanced-unified/health`
   - Added `use-new-schema=true`

### Service Updates:
- `EnhancedAnalyticsService` now includes legacy compatibility methods
- Added getInstance() singleton pattern
- Added getPollAnalytics(), getUserAnalytics(), getAnalyticsSummary(), recordPollAnalytics()

## Code Reduction

- **Archived**: 1,035 lines (927 + 40 + 28 + 40)
- **Enhanced**: enhanced-unified route.ts with Redis caching
- **Net**: Cleaner API surface with better functionality

