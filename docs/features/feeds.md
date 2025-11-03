# Feeds Feature

**Last Updated**: November 3, 2025  
**Status**: ✅ Operational  
**Location**: `/web/features/feeds`

---

## Implementation

### Components (12 files)
- `features/feeds/components/UnifiedFeed.tsx` (1,441 lines) - Main feed component
  - Personalization scoring integrated (Nov 2025)
  - Item expansion toggle wired
  - Duplicate helpers removed
- `features/feeds/components/FeedItem.tsx` - Individual feed items
- `features/feeds/components/EnhancedSocialFeed.tsx` - Social feed variant

### Services
- `features/feeds/lib/interest-based-feed.ts` (527 lines) - Personalized feed logic
- `features/feeds/lib/TrendingHashtags.ts` - Trending hashtag integration

### Store
- `lib/stores/feedsStore.ts` - Feed state management (Zustand)

---

## Database

### Tables
- **feeds** (7 columns)
  - `id`, `user_id`, `feed_name`, `feed_type`
  - `content_filters`, `hashtag_filters` (JSONB)
  
- **feed_items** (10 columns)
  - `id`, `feed_id`, `item_type`, `item_data` (JSONB)
  - `poll_id`, `position`, `is_featured`
  
- **feed_interactions** (7 columns)
  - `id`, `user_id`, `feed_id`, `item_id`
  - `interaction_type`, `metadata` (JSONB)

---

## API Endpoints

### `GET /api/feeds`
Get user feeds
- Auth: Required
- Returns: User's personalized feeds

---

## Key Functionality

### Personalization Scoring
**Function**: `calculatePersonalizationScore(item)`
- File: `UnifiedFeed.tsx:702`
- Factors: content type match, hashtag alignment, engagement
- Integrated Nov 2025: Sorts feed by relevance

### Content Filtering
- By content type (polls, civic actions, hashtags)
- By hashtags
- Search query

---

_Content aggregation and personalization_

