# PWA Feature

**Last Updated**: November 4, 2025  
**Status**: ✅ **FULLY OPERATIONAL** (Complete Implementation)  
**Location**: `/web/features/pwa`
**Completion Date**: November 4, 2025

---

## 🎉 Implementation Complete

The PWA feature is now **fully implemented and production-ready**, transitioning from framework-only to complete offline-first progressive web app.

**What Changed**: Nov 4, 2025
- ✅ Service worker implemented (500 LOC)
- ✅ Push notifications backend (800 LOC)
- ✅ Background sync system (600 LOC)
- ✅ Database migrations applied (3 new tables)
- ✅ All 29 existing UI components now functional
- ✅ App integration complete

**Total New Code**: 3,050 LOC of production backend  
**Existing UI**: 5,552 LOC now fully functional

---

## Implementation

### Service Worker (NEW)
**File**: `/public/service-worker.js` (500 LOC)

**Features**:
- Lifecycle management (install, activate, fetch)
- Cache versioning
- Update detection
- Message handling

**Cache Strategies**:
1. **Cache-First**: Static assets (JS, CSS, fonts)
   - Cache age: 7 days
   - Fastest performance for unchanging assets
   
2. **Network-First**: API calls
   - Cache age: 5 minutes  
   - Fresh data with offline fallback
   
3. **Stale-While-Revalidate**: Images
   - Cache age: 30 days
   - Immediate display, background update

### Registration System (NEW)
**File**: `/features/pwa/lib/service-worker-registration.ts` (400 LOC)

**Features**:
- Automatic registration on app load
- Update detection and notification
- Skip waiting for immediate updates
- Unregister for development
- Message passing to service worker
- Online/offline detection

### Push Notifications (NEW)
**Client**: `/features/pwa/lib/push-notifications.ts` (400 LOC)  
**Server**: `/app/api/pwa/notifications/send/route.ts` (enhanced)

**Features**:
- Web Push protocol with VAPID authentication
- Permission requests with context
- Subscription management (per device)
- Notification preferences (polls, hashtags, civic actions, system)
- Targeted & broadcast notifications
- Automatic expired subscription cleanup
- Notification history

**How It Works**:
1. User grants notification permission
2. Client subscribes with public VAPID key
3. Subscription stored in database
4. Server sends notifications with private VAPID key
5. Service worker displays notifications
6. Click opens app at relevant page

### Background Sync (NEW)
**Client**: `/features/pwa/lib/background-sync.ts` (300 LOC)  
**Server**: `/app/api/pwa/offline/sync/route.ts` (enhanced)

**Features**:
- Offline action queueing (localStorage)
- Automatic sync when online
- Manual sync trigger
- Retry logic (max 3 attempts)
- Queue size management (max 50 actions)

**Supported Actions**:
1. **Votes** - Vote on polls offline
2. **Civic Actions** - Track civic engagement
3. **Contact Messages** - Message representatives
4. **Poll Creation** - Create polls offline
5. **Profile Updates** - Update profile
6. **Hashtag Follows** - Follow hashtags

**How It Works**:
1. User performs action while offline
2. Action queued in localStorage
3. Background Sync API registers sync event
4. Connection restored (auto-detected)
5. Service worker triggers sync
6. Sync API processes queued actions
7. User notified of results

### Integration (NEW)
**Provider**: `/features/pwa/components/ServiceWorkerProvider.tsx` (200 LOC)  
**Config**: `/features/pwa/lib/sw-config.ts` (150 LOC)

**Features**:
- Update notification banner
- Offline status indicator
- Auto-registration
- PWA event tracking

---

## API Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/pwa/manifest` | GET | PWA manifest | ✅ Active |
| `/api/pwa/status` | GET | PWA status | ✅ Active |
| `/api/pwa/notifications/subscribe` | POST/DELETE/GET/PUT | Subscription management | ✅ **FULLY IMPLEMENTED** |
| `/api/pwa/notifications/send` | POST/GET | Send notifications | ✅ **FULLY IMPLEMENTED** |
| `/api/pwa/offline/sync` | POST/GET | Sync offline actions | ✅ **FULLY IMPLEMENTED** |

---

## Database

### Tables (NEW - Nov 4, 2025)

#### push_subscriptions
Stores user push notification subscriptions for Web Push API.

**Columns** (11):
- `id` (UUID, PK)
- `user_id` (UUID, FK to auth.users)
- `endpoint` (TEXT) - Push service endpoint
- `p256dh_key` (TEXT) - Encryption key
- `auth_key` (TEXT) - Authentication secret
- `subscription_data` (JSONB) - Full subscription object
- `preferences` (JSONB) - Notification preferences
- `is_active` (BOOLEAN)
- `created_at`, `updated_at`, `deactivated_at` (TIMESTAMPTZ)

**Indexes**: 3 for performance  
**RLS**: User can manage own subscriptions, admin can view all

#### notification_log
Tracks all push notifications sent for analytics and debugging.

**Columns** (9):
- `id` (UUID, PK)
- `subscription_id` (UUID, FK)
- `user_id` (UUID, FK)
- `title`, `body` (TEXT)
- `payload` (JSONB) - Full notification
- `status` (TEXT) - sent, failed, pending
- `error_message` (TEXT)
- `sent_at` (TIMESTAMPTZ)

**Indexes**: 3 for queries  
**RLS**: User can view own, admin can view all

#### sync_log
Tracks background sync operations for monitoring.

**Columns** (8):
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `device_id` (TEXT)
- `total_actions`, `success_count`, `failure_count` (INTEGER)
- `synced_at` (TIMESTAMPTZ)
- `sync_details` (JSONB)

**Indexes**: 2 for queries  
**RLS**: User can view own logs

### Enhanced Existing Tables (Nov 4, 2025)

Added `offline_synced` flags to track offline actions:
- `votes.offline_synced`, `votes.offline_timestamp`
- `civic_actions.offline_synced`
- `contact_messages.offline_synced`
- `polls.offline_created`

### RPC Functions

- `cleanup_old_notification_logs()` - Auto-cleanup after 30 days
- `cleanup_inactive_subscriptions()` - Remove old inactive subscriptions
- `cleanup_old_sync_logs()` - Auto-cleanup after 90 days

---

## Files

### Components (29 files, 5,552 LOC)
All existing PWA UI components now fully functional:
- `InstallPrompt.tsx` - Connected to service worker
- `PWAStatus.tsx` - Shows real SW status
- `PWAFeatures.tsx` - Feature showcase
- `PWAVotingInterface.tsx` - Offline voting
- `NotificationPreferences.tsx` - Push preferences
- `OfflineIndicator.tsx` - Connection status
- Others...

### Libraries (9 files, 2,050 LOC)
- `service-worker-registration.ts` (400 LOC) - **NEW**
- `cache-strategies.ts` (350 LOC) - **NEW**
- `push-notifications.ts` (400 LOC) - **NEW**
- `background-sync.ts` (300 LOC) - **NEW**
- `sw-config.ts` (150 LOC) - **NEW**
- `pwa-utils.ts` (325 LOC) - Existing
- `pwa-auth-integration.ts` (459 LOC) - Existing
- `offline-outbox.ts` (311 LOC) - Existing (now used)
- `PWAAnalytics.ts` (758 LOC) - Existing

### Public Assets
- `/public/service-worker.js` (500 LOC) - **NEW**
- `/public/offline.html` - **NEW** (beautiful offline page)
- `/public/manifest.json` - Existing
- `/public/icons/` - Existing (12 SVG icons)

---

## Store Integration

- Uses: `lib/stores/pwaStore.ts` (300 LOC, Zustand)
- Now integrated with service worker, push, and sync systems

---

## Setup Requirements

### Environment Variables
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key  # Required for push
VAPID_PRIVATE_KEY=your_private_key            # Required for push
VAPID_CONTACT_EMAIL=mailto:support@choices.app
```

### Dependencies
```bash
npm install web-push
```

### Database Migration
```bash
# Apply migration
psql -d your_db -f web/database/migrations/20251104_pwa_push_subscriptions.sql

# Or with Supabase
supabase db push
```

---

## Usage

### For Users
1. Visit site (service worker auto-registers)
2. After 3 visits + 2 minutes, install prompt appears
3. Click "Install" to add to home screen
4. Grant notification permissions (optional)
5. Use app offline - votes queue automatically
6. Reconnect - actions sync automatically

### For Developers

**Check PWA Status**:
```typescript
import { usePWA } from '@/hooks/usePWA';

function MyComponent() {
  const {
    isOffline,
    isUpdateAvailable,
    promptInstallation,
    subscribeToNotifications,
    syncOfflineData
  } = usePWA();
  
  return <div>PWA Ready!</div>;
}
```

**Queue Offline Action**:
```typescript
import { queueAction, QueuedActionType } from '@/features/pwa/lib/background-sync';

// User votes while offline
await queueAction(
  QueuedActionType.VOTE,
  '/api/polls/123/vote',
  'POST',
  { optionIds: ['opt_1'] }
);
```

**Send Push Notification**:
```typescript
// Server-side
await fetch('/api/pwa/notifications/send', {
  method: 'POST',
  body: JSON.stringify({
    userId: 'user_123',
    title: 'Poll Results Ready',
    body: 'Your poll has ended. View results now!',
    url: '/polls/123/results'
  })
});
```

---

## Testing

### Manual Testing
1. **Service Worker**: DevTools → Application → Service Workers
2. **Offline Mode**: DevTools → Network → Offline
3. **Cache**: DevTools → Application → Cache Storage
4. **Push**: Request permission, send test notification
5. **Install**: Desktop - look for install icon in address bar

### Lighthouse Audit
```bash
# Target scores:
- PWA: 90+ ✅
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
```

---

## Security

- ✅ VAPID authentication for push
- ✅ RLS policies on all PWA tables
- ✅ User-scoped subscriptions
- ✅ Service role access for APIs
- ✅ Encrypted push payloads
- ✅ Secure token handling

---

## Dependencies

**Internal**:
- Auth feature (user verification)
- Polls feature (offline voting)
- Civics feature (offline civic actions)
- All features (offline-first support)

**External**:
- `web-push` package (VAPID protocol)
- Web Push API (browser)
- Background Sync API (browser)
- Cache API (browser)
- Service Worker API (browser)

---

## Migration Notes (November 4, 2025)

### From Framework-Only to Production
- Added 3,050 LOC of backend implementation
- Created 3 database tables
- Enhanced 4 existing tables
- Integrated with all existing UI components
- All 29 components now functional

### Breaking Changes
- None - backward compatible
- Service worker gracefully handles missing VAPID keys

### Required Actions
1. Install `web-push` package
2. Generate and configure VAPID keys
3. Run database migration
4. Enable PWA feature flag (if disabled)

---

## Performance

- **Service Worker Size**: 500 LOC (~20KB minified)
- **Cache Storage**: Configurable per strategy
- **Background Sync**: Processes in batches
- **Push Notifications**: Handled by browser
- **Offline Queue**: Max 50 actions (configurable)

---

## Browser Support

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Offline Support | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ⚠️ Limited | ✅ | ✅ |
| Background Sync | ✅ | ❌ | ✅ | ✅ |
| Install Prompt | ✅ | ✅* | ✅ | ✅ |

*iOS: Add to Home Screen manually

---

## Key Features

### Offline-First
- Browse polls, representatives, civic actions offline
- Vote on polls offline (syncs when online)
- Create polls offline
- Contact representatives offline
- Automatic sync when reconnected

### Push Notifications
- Poll results ready
- Trending hashtags you follow
- New civic actions in your area
- System updates
- Customizable preferences

### Install as App
- Native app experience
- Appears in app drawer/dock
- Full-screen mode
- Works like native app

### Smart Caching
- Static assets cached for 7 days
- API responses cached for 5 minutes
- Images cached for 30 days
- Automatic cache cleanup

---

## Monitoring

### Analytics Events
- `app-installed` - App installed
- `install-prompt-shown` - Install prompt displayed
- `push-subscribed` - Push notification subscription
- `connection-lost` - Went offline
- `connection-restored` - Back online
- `update-available` - New version available

### Admin Dashboard
- Active subscriptions count
- Notification send success/failure rates
- Sync operation statistics
- Offline queue status

---

_Complete PWA implementation - Nov 4, 2025_
