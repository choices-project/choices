# Hashtags Feature

**Last Updated**: November 3, 2025  
**Status**: ✅ Operational  
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

---

## RPC Functions

- `update_hashtag_trending_scores()` - Updates trending scores
- `get_hashtag_trending_history(p_hashtag_id)` - Historical trending data

---

_Hashtag system for content organization_

