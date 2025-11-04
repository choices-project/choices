# Archived: analytics-service.ts (Legacy)

**Archived**: November 04, 2025  
**Reason**: Replaced by EnhancedAnalyticsService  
**Migration**: All imports migrated to use EnhancedAnalyticsService

## What Was This?

Legacy analytics service that directly queried database tables for:
- Poll analytics (`getPollAnalytics`)
- User analytics (`getUserAnalytics`)  
- Analytics summary (`getAnalyticsSummary`)
- Recording poll analytics (`recordPollAnalytics`)
- Trust tier calculations

## Why Replaced?

1. **New RPC Functions**: EnhancedAnalyticsService uses Supabase RPC functions for better performance
2. **Better Architecture**: Modern service with enhanced capabilities
3. **Backward Compatibility**: EnhancedAnalyticsService includes all legacy methods
4. **Consolidation**: Reduces redundancy in analytics layer

## Migration Details

All 7 imports updated to use EnhancedAnalyticsService:
- `lib/services/analytics/index.ts` - Barrel export updated
- `lib/core/services/analytics/index.ts` - Barrel export updated
- `app/api/analytics/route.ts` - Direct import updated
- `app/api/analytics/poll/[id]/route.ts` - Updated with supabase client
- `app/api/analytics/summary/route.ts` - Updated with supabase client
- `app/api/analytics/user/[id]/route.ts` - Updated with supabase client
- `app/api/polls/[id]/vote/route.ts` - Updated analytics recording

## Code Stats

- **Lines**: 600
- **Methods**: 11 (getPollAnalytics, getUserAnalytics, getAnalyticsSummary, etc.)
- **Dependencies**: Supabase direct queries, logger, types

## Replacement

`features/analytics/lib/enhanced-analytics-service.ts` now provides:
- All legacy methods (backward compatible)
- New RPC-based methods (`getComprehensiveAnalytics`, `detectBotBehavior`, etc.)
- Singleton pattern with getInstance()
- Better error handling and fallbacks

