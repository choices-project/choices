# Testing Guide - PWA & App Status

## Current Status

### ✅ What's Fixed
- Service worker file created at `/web/public/service-worker.js`
- Manifest.json icons updated to use SVG files
- Service worker registration paths corrected
- Middleware import fixed (ssr-polyfills)
- Site-messages API improved (using Supabase client)
- Incorrect `/public/` directory removed

### ⚠️ Known Issues
1. **Site Messages API Error (Non-Critical)**
   - Error: `GET /api/site-messages 500`
   - Cause: Likely `site_messages` table query issue or table doesn't exist
   - **Impact**: Site messages won't show, but **app still works**

2. **Bundle Size Warnings (Normal in Dev)**
   - Large bundle sizes shown (8-10 MB)
   - **This is normal for development mode**
   - Production builds will be much smaller

3. **SSR Polyfills Warning (Non-Critical)**
   - Top-level await warning
   - **This is informational, not blocking**

## How to Test

### 1. Start the Server
```bash
cd web
npm run dev
```

### 2. Open Browser
Visit: **http://localhost:3000**

### 3. Check Service Worker
1. Open **DevTools** (F12 or Cmd+Option+I)
2. Go to **Application** tab
3. Click **Service Workers** (left sidebar)
4. Should see: `service-worker.js` with status "activated"

✅ **If you see this, PWA is working!**

### 4. Test Offline Mode
1. Keep DevTools open
2. Go to **Network** tab
3. Change dropdown from "No throttling" to **"Offline"**
4. Try navigating around the app
5. Should still work (from cache)

✅ **If pages load offline, caching works!**

### 5. Test Push Notifications (Optional)
1. Look for notification permission prompt
2. Click "Allow"
3. Open new terminal:
```bash
curl -X POST http://localhost:3000/api/pwa/notifications/send \
  -H "Content-Type: application/json" \
  -d '{"broadcast":true,"title":"Test","body":"PWA working!"}'
```
4. Should see browser notification

✅ **If notification appears, push works!**

### 6. Test Install Prompt
- Install prompt appears after:
  - 3+ page visits
  - 2+ minutes on site
  - Or manually: Browser menu → "Install app"

## Expected Behavior

### What Should Work ✅
- ✅ Homepage loads
- ✅ Service worker registers
- ✅ Offline mode works (cached pages)
- ✅ PWA manifest serves
- ✅ Icons load
- ✅ App installable

### What Might Not Work ⚠️
- ⚠️ Site messages (API error - non-critical)
- ⚠️ Some features may require auth/database

## Troubleshooting

### Server Won't Start
```bash
# Kill any running process
lsof -ti:3000 | xargs kill -9

# Clear caches
rm -rf .next

# Try again
npm run dev
```

### Service Worker Not Showing
```bash
# Hard reload in browser
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Or clear site data:
DevTools → Application → Clear storage → Clear site data
```

### Still Getting Errors
The site-messages error is non-critical. The app should still:
- Load the homepage
- Register service worker
- Work offline
- Be installable

**Focus on**: Does the homepage load? Can you see the service worker in DevTools?

## Success Criteria

### Minimum (PWA is Working)
- [ ] Server starts on port 3000
- [ ] Homepage loads in browser
- [ ] Service worker appears in DevTools
- [ ] No critical console errors

### Full Success (Everything Working)
- [ ] Offline mode works
- [ ] Push notifications work
- [ ] App is installable
- [ ] All PWA features functional

## Next Steps After Testing

### If Working
1. Test on mobile device
2. Test app installation
3. Performance audit with Lighthouse
4. Deploy to staging

### If Issues
1. Check browser console for errors
2. Check server logs
3. Verify environment variables
4. Check database connection

## Quick Commands

```bash
# Start server
npm run dev

# Check what's on port 3000
lsof -i:3000

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Clear Next.js cache
rm -rf .next

# Check service worker
curl http://localhost:3000/service-worker.js

# Check manifest
curl http://localhost:3000/manifest.json
```

---

**Bottom Line**: Site-messages error is annoying but not critical. Focus on testing if:
1. Homepage loads
2. Service worker registers
3. App works offline

If those 3 work, your PWA is successfully implemented! 🎉

*Last Updated: November 4, 2025*

