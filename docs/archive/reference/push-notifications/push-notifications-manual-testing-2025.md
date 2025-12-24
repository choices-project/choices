# Push Notifications - Manual Testing Guide

**Feature:** Push Notifications (C.7)  
**Status:** Ready for Manual Testing  
**Last Updated:** January 2025

This guide provides step-by-step instructions for manually testing push notifications across different browsers and scenarios.

## Prerequisites

### Environment Setup
1. **Feature Flag:** `PUSH_NOTIFICATIONS: true` ✅ (Enabled)
2. **VAPID Keys:** Configured in environment (see `ENVIRONMENT_VARIABLES.md`)
3. **Service Worker:** Registered and active
4. **User Account:** Test user account logged in

### Testing Tools
- Browser DevTools (Application → Service Workers)
- Browser Console
- Network tab (for API calls)
- Database query tool (optional, for verification)

## Quick Start Testing

### 1. Verify Service Worker Registration

**Steps:**
1. Open browser DevTools (F12)
2. Navigate to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Service Workers** in left sidebar
4. Verify service worker is registered and active
5. Check that scope is correct

**Expected Result:** Service worker should show as "activated and is running"

### 2. Test Permission Request

**Steps:**
1. Navigate to `/e2e/push-notifications` (harness page) or settings page
2. Click "Request Notification Permission" button
3. Grant permission in browser dialog
4. Verify permission status updates to "granted"

**Expected Result:** Permission dialog appears, permission is granted, UI updates

**Test Cases:**
- [ ] Permission granted → Shows subscribed state
- [ ] Permission denied → Shows denied message
- [ ] Permission dismissed → Remains in default state

### 3. Test Subscription Flow

**Steps:**
1. Ensure permission is granted
2. Click "Subscribe to Push Notifications"
3. Wait for subscription to complete
4. Verify subscription status shows "Yes"
5. Check endpoint is displayed

**Expected Result:** Subscription created, stored in database, UI updated

**Verification:**
- [ ] Subscription endpoint visible
- [ ] Subscription stored in `push_subscriptions` table
- [ ] User preferences saved

### 4. Test Notification Delivery

**Steps:**
1. Subscribe to push notifications
2. Send test notification via API:
   ```bash
   curl -X POST http://localhost:3000/api/pwa/notifications/send \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -d '{
       "title": "Test Notification",
       "message": "This is a test notification",
       "targetType": "all"
     }'
   ```
3. Verify notification appears on device
4. Click notification
5. Verify app opens to correct page

**Expected Result:** Notification received, clickable, navigates correctly

### 5. Test Preference Management

**Steps:**
1. Ensure subscribed
2. Toggle "New Polls" preference off
3. Verify preference updated in UI
4. Verify preference saved to database
5. Toggle back on

**Expected Result:** Preferences update immediately, persist across page reloads

## Cross-Browser Testing Checklist

### Chrome/Chromium (Desktop & Mobile)

**Test Environment:**
- Desktop: Chrome 120+
- Mobile: Android Chrome 120+

**Test Cases:**

1. **Permission Request**
   - [ ] Permission dialog appears
   - [ ] Permission granted works
   - [ ] Permission denied works
   - [ ] Permission status persists

2. **Subscription**
   - [ ] Subscription creates successfully
   - [ ] Endpoint stored correctly
   - [ ] Multiple subscriptions per user work

3. **Notification Delivery**
   - [ ] Notifications appear in system tray
   - [ ] Notification content correct
   - [ ] Notification click navigates correctly
   - [ ] Notification actions work

4. **Preference Management**
   - [ ] Preferences save correctly
   - [ ] Preferences persist across sessions
   - [ ] Preference toggles work

5. **Offline Handling**
   - [ ] Service worker handles offline
   - [ ] Notifications queue when offline
   - [ ] Notifications deliver when online

**Known Issues:** None

**Status:** ⏳ Pending Manual Testing

---

### Firefox

**Test Environment:**
- Desktop: Firefox 120+

**Test Cases:**

1. **Permission Request**
   - [ ] Permission dialog appears
   - [ ] Permission granted works
   - [ ] Permission denied works

2. **Subscription**
   - [ ] Subscription creates successfully
   - [ ] Endpoint stored correctly

3. **Notification Delivery**
   - [ ] Notifications appear in Firefox notification center
   - [ ] Notification content correct
   - [ ] Notification click navigates correctly

4. **Preference Management**
   - [ ] Preferences save correctly
   - [ ] Preferences persist

**Known Issues:** None known

**Status:** ⏳ Pending Manual Testing

---

### Safari (macOS)

**Test Environment:**
- Desktop: Safari 17+

**Test Cases:**

1. **Permission Request**
   - [ ] Permission dialog appears
   - [ ] Permission granted works
   - [ ] Verify in Safari → Preferences → Websites → Notifications

2. **Subscription**
   - [ ] Subscription creates successfully
   - [ ] Endpoint stored correctly

3. **Notification Delivery**
   - [ ] Notifications appear in macOS notification center
   - [ ] Notification content correct
   - [ ] Notification click navigates correctly

**Known Limitations:**
- Requires explicit permission in Safari preferences
- Some notification features may be limited

**Status:** ⏳ Pending Manual Testing

---

### Safari (iOS)

**Test Environment:**
- Mobile: iOS Safari 17+

**Test Cases:**

1. **Service Worker**
   - [ ] Service worker registers
   - [ ] Service worker active

2. **Permission Request**
   - [ ] Permission dialog appears (may not work)
   - [ ] Note any limitations

3. **Subscription**
   - [ ] Test subscription (may not work)
   - [ ] Document limitations

**Known Limitations:**
- **Very limited push notification support**
- Push notifications may not work on iOS devices
- Service worker support is limited

**Status:** ⏳ Pending Manual Testing  
**Expected:** Limited functionality, document limitations

---

### Edge (Chromium-based)

**Test Environment:**
- Desktop: Edge 120+

**Test Cases:**

1. **Permission Request**
   - [ ] Permission dialog appears
   - [ ] Permission granted works

2. **Subscription**
   - [ ] Subscription creates successfully
   - [ ] Works same as Chrome/Chromium

3. **Notification Delivery**
   - [ ] Notifications appear in Windows notification center
   - [ ] Notification content correct

**Known Issues:** Same as Chrome (Chromium-based)

**Status:** ⏳ Pending Manual Testing

---

## Test Scenarios

### Scenario 1: First-Time User Flow

**Steps:**
1. Log in as new user
2. Navigate to notification preferences
3. See permission request button
4. Click "Request Notification Permission"
5. Grant permission
6. Click "Subscribe to Push Notifications"
7. Verify subscription successful
8. Toggle preferences
9. Verify preferences saved

**Expected Result:** Complete flow works without errors

**Status:** ⏳ Pending Testing

---

### Scenario 2: Subscription Update

**Steps:**
1. User already subscribed
2. Change preferences (e.g., disable "Poll Results")
3. Verify preference saved
4. Send notification of type "pollResults"
5. Verify user does not receive notification (preference respected)

**Expected Result:** Preferences respected when sending notifications

**Status:** ⏳ Pending Testing

---

### Scenario 3: Unsubscription Flow

**Steps:**
1. User is subscribed
2. Click "Unsubscribe from Push Notifications"
3. Verify subscription removed
4. Send test notification
5. Verify user does not receive notification

**Expected Result:** Unsubscribed users don't receive notifications

**Status:** ⏳ Pending Testing

---

### Scenario 4: Offline Notification

**Steps:**
1. Subscribe to notifications
2. Put device in airplane mode (offline)
3. Send notification while offline
4. Bring device back online
5. Verify notification delivered when online

**Expected Result:** Notification delivered when connection restored

**Status:** ⏳ Pending Testing

---

### Scenario 5: Error Handling

**Steps:**
1. Revoke notification permission in browser settings
2. Try to subscribe
3. Verify error message shown
4. Re-grant permission
5. Try to subscribe again
6. Verify subscription works

**Expected Result:** Errors handled gracefully, clear messages shown

**Status:** ⏳ Pending Testing

---

## API Testing

### Test Subscription Endpoint

```bash
# Subscribe
curl -X POST http://localhost:3000/api/pwa/notifications/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/test",
      "keys": {
        "p256dh": "test-key",
        "auth": "test-auth"
      }
    },
    "userId": "user-id",
    "preferences": {
      "newPolls": true,
      "pollResults": true,
      "systemUpdates": false,
      "weeklyDigest": true
    }
  }'
```

### Test Send Notification Endpoint

```bash
# Send to all users
curl -X POST http://localhost:3000/api/pwa/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test",
    "targetType": "all"
  }'

# Send to specific users
curl -X POST http://localhost:3000/api/pwa/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test",
    "targetType": "users",
    "targetUsers": ["user-id-1", "user-id-2"]
  }'
```

### Test Get Preferences

```bash
curl -X GET "http://localhost:3000/api/pwa/notifications/subscribe?userId=user-id"
```

## Database Verification

### Check Subscription

```sql
SELECT * FROM push_subscriptions 
WHERE user_id = 'user-id' 
AND is_active = true;
```

### Check Notification Log

```sql
SELECT * FROM notification_log 
WHERE user_id = 'user-id' 
ORDER BY created_at DESC 
LIMIT 10;
```

## Common Issues & Troubleshooting

### Issue: Permission Dialog Doesn't Appear

**Possible Causes:**
- Permission already granted/denied
- Browser doesn't support notifications
- Service worker not registered

**Solutions:**
- Check browser notification settings
- Clear site data and retry
- Verify service worker is registered

### Issue: Subscription Fails

**Possible Causes:**
- VAPID key not configured
- Permission not granted
- Service worker not ready

**Solutions:**
- Check environment variables
- Verify VAPID keys are set
- Check browser console for errors
- Ensure service worker is active

### Issue: Notifications Not Received

**Possible Causes:**
- User not subscribed
- User offline when sent
- Push service error
- Subscription expired

**Solutions:**
- Verify subscription in database
- Check notification log for errors
- Verify user is online
- Check push service status

## Test Results Tracking

### Test Execution Log

| Date | Browser | Version | Test Case | Result | Notes |
|------|---------|---------|-----------|--------|-------|
| _ | Chrome | 120+ | Permission Request | ⏳ | Pending |
| _ | Chrome | 120+ | Subscription | ⏳ | Pending |
| _ | Chrome | 120+ | Notification Delivery | ⏳ | Pending |
| _ | Firefox | 120+ | Permission Request | ⏳ | Pending |
| _ | Firefox | 120+ | Subscription | ⏳ | Pending |
| _ | Safari | 17+ | Permission Request | ⏳ | Pending |
| _ | Safari iOS | 17+ | Permission Request | ⏳ | Pending (Limited) |
| _ | Edge | 120+ | Full Flow | ⏳ | Pending |

## Sign-Off

### Manual Testing Sign-Off

**Status:** ⏳ Pending  
**Tester:** _  
**Date:** _  
**Result:** _

---

**Document Owner:** QA Team  
**Last Updated:** January 2025  
**Next Review:** After manual testing completion
