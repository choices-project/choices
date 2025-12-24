# Push Notifications

_Last updated: January 2026_

This guide covers push notifications setup, implementation status, and testing.

## Quick Links

- **Setup Guide**: [`PUSH_NOTIFICATIONS_VAPID_SETUP.md`](PUSH_NOTIFICATIONS_VAPID_SETUP.md) - VAPID keys configuration
- **Implementation Status**: [`PUSH_NOTIFICATIONS_AUDIT.md`](PUSH_NOTIFICATIONS_AUDIT.md) - Deployment readiness and audit
- **Archived Testing Docs**: See `docs/archive/reference/push-notifications/` for historical testing and review documents

## Overview

Push notifications enable real-time updates for users who opt in. The implementation includes:
- Client-side subscription management
- Server-side notification sending with retry logic
- Service worker integration
- E2E test harness at `/e2e/push-notifications`

## Status

✅ **Implementation Complete** - All components implemented and tested
⚠️ **Pre-Deployment Review** - See audit document for final checklist

## Key Files

- Client: `web/features/pwa/components/NotificationPreferences.tsx`
- API: `web/app/api/pwa/notifications/subscribe/route.ts`, `send/route.ts`
- Service Worker: `web/public/service-worker.js`
- E2E Harness: `web/app/(app)/e2e/push-notifications/page.tsx`

For detailed setup instructions, see [`PUSH_NOTIFICATIONS_VAPID_SETUP.md`](PUSH_NOTIFICATIONS_VAPID_SETUP.md).
For deployment readiness checklist, see [`PUSH_NOTIFICATIONS_AUDIT.md`](PUSH_NOTIFICATIONS_AUDIT.md).

