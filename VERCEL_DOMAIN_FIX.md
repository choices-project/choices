# Vercel Domain Configuration Fix

## Current Issue (WRONG Configuration)
- ❌ `www.choices-app.com` → redirects TO `choices-app.com` (308)
- ❌ `choices-app.com` → connected to Production

## Required Configuration (CORRECT)
- ✅ `www.choices-app.com` → connected to Production (NO redirect)
- ✅ `choices-app.com` → redirects TO `www.choices-app.com` (308)

## Steps to Fix in Vercel Dashboard

### 1. Configure www.choices-app.com (Make it Primary)
1. Click on the **www.choices-app.com** card
2. Select the radio button: **"Connect to an environment"**
3. From the dropdown, select: **"Production"**
4. Click **"Save"**

### 2. Configure choices-app.com (Make it Redirect)
1. Click on the **choices-app.com** card
2. Select the radio button: **"Redirect to Another Domain"**
3. From the redirect type dropdown, select: **"308 Permanent Redirect"**
4. In the search/input field, type: **"www.choices-app.com"**
5. Click **"Save"**

### 3. Verify Configuration
After saving, your domain configuration should show:
- ✅ **www.choices-app.com**: Valid Configuration, Production (CONNECTED)
- ✅ **choices-app.com**: Valid Configuration, 308 → www.choices-app.com (REDIRECTING)

## Why This Matters

### Before Fix:
- User visits `choices-app.com` → gets Production content but wrong domain
- User visits `www.choices-app.com` → redirects away (loses www)
- Cookies may not work consistently
- SEO issues (duplicate content)

### After Fix:
- User visits `choices-app.com` → 308 redirect → `www.choices-app.com`
- User visits `www.choices-app.com` → gets Production content directly
- Cookies work on `.choices-app.com` domain (shared)
- SEO canonical domain established
- Consistent user experience

## Testing After Fix

```bash
# Test 1: Non-www should redirect to www
curl -I https://choices-app.com/ 
# Expected: HTTP/2 308, Location: https://www.choices-app.com/

# Test 2: www should serve content directly
curl -I https://www.choices-app.com/
# Expected: HTTP/2 200 (or 307 to /landing if not logged in)

# Test 3: Paths should be preserved
curl -I https://choices-app.com/landing
# Expected: HTTP/2 308, Location: https://www.choices-app.com/landing
```

## Next.js Redirect (Already Added)

The `next.config.js` has been updated with a backup redirect rule that will:
1. Catch any requests to `choices-app.com` that bypass Vercel
2. Redirect to `www.choices-app.com` at the application level
3. Ensure consistent behavior across all deployment environments

## Important Notes

1. **Update takes effect immediately** after clicking Save in Vercel
2. **Browser cache**: Users may need to clear cache or hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
3. **DNS propagation**: Should be instant (Vercel manages DNS)
4. **Session cookies**: Existing sessions will work due to `.choices-app.com` domain
5. **Analytics**: Update any hardcoded URLs to use `www.choices-app.com`

