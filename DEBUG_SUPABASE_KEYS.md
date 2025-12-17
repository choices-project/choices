# Debugging Supabase Key Issues

**Date:** December 17, 2025  
**Issue:** Feedback table query fails with "Unregistered API key"  
**Status:** Admin client connects, but queries fail

---

## Current Situation

### ✅ What Works:
- Supabase admin client creation succeeds
- Feed API works (uses anon key)
- Polls table queries work

### ❌ What Fails:
- Feedback table query: "Unregistered API key"

---

## Diagnostic Steps

### Step 1: Verify Keys Match Project

**In Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **Settings** → **API**
4. Verify these match Vercel:
   - `Project URL` should match `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public` key should match `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key should match `SUPABASE_SERVICE_ROLE_KEY`

**Copy these values:**
```bash
Project URL: https://[project-id].supabase.co
Anon key: eyJhbGc...  (starts with eyJ)
Service Role: eyJhbGc... (starts with eyJ, different from anon)
```

### Step 2: Check Vercel Environment Variables

**In Vercel Dashboard:**
1. Go to: https://vercel.com/[your-account]/[project]/settings/environment-variables
2. Check these 3 variables ALL exist and are for **Production**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

**Common Issues:**
- ✗ Key is set for "Preview" or "Development" only (not Production)
- ✗ Key has extra whitespace or newlines
- ✗ Key is from a different Supabase project

### Step 3: Force Vercel to Pick Up New Variables

**Option A: Redeploy (Recommended)**
```bash
# From your local terminal:
cd /Users/alaughingkitsune/src/Choices
git commit --allow-empty -m "chore: force Vercel redeploy for env var update"
git push
```

**Option B: Vercel Dashboard**
1. Go to Vercel → Deployments
2. Click on latest deployment
3. Click "..." → "Redeploy"
4. Select "Use existing Build Cache: No"

### Step 4: Verify Feedback Table Exists

**In Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **Table Editor** (left sidebar)
4. Look for `feedback` table

**If table doesn't exist:**
- This is expected if you haven't run migrations yet
- The app will use a fallback mock response
- Feedback submissions won't be saved but won't error

**If table exists, check structure:**
```sql
-- Should have these columns (at minimum):
id, created_at, type, title, description, sentiment, user_id, user_journey
```

### Step 5: Test After Changes

**Wait 2-3 minutes after any changes, then:**
```bash
# Test diagnostics endpoint:
curl https://choices-app.com/api/diagnostics | jq '.data.checks.feedbackTable'

# Expected after fix:
# {
#   "status": "ok",
#   "message": "Successfully queried feedback table",
#   "sampleCount": 0
# }
```

---

## Quick Fixes

### Fix #1: Verify Keys Are Correct
```bash
# Compare these values:
# Supabase Dashboard → Settings → API
# vs
# Vercel Dashboard → Settings → Environment Variables

# They MUST match exactly (no spaces, complete keys)
```

### Fix #2: Force Redeploy
```bash
cd /Users/alaughingkitsune/src/Choices
git commit --allow-empty -m "chore: force redeploy"
git push
# Wait 2-3 minutes for deployment
```

### Fix #3: Check Project ID Match
```bash
# Your NEXT_PUBLIC_SUPABASE_URL should contain your project ID
# Example: https://abc123def456.supabase.co
#                   ^^^^^^^^^^^^ this is your project ID
#
# The service role key is project-specific!
# If you copy a key from a different project, it won't work
```

---

## Common Mistakes

### ❌ Mistake #1: Wrong Environment
- Set variables for "Production" not "Preview"
- Vercel has separate vars for each environment

### ❌ Mistake #2: Cached Values
- Vercel caches environment variables
- Need to redeploy (not just save) for changes to take effect

### ❌ Mistake #3: Key from Different Project
- Service role keys are project-specific
- Check the project ID in your URL matches

### ❌ Mistake #4: Incomplete Key
- Keys are very long (~200+ characters)
- Easy to accidentally truncate when copying

---

## How to Get Fresh Keys

**Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard
2. Select your project (check project name!)
3. Settings → API
4. Click "Reveal" next to service_role
5. Click the copy icon (don't manually select/copy)
6. Paste directly into Vercel (don't paste into a text editor first)

---

## Test Commands

```bash
# 1. Test diagnostics (should show all systems healthy)
curl https://choices-app.com/api/diagnostics | jq

# 2. Test feedback API (should accept submission)
curl -X POST https://choices-app.com/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "type": "general",
    "title": "Test after key fix",
    "description": "Testing",
    "sentiment": "positive",
    "userJourney": {"currentPage": "/test", "sessionId": "test"}
  }' | jq

# 3. Test feed API (should return data)
curl https://choices-app.com/api/feeds?limit=1 | jq
```

---

## Next Steps

1. ✅ Verify all 3 Supabase keys in Vercel match your Supabase dashboard
2. ✅ Ensure keys are set for "Production" environment
3. ✅ Force redeploy using empty commit (see above)
4. ⏰ Wait 2-3 minutes for deployment to complete
5. ✅ Run test commands above
6. 🎉 Verify diagnostics shows all systems healthy

---

**Status:** Awaiting Vercel env var propagation or table creation

