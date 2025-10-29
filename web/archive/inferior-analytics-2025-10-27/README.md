# Archived Inferior Analytics Files

**Archived Date:** October 27, 2025  
**Reason:** Replaced with superior features-based implementation

## Archived Files

### 1. `enhanced-analytics.ts`
- **Original Location:** `/web/lib/services/enhanced-analytics.ts`
- **Replaced By:** `/web/features/analytics/lib/enhanced-analytics-service.ts`
- **Why Archived:** 
  - Was a standalone service not integrated with existing analytics
  - Didn't follow the features organization structure
  - Lacked integration with existing analytics hooks and stores
  - New version provides seamless integration with existing system

### 2. `EnhancedAdminDashboard.tsx`
- **Original Location:** `/web/components/admin/EnhancedAdminDashboard.tsx`
- **Replaced By:** `/web/features/analytics/components/EnhancedAnalyticsDashboard.tsx`
- **Why Archived:**
  - Was a standalone component not following features organization
  - Didn't integrate with existing analytics system
  - New version provides better integration and follows proper structure

## New Implementation Benefits

The new enhanced analytics implementation provides:

1. **Seamless Integration**: Works with existing analytics without breaking changes
2. **Features Organization**: Properly organized within `/features/analytics/`
3. **Backward Compatibility**: Falls back to existing analytics if new schema fails
4. **Enhanced Capabilities**: Leverages new schema functions (`detect_bot_behavior`, `calculate_trust_filtered_votes`, `get_comprehensive_analytics`)
5. **Session Tracking**: Real-time session analytics using `user_sessions` table
6. **Feature Usage**: Tracks feature adoption using `feature_usage` table
7. **System Health**: Monitors system health using `system_health` table
8. **Site Messages**: Manages active site messages using `site_messages` table

## Migration Notes

- All existing analytics functionality is preserved
- New enhanced capabilities are additive, not replacing
- API endpoints maintain backward compatibility
- Components can be gradually migrated to use enhanced features
- No breaking changes to existing code

## Files to Reference

- **Enhanced Service:** `/web/features/analytics/lib/enhanced-analytics-service.ts`
- **Enhanced Hook:** `/web/features/analytics/hooks/useEnhancedAnalytics.ts`
- **Enhanced Dashboard:** `/web/features/analytics/components/EnhancedAnalyticsDashboard.tsx`
- **Enhanced API:** `/web/app/api/analytics/enhanced-unified/[id]/route.ts`
- **Feature Index:** `/web/features/analytics/index.ts`


