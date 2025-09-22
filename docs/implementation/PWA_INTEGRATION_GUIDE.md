# PWA Integration Guide

## Overview

This guide explains how to integrate PWA (Progressive Web App) functionality into the Choices application. The PWA features include:

- **App Installation**: Users can install the app on their devices
- **Offline Support**: Core functionality works without internet connection
- **Push Notifications**: Users can receive notifications for new polls and updates
- **Background Sync**: Offline actions are synced when connection is restored
- **Service Worker**: Advanced caching and performance optimization

## Quick Start

### 1. Add PWA Integration to Layout

Add the PWA integration component to your main layout:

```tsx
// app/layout.tsx or app/(app)/layout.tsx
import PWAIntegration from '@/components/PWAIntegration';
import { initializePWA } from '@/lib/pwa/init';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize PWA functionality
    initializePWA();
  }, []);

  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
      </head>
      <body>
        {children}
        <PWAIntegration />
      </body>
    </html>
  );
}
```

### 2. Add PWA Status to Dashboard

Add PWA status information to your dashboard or settings page:

```tsx
// components/Dashboard.tsx or pages/settings.tsx
import PWAStatus from '@/components/PWAStatus';

export default function Dashboard() {
  return (
    <div className="dashboard">
      {/* Your existing dashboard content */}
      
      {/* PWA Status Card */}
      <PWAStatus showDetails={true} className="mt-6" />
    </div>
  );
}
```

### 3. Use PWA Hook in Components

Use the PWA hook to access PWA functionality in your components:

```tsx
// components/SomeComponent.tsx
import { usePWA } from '@/hooks/usePWA';

export default function SomeComponent() {
  const pwa = usePWA();

  const handleInstall = async () => {
    if (pwa.installation.isInstallable) {
      const result = await pwa.promptInstallation();
      if (result.success) {
        console.log('App installed successfully!');
      }
    }
  };

  const handleSync = async () => {
    if (pwa.hasOfflineData) {
      await pwa.syncOfflineData();
    }
  };

  return (
    <div>
      {pwa.installation.isInstallable && (
        <button onClick={handleInstall}>
          Install App
        </button>
      )}
      
      {pwa.hasOfflineData && (
        <button onClick={handleSync}>
          Sync Offline Data
        </button>
      )}
    </div>
  );
}
```

## API Endpoints

The PWA system includes several API endpoints:

### PWA Status
- `GET /api/pwa/status` - Get PWA system status
- `POST /api/pwa/status` - Update PWA user preferences

### Offline Sync
- `POST /api/pwa/offline/sync` - Sync offline votes and data
- `GET /api/pwa/offline/sync` - Get sync status

### Notifications
- `POST /api/pwa/notifications/subscribe` - Subscribe to push notifications
- `DELETE /api/pwa/notifications/subscribe` - Unsubscribe from notifications
- `GET /api/pwa/notifications/subscribe` - Get notification preferences
- `PUT /api/pwa/notifications/subscribe` - Update notification preferences
- `POST /api/pwa/notifications/send` - Send push notification (admin)

### Manifest
- `GET /api/pwa/manifest` - Get web app manifest

## Configuration

### Feature Flags

PWA functionality is controlled by the `PWA` feature flag in `/lib/core/feature-flags.ts`:

```typescript
export const FEATURE_FLAGS = {
  PWA: true, // Enable PWA features
  // ... other flags
} as const;
```

### Environment Variables

Add these environment variables to your `.env.local`:

```bash
# PWA Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key

# For push notifications (optional)
VAPID_PRIVATE_KEY=your-vapid-private-key
```

## Components

### PWAIntegration
Main integration component that handles all PWA functionality:
- Service worker registration
- Installation prompts
- Offline indicators
- Update notifications

### PWAStatus
Status component showing PWA information:
- Installation status
- Connection status
- Notification settings
- Offline data status
- Action buttons

### PWAInstaller
Installation prompt component:
- Shows when app is installable
- Handles installation flow
- Displays installation benefits

## Hooks

### usePWA
Comprehensive hook providing PWA functionality:

```typescript
const pwa = usePWA();

// Installation
pwa.installation.isInstallable
pwa.installation.isInstalled
await pwa.promptInstallation()

// Service Worker
pwa.serviceWorker.isActive
pwa.serviceWorker.isWaiting
await pwa.checkForUpdates()
await pwa.skipWaiting()

// Connection
pwa.isOnline

// Offline Data
pwa.hasOfflineData
pwa.offlineVotes
await pwa.syncOfflineData()
await pwa.clearOfflineData()

// Notifications
pwa.notificationsEnabled
pwa.notificationsPermission
await pwa.requestNotificationPermission()
await pwa.subscribeToNotifications()
await pwa.unsubscribeFromNotifications()

// Utility
await pwa.refresh()
```

## Testing

Run PWA tests:

```bash
npm run test pwa
```

The test suite covers:
- PWA support detection
- Installation criteria
- Event handling
- Analytics tracking

## Troubleshooting

### Common Issues

1. **PWA not working**: Check that the `PWA` feature flag is enabled
2. **Install prompt not showing**: Ensure HTTPS and engagement criteria are met
3. **Service worker not registering**: Check browser console for errors
4. **Notifications not working**: Verify VAPID keys are configured

### Debug Mode

Enable debug logging by setting:

```typescript
// In your component
const pwa = usePWA();
console.log('PWA Status:', pwa);
```

### Browser DevTools

Use Chrome DevTools to debug PWA:
1. Open DevTools → Application tab
2. Check Service Workers section
3. View Manifest in Application tab
4. Test offline functionality in Network tab

## Best Practices

1. **Progressive Enhancement**: PWA features should enhance, not replace, core functionality
2. **User Control**: Always give users control over PWA features (notifications, offline data)
3. **Performance**: Use service worker caching strategically
4. **Accessibility**: Ensure PWA features are accessible
5. **Testing**: Test on multiple devices and browsers

## Security Considerations

1. **HTTPS Required**: PWA features require HTTPS in production
2. **Service Worker Security**: Validate all service worker code
3. **Notification Security**: Validate notification sources
4. **Offline Data**: Secure cached data appropriately

## Performance

PWA features are designed to improve performance:
- Service worker caching reduces load times
- Offline functionality improves user experience
- Background sync reduces data usage
- Push notifications reduce polling

Monitor performance with:
- Lighthouse PWA audit
- Core Web Vitals
- Service worker metrics
