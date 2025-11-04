# Hashtags Feature

**Last Updated**: November 03, 2025  
**Status**: ✅ Operational (Notifications added Nov 2025)  
**Location**: `/web/features/hashtags`

---

## Implementation

### Components (16 files)
- `features/hashtags/components/HashtagTrending.tsx` - Trending hashtags
- `features/hashtags/components/HashtagManagement.tsx` - User hashtag management
- `features/hashtags/components/HashtagModeration.tsx` - Admin moderation

### Services
- `features/hashtags/lib/hashtag-service.ts` - Core hashtag operations
- `features/hashtags/lib/hashtag-moderation.ts` - Moderation system
- `features/hashtags/lib/hashtag-suggestions.ts` (462 lines) - Suggestion engine
- `features/hashtags/lib/notification-service.ts` (NEW Nov 2025) - Trending notifications

### Store
- `lib/stores/hashtagStore.ts` - Hashtag state (Zustand)

---

## Database

### Tables
- **hashtags** (12 columns)
  - `id`, `name`, `category`, `usage_count`
  - `trending_score`, `follower_count`
  - `is_featured`, `is_trending`, `is_verified`
  
- **user_hashtags** (9 columns)
  - User-followed hashtags
  - `user_id`, `hashtag_id`, `usage_count`
  
- **hashtag_engagement** (7 columns)
  - `user_id`, `hashtag_id`, `engagement_type`
  
- **hashtag_flags** (10 columns)
  - Moderation flags
  
- **hashtag_usage** (6 columns)
  - Usage tracking

---

## API Endpoints

### `GET /api/hashtags`
List hashtags
- Query: `?trending=true&limit=20`

### `POST /api/hashtags`
Create hashtag
- Auth: Required

### `GET /api/cron/hashtag-trending-notifications`
Cron job - Notify followers of trending hashtags
- Auth: CRON_SECRET bearer token
- Runs: Every 2 hours (configurable)
- Anti-spam: Max 1 notification per hashtag per user per 24h

---

## Notifications

### Trending Alerts (NEW - Nov 2025)
**Feature**: Users receive notifications when followed hashtags trend

**Flow**:
1. Cron job runs every 2 hours
2. Finds hashtags that recently became trending
3. For each trending hashtag, finds followers
4. Creates notification for each follower (24h cooldown)
5. Notification includes: hashtag name, trending score, usage count
6. Links to `/hashtags/[name]` page

**Implementation**:
- Cron endpoint: `/api/cron/hashtag-trending-notifications`
- Service: `features/hashtags/lib/notification-service.ts`
- Functions: `notifyHashtagTrending()`, `shouldNotifyHashtagTrending()`
- Uses existing `notifications` table
- Integrates with `notificationStore` (Zustand)

**Setup**:
```bash
# Add to .env.local
CRON_SECRET=your_secure_random_string

# Configure Vercel cron (vercel.json):
# "crons": [{ "path": "/api/cron/hashtag-trending-notifications", "schedule": "0 */2 * * *" }]
```

---

## RPC Functions

- `update_hashtag_trending_scores()` - Updates trending scores
- `get_hashtag_trending_history(p_hashtag_id)` - Historical trending data

---

_Hashtag system for content organization_

