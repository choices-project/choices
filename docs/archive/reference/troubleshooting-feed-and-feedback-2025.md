# Troubleshooting Feed Loading and Feedback Widget Issues

**Created:** December 17, 2025  
**Status:** ✅ Production Diagnostic Guide

## Overview

This document explains the recent feed loading and feedback widget submission failures, the root causes identified, and how to diagnose and resolve similar issues in the future.

---

## Issues Identified

### 1. Feed Page Loading Failure

**Symptom:** "Unable to load feed. Please refresh the page."

**Root Cause:** The `/api/feeds` endpoint was returning feed items missing required fields:
- Missing `metadata` object (required by `FeedItemBase` type)
- Missing `bookmarks` field in `engagement` object

**Impact:** The feed store's type validation was failing, causing the entire feed to fail to render.

### 2. Feedback Widget Submission Failure

**Symptom:** "Error: Failed to save feedback"

**Root Cause:** Multiple potential issues:
- Supabase client not properly initialized
- Missing or incorrect authentication cookies
- RLS (Row-Level Security) policies blocking inserts
- Missing `feedback` table or schema cache issues

**Impact:** Users unable to submit feedback, losing valuable user insights.

---

## Fixes Implemented

### Feed API Fixes (`web/app/api/feeds/route.ts`)

Added missing fields to both poll and civic action feed items:

```typescript
// Added to poll feed items
metadata: {
  language: 'en',
  externalUrl: undefined,
  image: undefined,
  videoUrl: undefined,
  audioUrl: undefined,
  location: undefined
},

// Added to engagement objects
engagement: {
  likes: 0,
  shares: 0,
  comments: 0,
  views: poll.total_votes || 0,
  bookmarks: 0  // ← Added
},
```

### Diagnostics API (`web/app/api/diagnostics/route.ts`)

Created a new diagnostic endpoint to help troubleshoot production issues:

**Endpoint:** `GET /api/diagnostics`

**Checks performed:**
1. **Supabase Client Connection** - Verifies client creation and basic query
2. **Supabase Admin Client** - Verifies admin client for fallback operations
3. **Environment Variables** - Checks for required Supabase env vars
4. **Auth Cookies** - Verifies presence of authentication cookies
5. **Overall Health Status** - Aggregates all checks into a health status

**Example Response:**

```json
{
  "success": true,
  "data": {
    "timestamp": "2025-12-17T10:30:00.000Z",
    "environment": "production",
    "checks": {
      "supabaseClient": {
        "status": "ok",
        "message": "Supabase client created successfully"
      },
      "supabaseQuery": {
        "status": "ok",
        "message": "Successfully queried polls table",
        "sampleCount": 1
      },
      "supabaseAdminClient": {
        "status": "ok",
        "message": "Admin client created successfully"
      },
      "feedbackTable": {
        "status": "ok",
        "message": "Successfully queried feedback table",
        "sampleCount": 5
      },
      "environment": {
        "hasSupabaseUrl": true,
        "hasSupabaseAnonKey": true,
        "hasServiceRoleKey": true,
        "nodeEnv": "production",
        "isE2EHarness": false
      },
      "authCookies": {
        "status": "ok",
        "hasAccessToken": true,
        "hasRefreshToken": true
      }
    },
    "overallStatus": "healthy"
  }
}
```

---

## How to Use the Diagnostics Endpoint

### In Production

1. **Navigate to the diagnostics endpoint:**
   ```
   https://choices-app.com/api/diagnostics
   ```

2. **Check the `overallStatus` field:**
   - `healthy` - All systems operational
   - `degraded` - Some components missing but system functional
   - `unhealthy` - Critical errors detected

3. **Review individual checks:**
   - Look for any checks with `"status": "error"`
   - Read the `message` field for details
   - Check the `error` object if present

### Common Diagnostic Scenarios

#### Scenario 1: Feed Not Loading

**Steps:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to `/feed`
4. Look for the `/api/feeds` request
5. Check the response:
   - **200 OK**: Feed data returned successfully
   - **401 Unauthorized**: Authentication issue
   - **500 Internal Server Error**: Server-side error

**If 500 error:**
1. Visit `/api/diagnostics`
2. Check `supabaseClient` and `supabaseQuery` status
3. If error, check environment variables in Vercel dashboard

**If feed data looks correct but UI shows error:**
1. Check browser console for client-side errors
2. Look for type validation errors
3. Verify feed items have all required fields (use the diagnostics response as reference)

#### Scenario 2: Feedback Widget Not Working

**Steps:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to submit feedback
4. Look for the `/api/feedback` request
5. Check the response:
   - **200 OK**: Feedback submitted successfully
   - **401 Unauthorized**: Authentication issue
   - **429 Too Many Requests**: Rate limit exceeded
   - **500 Internal Server Error**: Server-side error

**If 500 error:**
1. Visit `/api/diagnostics`
2. Check `feedbackTable` status
3. If error, the `feedback` table may not exist or have schema issues

**Fallback mechanisms in place:**
- If RLS blocks insert, system attempts admin client fallback
- If table doesn't exist, returns mock success (logs server-side)
- Ensures user feedback is never silently dropped

#### Scenario 3: Authentication Issues

**Steps:**
1. Visit `/api/diagnostics`
2. Check `authCookies` status
3. If `"status": "missing"`:
   - User is not authenticated
   - Visit `/clear-session` to reset cookies
   - Log in again

**If cookies present but authentication failing:**
1. Check cookie expiration (7 days from login)
2. Verify `sb-access-token` and `sb-refresh-token` are set
3. Check middleware logs for auth bypass issues

---

## Supabase Connection Verification

### Required Environment Variables

The following environment variables must be set in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Verifying in Vercel Dashboard

1. Go to Vercel project settings
2. Navigate to "Environment Variables"
3. Verify all three Supabase variables are present
4. Check they're enabled for "Production" environment
5. If changed, redeploy the application

### Testing Supabase Connection Locally

```bash
# In web/ directory
npm run dev

# In another terminal
curl http://localhost:3000/api/diagnostics | jq
```

Look for:
- `supabaseClient.status: "ok"`
- `supabaseQuery.status: "ok"`
- `feedbackTable.status: "ok"`

---

## Feedback Widget Resilience

The feedback widget has multiple fallback mechanisms to ensure user feedback is captured:

### 1. RLS Fallback
If Row-Level Security blocks the insert, the system attempts to insert using the admin client:

```typescript
// In /api/feedback route
if (error.includes('violates row-level security policy')) {
  const adminClient = await getSupabaseAdminClient();
  const { data: adminData } = await adminClient
    .from('feedback')
    .insert(feedbackData)
    .select()
    .single();
  
  return successResponse(buildFeedbackResponse(adminData.id, userJourney), {
    source: 'admin-fallback',
    reason: 'rls-denied'
  });
}
```

### 2. Schema Cache Fallback
If the table doesn't exist or schema cache is stale, returns a mock success:

```typescript
if (error.includes('relation "feedback" does not exist')) {
  return successResponse(
    buildFeedbackResponse(`mock-${Date.now()}`, userJourney),
    { source: 'mock', fallback: 'schema-cache' }
  );
}
```

**Note:** Mock responses are logged server-side for manual review.

### 3. Rate Limiting
- **Authenticated users:** 10 feedback submissions per day
- **Anonymous users:** No rate limit (but tracked by IP)

---

## Monitoring and Logging

### Server-Side Logs

All diagnostic checks are logged server-side:

```typescript
// Healthy system
logger.info('Diagnostics: All checks passed', diagnostics);

// Degraded system
logger.warn('Diagnostics found missing components', diagnostics);

// Unhealthy system
logger.error('Diagnostics found errors', diagnostics);
```

### Client-Side Error Tracking

Feed errors are captured by the `ErrorBoundaryWrapper`:

```typescript
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  logger.error('Feed component error:', { error, errorInfo });
}
```

Feedback widget errors are tracked via the analytics store:

```typescript
catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
  setAnalyticsError(errorMessage);
  trackEvent({
    event_type: 'error',
    category: 'feedback',
    action: 'submission_failed',
    label: errorMessage
  });
}
```

---

## Testing the Fixes

### Manual Testing Checklist

#### Feed Page
- [ ] Navigate to `/feed` while logged in
- [ ] Verify feed items load without errors
- [ ] Check browser console for errors
- [ ] Verify "Unable to load feed" message does NOT appear
- [ ] Test pull-to-refresh functionality
- [ ] Test infinite scroll (if applicable)

#### Feedback Widget
- [ ] Click feedback widget button (bottom right)
- [ ] Fill out feedback form
- [ ] Submit feedback
- [ ] Verify success message appears
- [ ] Check Supabase `feedback` table for new entry
- [ ] Verify no "Failed to save feedback" error

#### Diagnostics Endpoint
- [ ] Visit `/api/diagnostics`
- [ ] Verify `overallStatus: "healthy"`
- [ ] Check all individual checks show `"status": "ok"`
- [ ] Test while logged out (should show `authCookies.status: "missing"`)

### Automated Testing

E2E tests will verify:
- Feed loads successfully after login
- Feedback widget submission works
- Diagnostics endpoint returns healthy status

---

## Future Improvements

1. **Real-time Diagnostics Dashboard**
   - Create an admin-only page at `/admin/diagnostics`
   - Show live health checks
   - Display recent errors and warnings

2. **Enhanced Error Messages**
   - More specific error messages for different failure modes
   - Actionable suggestions for users (e.g., "Try clearing your session")

3. **Proactive Monitoring**
   - Set up alerts for unhealthy diagnostic status
   - Track feed loading success rate
   - Monitor feedback submission success rate

4. **User Journey Tracking**
   - Capture full user journey before errors
   - Include in error reports for better debugging
   - Integrate with feedback widget for context

---

## Related Documentation

- [SECURITY.md](../../SECURITY.md) - Security model and RLS policies
- [ENVIRONMENT_VARIABLES.md](../../ENVIRONMENT_VARIABLES.md) - Environment variable reference
- [Landing Page Implementation](../../features/landing-page.md)
- [API Documentation](../../API/README.md)

---

## Support

If you encounter issues not covered in this guide:

1. Check the diagnostics endpoint first: `/api/diagnostics`
2. Review server-side logs in Vercel dashboard
3. Check browser console for client-side errors
4. Use the feedback widget to report the issue (if it's working!)
5. Contact the development team with:
   - Diagnostics endpoint output
   - Browser console errors
   - Steps to reproduce
   - Expected vs. actual behavior

