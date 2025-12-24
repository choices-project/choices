# Verify Supabase Keys Are Correct

**Issue:** Service role key exists in Vercel but is invalid  
**Error:** `"Invalid API key"` when trying to use it

---

## 🔍 The Problem

Your Vercel environment shows:
- ✅ `hasServiceRoleKey: true` (variable exists)
- ❌ `"Invalid API key"` (the value is wrong)

This means the key was set, but it's not valid for your Supabase project.

---

## ✅ Step-by-Step Fix

### Step 1: Get the CORRECT Keys from Supabase

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   
2. **Select YOUR project** (verify project name!)
   - Look for project: `choices` or similar
   - **Check the URL** - it should show your project ID
   
3. **Go to Settings → API:**
   - Click **Settings** (gear icon, left sidebar)
   - Click **API**
   
4. **Copy ALL THREE keys:**

   **a) Project URL:**
   ```
   Should look like: https://muqwrehywjrbaeerjgfb.supabase.co
   ```
   
   **b) anon/public key:**
   - Click "Reveal" next to `anon public`
   - Click the **copy icon** (don't manually select)
   - Should start with: `eyJhbGc...`
   - Length: ~200-300 characters
   
   **c) service_role key (SECRET):**
   - Click "Reveal" next to `service_role`
   - Click the **copy icon** (don't manually select)
   - Should start with: `eyJhbGc...`
   - Length: ~200-300 characters
   - ⚠️ **Different from anon key!**

---

### Step 2: Update Vercel Environment Variables

1. **Go to Vercel Dashboard:**
   - https://vercel.com/[your-account]/[project]/settings/environment-variables
   
2. **For EACH variable below:**
   - Click the **"..."** menu next to the variable
   - Click **"Edit"**
   - **Delete the old value completely**
   - **Paste the new value** (Ctrl+V / Cmd+V)
   - **Select "Production" only** (uncheck Preview/Development)
   - Click **"Save"**

   **Variables to update:**
   
   a) `NEXT_PUBLIC_SUPABASE_URL`
   ```
   Value: https://muqwrehywjrbaeerjgfb.supabase.co
   Environment: ☑ Production only
   ```
   
   b) `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   ```
   Value: eyJhbGc... (paste full anon key)
   Environment: ☑ Production only
   ```
   
   c) `SUPABASE_SERVICE_ROLE_KEY`
   ```
   Value: eyJhbGc... (paste full service_role key)
   Environment: ☑ Production only
   ```

---

### Step 3: Verify Keys Before Saving

**Double-check these common mistakes:**

- [ ] Keys start with `eyJhbGc` (not truncated)
- [ ] Keys are ~200-300 characters long
- [ ] No extra spaces or newlines at start/end
- [ ] anon key ≠ service_role key (they're different!)
- [ ] Project URL matches your Supabase project
- [ ] All 3 variables set to "Production" only

---

### Step 4: Force Redeploy

After saving all 3 variables:

```bash
cd /Users/alaughingkitsune/src/Choices
git commit --allow-empty -m "chore: trigger redeploy after fixing Supabase keys"
git push
```

**Wait 2-3 minutes** for deployment to complete.

---

### Step 5: Test

```bash
# Test diagnostics (should now show "healthy")
curl https://choices-app.com/api/diagnostics | jq '{
  overallStatus: .data.overallStatus,
  feedbackTable: .data.checks.feedbackTable.status,
  environment: .data.checks.environment
}'

# Expected result:
# {
#   "overallStatus": "degraded",  # or "healthy" if logged in
#   "feedbackTable": "ok",
#   "environment": {
#     "hasSupabaseUrl": true,
#     "hasSupabaseAnonKey": true,
#     "hasServiceRoleKey": true,
#     "nodeEnv": "production"
#   }
# }
```

---

## 🔍 How to Verify Keys Are Correct

### Test 1: Check Key Format

```bash
# Service role key should:
# - Start with: eyJhbGc
# - Be ~200-300 characters
# - Contain dots (.) separating 3 parts: header.payload.signature

# Example (truncated):
# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11cXdyZWh5d2pyYmFlZXJqZ2ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYzODMwODQwMCwiZXhwIjoxOTUzODg0NDAwfQ.SIGNATURE_HERE
```

### Test 2: Decode JWT (Optional)

```bash
# Copy your service_role key and paste it here:
# https://jwt.io/

# Check the payload should show:
# {
#   "iss": "supabase",
#   "ref": "muqwrehywjrbaeerjgfb",  # <-- Should match your project ID
#   "role": "service_role",          # <-- Should say "service_role"
#   "iat": ...,
#   "exp": ...
# }

# If "ref" doesn't match your project ID → WRONG KEY!
# If "role" says "anon" → YOU COPIED THE WRONG KEY!
```

---

## 🚨 Common Issues

### Issue #1: Copied anon key instead of service_role
**Symptom:** Permission denied  
**Fix:** Copy the **service_role** key (not anon)

### Issue #2: Key from different project
**Symptom:** "Invalid API key"  
**Fix:** Verify project ID in Supabase dashboard matches your URL

### Issue #3: Truncated key
**Symptom:** "Invalid API key"  
**Fix:** Use the copy icon in Supabase dashboard (don't manually select)

### Issue #4: Extra whitespace
**Symptom:** "Invalid API key"  
**Fix:** Paste into a text editor first, remove any spaces/newlines, then paste into Vercel

### Issue #5: Set for wrong environment
**Symptom:** Works locally but not in production  
**Fix:** Ensure variables are set for "Production" environment in Vercel

---

## 📋 Checklist

Before proceeding, verify:

- [ ] I'm in the correct Supabase project
- [ ] I copied the service_role key (not anon)
- [ ] The key starts with `eyJhbGc`
- [ ] The key is ~200-300 characters long
- [ ] I used the copy icon (not manual selection)
- [ ] I pasted directly into Vercel (no text editor)
- [ ] All 3 variables are set to "Production" only
- [ ] I triggered a redeploy after saving
- [ ] I waited 2-3 minutes for deployment

---

**Next:** After completing all steps, run the test command above to verify!

