# Fix: Feedback Table RLS Permissions

**Issue:** `permission denied for table feedback`  
**Cause:** Row Level Security (RLS) is enabled but no policy allows service role access  
**Status:** ⚠️ Requires SQL execution in Supabase

---

## Quick Fix (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Run This SQL

```sql
-- Allow service role to read feedback table
CREATE POLICY "Service role can read all feedback"
ON public.feedback
FOR SELECT
TO service_role
USING (true);
```

### Step 3: Verify

```bash
# Test diagnostics endpoint (should now work):
curl https://choices-app.com/api/diagnostics | jq '.data.checks.feedbackTable'

# Expected result:
# {
#   "status": "ok",
#   "message": "Successfully queried feedback table",
#   "sampleCount": 0
# }
```

---

## Understanding the Issue

### What Happened?

1. ✅ You created the `feedback` table
2. ✅ RLS was enabled automatically (good for security)
3. ❌ No RLS policy was created for the service role
4. ❌ Service role can't read the table (even though it should bypass RLS)

### Why Service Role Needs a Policy

While the service role **normally** bypasses RLS, Supabase's implementation requires explicit policies for service role access when:
- The table was created with RLS enabled from the start
- You're using the Supabase client library (not direct SQL)

---

## Complete RLS Policy Setup (Recommended)

For a production-ready setup, you'll want policies for all roles:

```sql
-- 1. Service role can manage all feedback (for diagnostics and admin)
CREATE POLICY "Service role can manage all feedback"
ON public.feedback
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Authenticated users can submit feedback (insert only)
CREATE POLICY "Users can submit feedback"
ON public.feedback
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Authenticated users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL);

-- 4. Anonymous users can submit feedback without user_id
CREATE POLICY "Anonymous can submit feedback"
ON public.feedback
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);
```

---

## Alternative: Disable RLS (Not Recommended)

If you want to quickly test without RLS (not recommended for production):

```sql
-- CAUTION: This removes all security from the feedback table
ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;
```

**Note:** Only use this for testing. Re-enable RLS before going to production:
```sql
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
```

---

## Verify Current RLS Status

Check if RLS is enabled and what policies exist:

```sql
-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'feedback';

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'feedback';
```

---

## After Applying the Fix

1. **Test diagnostics:**
   ```bash
   curl https://choices-app.com/api/diagnostics | jq
   ```
   Should show `overallStatus: "healthy"` (or "degraded" if not logged in)

2. **Test feedback submission:**
   ```bash
   curl -X POST https://choices-app.com/api/feedback \
     -H "Content-Type: application/json" \
     -d '{
       "type": "general",
       "title": "Test after RLS fix",
       "description": "Testing feedback submission",
       "sentiment": "positive",
       "userJourney": {"currentPage": "/test", "sessionId": "test"}
     }' | jq
   ```
   Should return `{"success": true, ...}`

---

## Files Created

- `supabase_feedback_fix.sql` - SQL to run in Supabase
- `FEEDBACK_RLS_FIX.md` - This documentation (you're reading it)

---

**Next Step:** Run the SQL in Supabase SQL Editor, then test!

