# PWA Feature Documentation

**Created:** October 10, 2024  
**Last Updated:** October 16, 2025  
**Feature:** Progressive Web App (PWA)  
**Location:** `web/features/pwa/`  
**Zustand Integration:** ✅ **FULLY IMPLEMENTED** (October 16, 2025)  
**API Integration:** ✅ **COMPLETE** - 5 PWA endpoints with offline support  
**System Date:** October 16, 2025

## Overview

The PWA feature provides comprehensive Progressive Web App capabilities for the Choices platform, enabling app-like experiences with offline functionality, push notifications, and enhanced user engagement.

## Architecture

### Core Components
- **App Installation** - Seamless installation prompts and management
- **Offline Support** - Background sync and offline action queuing
- **Push Notifications** - User engagement and real-time updates
- **Service Worker Integration** - Background processing and caching
- **Enhanced UX** - Mobile-optimized interfaces and interactions

## 🏗️ **Zustand Integration**

### **Migration Status:**
- **Current State:** PWAContext and local PWA state management
- **Target State:** PWAStore integration
- **Migration Guide:** [PWA Migration Guide](../ZUSTAND_PWA_MIGRATION_GUIDE.md)
- **Status:** ✅ **MIGRATION COMPLETE**

### **Zustand Store Integration:**
```typescript
// Import PWAStore for PWA state management
import { 
  usePWAInstallation,
  usePWAOffline,
  usePWAUpdate,
  usePWANotifications,
  usePWAPerformance,
  usePWAPreferences,
  usePWALoading,
  usePWAError,
  usePWAActions,
  usePWAStats,
  useUnreadNotifications,
  useHighPriorityNotifications
} from '@/lib/stores';

// Replace PWAContext with PWAStore
function PWAStatus() {
  const installation = usePWAInstallation();
  const offline = usePWAOffline();
  const update = usePWAUpdate();
  const { installPWA, downloadUpdate } = usePWAActions();
  
  const handleInstall = async () => {
    await installPWA();
  };
  
  const handleCheckUpdates = async () => {
    await downloadUpdate();
  };
  
  return (
    <div>
      <h1>PWA Status</h1>
      <div>Installed: {installation.isInstalled ? 'Yes' : 'No'}</div>
      <div>Can Install: {installation.canInstall ? 'Yes' : 'No'}</div>
      <div>Online: {offline.isOnline ? 'Yes' : 'No'}</div>
      <div>Update Available: {update.isAvailable ? 'Yes' : 'No'}</div>
      {installation.canInstall && !installation.isInstalled && (
        <button onClick={handleInstall}>Install PWA</button>
      )}
      <button onClick={handleCheckUpdates}>Check for Updates</button>
    </div>
  );
}
```

### **Benefits of Migration:**
- **Centralized PWA State:** All PWA data in one store
- **Performance:** Optimized re-renders with selective subscriptions
- **Persistence:** Automatic state persistence across sessions
- **Type Safety:** Comprehensive TypeScript support
- **Consistency:** Same patterns as other features

### Feature Boundaries
- **Internal Scope:** PWA-specific components, hooks, utilities, and types
- **External Dependencies:** Authentication, voting systems, notification services
- **Integration Points:** Service workers, web app manifest, offline storage

## File Organization

### Components (`features/pwa/components/`)
```
├── EnhancedInstallPrompt.tsx      # Advanced installation UI
├── NotificationPermission.tsx      # Permission request handling
├── NotificationPreferences.tsx     # User preference management
├── NotificationSettings.tsx        # Settings configuration
├── OfflineIndicator.tsx            # Connection status display
├── OfflineQueue.tsx               # Action queuing system
├── OfflineSync.tsx                # Synchronization management
├── OfflineVoting.tsx              # Offline voting interface
├── PWABackground.tsx              # Background processing
├── PWAFeatures.tsx                # Feature overview component
├── PWAInstaller.tsx               # Installation manager
├── PWAIntegration.tsx             # Integration coordinator
├── PWAStatus.tsx                  # Status monitoring
├── PWAUserProfile.tsx             # User profile management
├── PWAVotingInterface.tsx         # Voting interface
└── index.ts                       # Component exports
```

### Hooks (`features/pwa/hooks/`)
```
├── useFeatureFlags.ts             # Feature flag management
└── usePWAUtils.ts                 # PWA utility functions
```

### Libraries (`features/pwa/lib/`)
```
├── PWAAnalytics.ts                # Analytics integration
├── feature-flags.ts               # Feature flag configuration
├── offline-outbox.ts              # Offline action queue
├── pwa-auth-integration.ts        # Authentication integration
└── pwa-utils.ts                   # Core utility functions
```

### Types (`features/pwa/types/`)
```
└── pwa.ts                         # TypeScript definitions
```

## API Integration

### Endpoints (`app/api/pwa/`)
- **`/api/pwa/status`** - PWA status and capabilities
- **`/api/pwa/notifications/send`** - Push notification delivery
- **`/api/pwa/notifications/subscribe`** - Subscription management
- **`/api/pwa/offline/sync`** - Offline data synchronization
- **`/api/pwa/manifest`** - Web app manifest generation

### External APIs
- **`/api/vote`** - Voting functionality (used by offline queue)

## Testing Strategy

### E2E Test Coverage
- **Installation Flow** - App installation and management
- **Offline Functionality** - Offline actions and sync
- **Push Notifications** - Notification delivery and interaction
- **Service Worker** - Background processing and caching
- **API Integration** - Endpoint functionality
- **Mobile Experience** - Mobile-optimized interactions

### Test Files
```
tests/e2e/
├── pwa-installation.spec.ts
├── pwa-offline.spec.ts
├── pwa-notifications.spec.ts
├── pwa-service-worker.spec.ts
├── pwa-api.spec.ts
├── pwa-integration.spec.ts
└── superior-mobile-pwa.spec.ts
```

## 🔌 API ENDPOINTS

### **PWA Management APIs:**
- **`/api/pwa/status`** - Get PWA system and user status (GET, POST)
- **`/api/pwa/manifest`** - Get PWA manifest (GET)
- **`/api/pwa/offline/sync`** - Sync offline data (POST)
- **`/api/pwa/notifications/send`** - Send push notifications (POST)
- **`/api/pwa/notifications/subscribe`** - Subscribe to notifications (POST)

### **API Response Format:**
```typescript
interface PWAAPIResponse<T> {
  success: boolean;
  data: T;
  metadata: {
    source: 'database' | 'cache' | 'validation';
    last_updated: string;
    data_quality_score: number;
  };
}
```

### **PWA Status Example:**
```typescript
// GET /api/pwa/status
{
  "success": true,
  "data": {
    "features": {
      "pwa": true,
      "offlineVoting": true,
      "pushNotifications": true,
      "backgroundSync": true,
      "webAuthn": true
    },
    "system": {
      "serviceWorker": "active",
      "cache": "healthy",
      "notifications": "supported",
      "installPrompt": "available"
    },
    "user": {
      "userId": "user-uuid",
      "pwaInstalled": true,
      "offlineData": {
        "polls": 5,
        "votes": 12,
        "lastSync": "2025-10-10T12:00:00Z"
      },
      "notifications": {
        "enabled": true,
        "permissions": "granted",
        "subscriptions": 2
      }
    },
    "timestamp": "2025-10-10T12:00:00Z"
  },
  "metadata": {
    "source": "database",
    "last_updated": "2025-10-10T12:00:00Z",
    "data_quality_score": 95
  }
}
```

### **PWA Manifest Example:**
```typescript
// GET /api/pwa/manifest
{
  "success": true,
  "data": {
    "name": "Choices - Democratic Polling Platform",
    "short_name": "Choices",
    "description": "Democratic polling platform for civic engagement",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#3b82f6",
    "icons": [
      {
        "src": "/icons/icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "/icons/icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png"
      }
    ],
    "shortcuts": [
      {
        "name": "Create Poll",
        "short_name": "Create",
        "description": "Create a new poll",
        "url": "/create",
        "icons": [
          {
            "src": "/icons/shortcut-create.png",
            "sizes": "96x96"
          }
        ]
      }
    ],
    "categories": ["politics", "social", "utilities"],
    "lang": "en",
    "dir": "ltr",
    "orientation": "portrait-primary"
  },
  "metadata": {
    "source": "database",
    "last_updated": "2025-10-10T12:00:00Z",
    "data_quality_score": 95
  }
}
```

### **Offline Sync Example:**
```typescript
// POST /api/pwa/offline/sync
{
  "userId": "user-uuid",
  "deviceId": "device-uuid",
  "actions": [
    {
      "id": "action-uuid",
      "type": "vote",
      "data": {
        "pollId": "poll-uuid",
        "optionId": "option-uuid",
        "timestamp": "2025-10-10T12:00:00Z"
      }
    }
  ],
  "lastSync": "2025-10-10T11:00:00Z"
}

// Response
{
  "success": true,
  "data": {
    "synced": 1,
    "failed": 0,
    "conflicts": [],
    "nextSync": "2025-10-10T13:00:00Z",
    "actions": [
      {
        "id": "action-uuid",
        "status": "synced",
        "serverId": "server-action-uuid"
      }
    ]
  },
  "metadata": {
    "source": "database",
    "last_updated": "2025-10-10T12:00:00Z",
    "data_quality_score": 95
  }
}
```

### **Push Notification Example:**
```typescript
// POST /api/pwa/notifications/send
{
  "userId": "user-uuid",
  "title": "New Poll Available",
  "body": "A new poll about climate change is now open for voting",
  "data": {
    "pollId": "poll-uuid",
    "type": "poll_created",
    "url": "/polls/poll-uuid"
  },
  "icon": "/icons/notification-icon.png",
  "badge": "/icons/badge-icon.png",
  "actions": [
    {
      "action": "vote",
      "title": "Vote Now",
      "icon": "/icons/vote-icon.png"
    },
    {
      "action": "view",
      "title": "View Poll",
      "icon": "/icons/view-icon.png"
    }
  ]
}

// Response
{
  "success": true,
  "data": {
    "notificationId": "notification-uuid",
    "sent": true,
    "deliveryStatus": "sent",
    "timestamp": "2025-10-10T12:00:00Z"
  },
  "metadata": {
    "source": "database",
    "last_updated": "2025-10-10T12:00:00Z",
    "data_quality_score": 95
  }
}
```

## Development Guide

### Adding New PWA Components
1. Create component in `features/pwa/components/`
2. Export from `features/pwa/components/index.ts`
3. Add to feature exports in `features/pwa/index.ts`
4. Create corresponding tests in `tests/e2e/`

### Working with Offline Functionality
1. Use `offline-outbox.ts` for queuing actions
2. Implement sync logic in `OfflineSync.tsx`
3. Handle offline states in components
4. Test offline scenarios in E2E tests

### Push Notifications
1. Use `NotificationPermission.tsx` for permission requests
2. Configure preferences in `NotificationPreferences.tsx`
3. Send notifications via `/api/pwa/notifications/send`
4. Handle notification clicks in service worker

### Feature Flags
1. Define flags in `feature-flags.ts`
2. Use `useFeatureFlags` hook in components
3. Test flag behavior in E2E tests
4. Document flag usage in component comments

## Integration Points

### Authentication
- **File:** `features/pwa/lib/pwa-auth-integration.ts`
- **Purpose:** Integrates PWA features with authentication system
- **Dependencies:** WebAuthn, user management

### Analytics
- **File:** `features/pwa/lib/AnalyticsEngine.ts`
- **Purpose:** Tracks PWA-specific user interactions with main analytics system integration
- **Dependencies:** Main analytics engine, event tracking, logger
- **Features:** Automatic PWA event tracking, installation analytics, offline usage monitoring, performance metrics

### Voting System
- **File:** `features/pwa/components/PWAVotingInterface.tsx`
- **Purpose:** Offline voting capabilities
- **Dependencies:** Voting APIs, offline queue

## Performance Considerations

### Service Worker
- Implements cache-first strategy for static assets
- Network-first strategy for API calls
- Background sync for offline actions

### Offline Queue
- Queues user actions when offline
- Syncs when connection restored
- Handles conflicts and retries

### Component Optimization
- Lazy loading for non-critical components
- Memoization for expensive operations
- Efficient state management

## Security

### Data Protection
- Encrypted offline storage
- Secure notification handling
- Privacy-preserving analytics

### Authentication
- WebAuthn integration
- Secure token management
- Session validation

## Maintenance

### Regular Tasks
- Monitor service worker performance
- Update offline queue logic
- Review notification delivery rates
- Audit feature flag usage

### Troubleshooting
- Check service worker registration
- Verify offline queue functionality
- Test notification permissions
- Validate API endpoint responses

## Dependencies

### Internal
- Authentication system
- Voting system
- Analytics engine
- User management

### External
- Service Worker API
- Push API
- Web App Manifest
- IndexedDB

## Future Enhancements

### Planned Features
- Advanced offline conflict resolution
- Enhanced notification scheduling
- Improved mobile performance
- Extended analytics tracking

### Technical Debt
- Component organization optimization
- Type definition expansion
- Test coverage improvement
- Documentation updates
