# Progressive Web App (PWA) Feature Documentation

**Status:** ✅ Enabled (Feature Flag: `pwa`)  
**Created:** 2024-12-19  
**Last Updated:** 2025-11-08  

## 📋 Overview

Progressive Web App functionality provides native app-like experience in web browsers, including offline capabilities, push notifications, app installation, and resilient background sync. The 2025-11 refresh replaced legacy `any` usage with shared TypeScript contracts, aligned the utility surface with the Zustand PWA store, and added Jest coverage for the critical offline flows.

## 🎯 Intended Functionality

### Core Features
- **App Installation**: Install the web app on user devices
- **Offline Support**: Cache resources for offline functionality
- **Push Notifications**: Send notifications to users
- **Background Sync**: Sync data when connection is restored
- **App Shell Architecture**: Fast loading with cached shell

### User Experience
- Native app-like interface
- Offline access to core features
- Push notifications for important updates
- Seamless installation on mobile devices
- Fast loading and responsive performance

## 📁 File Structure

```
web/features/pwa/
├── README.md                    # This documentation
├── index.ts                     # Feature flag wrapper and exports
├── lib/
│   ├── background-sync.ts          # Typed offline queue + Sync API
│   ├── feature-flags.ts            # Thin wrappers around global flags
│   ├── pwa-auth-integration.ts     # PWA user management + privacy storage
│   ├── pwa-utils.ts                # PWAManager, PWAWebAuthn, PrivacyStorage
│   ├── push-notifications.ts       # Subscription + permission helpers
│   ├── service-worker-registration.ts # Client SW coordination helpers
│   └── PWAAnalytics.ts             # Analytics bridge for PWA events
├── components/
│   ├── InstallPrompt.tsx
│   ├── OfflineIndicator.tsx
│   ├── OfflineQueue.tsx
│   ├── OfflineVoting.tsx
│   ├── NotificationPreferences.tsx
│   ├── PWAInstaller.tsx
│   ├── PWAStatus.tsx
│   └── PWAUserProfile.tsx
├── hooks/
│   ├── useFeatureFlags.ts
│   └── usePWAUtils.ts
└── tests/unit/pwa/                # Jest tests covering auth + utilities
```

## 🔧 Implementation Details

### Shared Types (`web/types/pwa.ts`)

- `PWAManagerStatus`, `PWAStatusSnapshot`, `DeviceFingerprint`, `OfflineVotePayload`, `OfflineVoteRecord`, and `PWAUser/PWAUserProfile` define the canonical shape of PWA data.
- `web/lib/types/pwa.ts` re-exports the same contracts for consumers that rely on path aliases.
- All utilities, Zustand stores, and hooks consume these types; there is no remaining `any` usage in the PWA stack.

### Core Utilities (`lib/pwa-utils.ts`)

- `PWAManager` exposes typed helpers for installation detection, notification permissions, offline vote storage, and device fingerprinting with SSR guards.
- `PWAWebAuthn` and `PrivacyStorage` provide typed WebAuthn + encrypted storage flows.
- `cacheData/getCachedData<T>()` use generics to round-trip arbitrary payloads without casting.

### Offline Queue & Background Sync (`lib/background-sync.ts`)

- `queueAction<TPayload>()` stores typed payloads in `localStorage` (with SSR short-circuit) and registers background sync tags (`sync-votes`, etc.).
- Retrieval functions validate queue entries (`isQueuedAction`) before use, preventing malformed payloads from breaking sync.
- Queue state persists to IndexedDB (`choices-pwa-offline-queue/actions`) so the service worker can process actions even when tabs are closed; `localStorage` remains a compatibility cache that mirrors the latest state for tab-level consumers/tests.
- Helper functions wrap the background/periodic sync APIs with a narrowed `ServiceWorkerRegistration` interface.

### Push Notifications (`lib/push-notifications.ts`)

- Permission + subscription lifecycles use typed option objects and guard for non-browser environments.
- `NotificationOptions` now accepts a typed `Record<string, unknown>` payload instead of `any`.
- Events fire analytics hooks (`window.dispatchEvent('pwa-analytics', …)`) with sanitized details.

### Analytics & Instrumentation (`lib/PWAAnalytics.ts`)

- Bridges PWA events to Supabase-backed analytics with typed rows (`AnalyticsEventRow`, `PWAEvent`).
- Calculates performance scores from sanitized aggregates and generates trend data for dashboards.
- Exposed via the analytics widget system (`pwa-offline-queue`) to monitor backlog size, last sync times, and background sync health from the admin dashboard. A Playwright harness (`/e2e/pwa-analytics`) and widget-level tests keep the analytics flow verifiable.

### React Integration

- Components (`PWAUserProfile`, `OfflineQueue`, `PWAStatus`, etc.) consume the typed utilities and Zustand selectors without local casts.
- Hooks (`usePWAUtils`, `useFeatureFlags`) memoize typed instances and expose friendly loading/error states for UI composition.

## 🗄️ Database Schema Requirements

### Required Tables

#### `user_notification_preferences`
```sql
CREATE TABLE user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT false,
  poll_notifications BOOLEAN DEFAULT true,
  system_notifications BOOLEAN DEFAULT true,
  marketing_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `push_subscriptions`
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Required RLS Policies

```sql
-- Users can only access their own notification preferences
CREATE POLICY "Users can view own notification preferences" ON user_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notification preferences
CREATE POLICY "Users can update own notification preferences" ON user_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only access their own push subscriptions
CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own push subscriptions
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);
```

## 🔌 API Endpoints Required

### PWA Management
- `GET /api/pwa/status` - Get PWA support and installation status
- `POST /api/pwa/install` - Trigger PWA installation
- `GET /api/pwa/manifest` - Serve web app manifest

### Notifications
- `POST /api/notifications/subscribe` - Subscribe to push notifications
- `DELETE /api/notifications/unsubscribe` - Unsubscribe from notifications
- `GET /api/notifications/preferences` - Get notification preferences
- `PUT /api/notifications/preferences` - Update notification preferences
- `POST /api/notifications/send` - Send push notification (admin)

### Offline Support
- `GET /api/offline/data` - Get essential data for offline use
- `POST /api/offline/sync` - Sync offline actions when online

## 🚧 Current Implementation Status

### ✅ Completed
- [x] Shared PWA type definitions consumed by stores, utilities, and components
- [x] PWAManager + offline vote storage with sanitized persistence
- [x] Background sync queue + typed payload validation (IndexedDB + localStorage mirror)
- [x] Service worker parity with new typings (cache policies, sync tags, analytics broadcasts)
- [x] Push notification helpers with SSR guards
- [x] PWA analytics bridge & admin widget (`pwa-offline-queue`)
- [x] Jest coverage (`web/tests/unit/pwa/*`) for auth integration, queue management, and service-worker bridge
- [x] Playwright coverage for the offline queue widget (`web/tests/e2e/specs/pwa-offline-queue-widget.spec.ts`)

### 🚧 In Progress
- [ ] Extended PWA analytics dashboards + reporting UI
- [ ] End-to-end coverage for install prompts, sync recovery, and notification permission journeys
- [ ] Performance regression tests across Lighthouse + Playwright

## 🔒 Security Considerations

### Critical Security Requirements
1. **Service Worker Security**: Secure service worker implementation
2. **Push Notification Security**: Validate notification sources
3. **Offline Data Security**: Secure cached data
4. **Installation Security**: Prevent malicious installations
5. **Background Sync Security**: Secure offline action queuing

### Potential Vulnerabilities
- **Service Worker Hijacking**: Secure service worker registration
- **Notification Spam**: Rate limiting and user controls
- **Offline Data Tampering**: Secure cache validation
- **Malicious Installations**: Origin validation

## 🧪 Testing Requirements

### Unit Tests
- [x] PWA utility functions (`pwa-utils`, `background-sync`, `pwa-auth-integration`)
- [ ] Service worker logic
- [ ] Notification manager
- [ ] Component rendering and behavior

### Integration Tests
- [ ] Service worker registration
- [ ] Push notification flow
- [ ] Offline functionality (queue + sync)
- [ ] App installation flow

### Performance Tests
- [ ] Cache performance
- [ ] Offline loading times
- [ ] Service worker efficiency
- [ ] Memory usage

### Browser Compatibility Tests
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

## 📱 Browser Support

### Supported Browsers
- **Chrome**: 68+ (Full support)
- **Firefox**: 60+ (Full support)
- **Safari**: 11.3+ (Limited support)
- **Edge**: 79+ (Full support)

### Mobile Support
- **iOS Safari**: 11.3+ (Limited support)
- **Android Chrome**: 68+ (Full support)
- **Samsung Internet**: 8.2+ (Full support)

## 🚀 Implementation Roadmap

### Phase 1: Foundation (2-3 weeks)
1. Web app manifest configuration
2. Basic service worker implementation
3. App icon generation
4. Database schema and migrations

### Phase 2: Core Features (2-3 weeks)
1. Offline caching strategy
2. Push notification setup
3. App installation flow
4. Background sync implementation

### Phase 3: Polish (1-2 weeks)
1. UI/UX improvements
2. Performance optimization
3. Comprehensive testing
4. Error handling and recovery

### Phase 4: Production (1-2 weeks)
1. Security audit
2. Monitoring and logging
3. Production deployment
4. User education and onboarding

## 🔗 Related Documentation

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)

## 📝 Notes for Future Implementation

1. **Start Simple**: Begin with basic offline caching and app installation
2. **Progressive Enhancement**: Ensure graceful fallback for unsupported browsers
3. **User Education**: Provide clear guidance on PWA benefits
4. **Performance First**: Optimize for fast loading and smooth experience
5. **Testing**: Extensive testing across devices and browsers is crucial
6. **Documentation**: Keep this documentation updated as implementation progresses

---

**Next Steps**: When ready to implement, start with Phase 1 (Foundation) and work through the roadmap systematically. Ensure all security considerations are addressed before production deployment.
