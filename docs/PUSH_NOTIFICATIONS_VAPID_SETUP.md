# Push Notifications - VAPID Keys Setup Guide

**Feature:** Push Notifications (C.7)  
**Status:** Configuration Guide  
**Last Updated:** January 2025

## Quick Reference

Example VAPID environment variables in `.env.local`:
```bash
WEB_PUSH_VAPID_PUBLIC_KEY=your-vapid-public-key-here
WEB_PUSH_VAPID_PRIVATE_KEY=your-vapid-private-key-here
WEB_PUSH_VAPID_SUBJECT=your-email@example.com
```

## ✅ Variable Status

**Your current variables are acceptable and will work!**

The code has been updated to:
- ✅ Support `WEB_PUSH_VAPID_PUBLIC_KEY` for server-side code
- ✅ Support `WEB_PUSH_VAPID_PRIVATE_KEY` for server-side code
- ✅ Support `WEB_PUSH_VAPID_SUBJECT` (accepts email or mailto: format)
- ✅ Automatically normalize email addresses to `mailto:` format

## ✅ Next.js Client-Side Access

**Client-side variable configured!**

In Next.js, only `NEXT_PUBLIC_*` environment variables are exposed to the browser. Your setup now includes:

```bash
NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY=your-vapid-public-key-here
```

✅ Same value as `WEB_PUSH_VAPID_PUBLIC_KEY` - configured for browser access.

## Complete Setup

### Local Development (`.env.local`)

```bash
# Server-side (used by /api/pwa/notifications/send)
WEB_PUSH_VAPID_PUBLIC_KEY=your-vapid-public-key-here
WEB_PUSH_VAPID_PRIVATE_KEY=your-vapid-private-key-here
WEB_PUSH_VAPID_SUBJECT=your-email@example.com

# Client-side (used by NotificationPreferences component, service worker)
NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY=your-vapid-public-key-here
```

### Production (Vercel Environment Variables)

Set these in Vercel:

1. **Server-side variables:**
   - `WEB_PUSH_VAPID_PUBLIC_KEY` = `your-vapid-public-key-here`
   - `WEB_PUSH_VAPID_PRIVATE_KEY` = `your-vapid-private-key-here` (mark as secret)
   - `WEB_PUSH_VAPID_SUBJECT` = `your-email@example.com` (or `mailto:your-email@example.com`)

2. **Client-side variable (required for browser):**
   - `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` = `your-vapid-public-key-here` (same value as above)

## Code Updates

The code now:
- ✅ Checks for `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` first (client-side)
- ✅ Falls back to `WEB_PUSH_VAPID_PUBLIC_KEY` (server-side)
- ✅ Accepts `WEB_PUSH_VAPID_SUBJECT` as email address (normalizes to `mailto:` automatically)
- ✅ Supports both `WEB_PUSH_VAPID_PRIVATE_KEY` and `VAPID_PRIVATE_KEY` (for compatibility)

## Verification

To verify your setup:

1. **Check server-side variables:**
   ```bash
   # Server-side code can access:
   process.env.WEB_PUSH_VAPID_PUBLIC_KEY ✅
   process.env.WEB_PUSH_VAPID_PRIVATE_KEY ✅
   process.env.WEB_PUSH_VAPID_SUBJECT ✅
   ```

2. **Check client-side variable:**
   ```javascript
   // Browser code can access:
   process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY ✅
   // Browser code CANNOT access (Next.js restriction):
   process.env.WEB_PUSH_VAPID_PUBLIC_KEY ❌ (undefined in browser)
   ```

3. **Test subscription:**
   - Navigate to notification preferences page
   - Click "Request Notification Permission"
   - Grant permission
   - Click "Subscribe to Push Notifications"
   - Should succeed if `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` is set

## Your Current Variables: Status

✅ **WEB_PUSH_VAPID_PUBLIC_KEY** - Working (server-side)  
✅ **NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY** - Working (client-side)  
✅ **WEB_PUSH_VAPID_PRIVATE_KEY** - Working (server-side)  
✅ **WEB_PUSH_VAPID_SUBJECT** - Working (email format, will be normalized)

**All variables configured! ✅**

## Production Status

✅ **Vercel Environment Variables Configured:**
- ✅ `WEB_PUSH_VAPID_PUBLIC_KEY` set in Vercel (server-side)
- ✅ `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` set in Vercel (client-side)
- ✅ `WEB_PUSH_VAPID_PRIVATE_KEY` set in Vercel (secret, server-only)
- ✅ `WEB_PUSH_VAPID_SUBJECT` set in Vercel

**All VAPID keys are now configured in production! ✅**

## Summary

- ✅ Variable names are acceptable
- ✅ Server-side code works with current variables
- ✅ Client-side variable configured
- ✅ Subject format (email) is acceptable - code handles normalization
- ✅ All VAPID keys configured and ready

---

**Document Owner:** Engineering Team  
**Last Updated:** January 2025
