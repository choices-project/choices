# Feeds Store Telemetry Integration

**Last Updated:** January 2025  
**Store:** `lib/stores/feedsStore.ts`

## Overview

The feeds store integrates with privacy-respecting telemetry to track user engagement with feed content. All telemetry respects user privacy consent settings.

## Telemetry Events

### Feed Interactions

The feeds store tracks the following user interactions:

1. **Feed Read** - When a user reads a feed item
   - Event: `feed_read`
   - Metadata: `{ feedId, category, source }`
   - Privacy: Requires `FEED_ANALYTICS` consent

2. **Feed Like** - When a user likes a feed item
   - Event: `feed_like`
   - Metadata: `{ feedId, category }`
   - Privacy: Requires `FEED_ANALYTICS` consent

3. **Feed Bookmark** - When a user bookmarks a feed item
   - Event: `feed_bookmark`
   - Metadata: `{ feedId, category }`
   - Privacy: Requires `FEED_ANALYTICS` consent

4. **Feed Share** - When a user shares a feed item
   - Event: `feed_share`
   - Metadata: `{ feedId, category, shareMethod }`
   - Privacy: Requires `FEED_ANALYTICS` consent

## Privacy Integration

All telemetry events check privacy consent before tracking:

```typescript
if (!hasPrivacyConsent(PrivacyDataType.FEED_ANALYTICS)) {
  logger.debug('Feed interaction not tracked - privacy consent missing.');
  return;
}
```

### Privacy Data Types

- `FEED_ANALYTICS` - Required for feed interaction tracking
- `USER_BEHAVIOR` - Required for aggregated behavior analytics

## Implementation Details

### Feed Read Tracking

Located in `feedsStore.ts`:
- Method: `markFeedAsRead`
- Checks: `hasPrivacyConsent(PrivacyDataType.FEED_ANALYTICS)`
- Logs: `logger.debug('Feed read tracking skipped - no user consent', { feedId })`

### Feed Like Tracking

Located in `feedsStore.ts`:
- Method: `likeFeed`
- Checks: `hasPrivacyConsent(PrivacyDataType.FEED_ANALYTICS)`
- Logs: `logger.debug('Feed like not tracked - no user consent', { feedId })`

## Success Toast Analytics Wiring

**Status:** ✅ Complete (January 2026)

The feeds store uses `showFeedSuccessToast()` (which checks `hasFeedActivityConsent`) and `notificationStoreUtils.createSuccess()` for:

- **Feed successfully loaded** — `loadFeeds` success handler
- **Feed refresh completed** — `refreshFeeds` success handler

Toast display is gated by `hasFeedActivityConsent(privacySettings)`. See `feedsStore.ts` (`showFeedSuccessToast`, `loadFeeds`, `refreshFeeds`).

## Testing

### Unit Tests

Test privacy consent checks:
```typescript
it('skips tracking when privacy consent missing', () => {
  // Mock hasPrivacyConsent to return false
  // Verify logger.debug is called with skip message
  // Verify no analytics event is emitted
});
```

### Integration Tests

Test full telemetry flow:
```typescript
it('tracks feed read with privacy consent', async () => {
  // Grant privacy consent
  // Mark feed as read
  // Verify analytics event is emitted
});
```

## Configuration

Telemetry can be configured via:
- User privacy settings (per data type)
- Feature flags (if needed)
- Environment variables (for development)

## Future Enhancements

1. **Aggregated Analytics**
   - Daily/weekly feed engagement summaries
   - Category preferences analysis
   - Source effectiveness metrics

2. **Real-time Telemetry**
   - WebSocket-based event streaming
   - Live dashboard updates

3. **Advanced Privacy Controls**
   - Granular consent per event type
   - Time-based consent expiration
   - Anonymization options

---

**Document Owner:** Engineering Team  
**Last Updated:** January 2025

