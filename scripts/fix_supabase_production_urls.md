# Fix Supabase Production URL Configuration

## 🚨 **Current Issue**
Magic links are still redirecting to `localhost:3000` even when generated from production. This means Supabase is not properly configured for production URLs.

## 🔧 **Solution Steps**

### 1. **Check Current Supabase Configuration**

Go to your Supabase Dashboard:
- **URL**: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]
- **Navigate to**: Authentication > URL Configuration

### 2. **Update Site URL**
Set the **Site URL** to:
```
https://choices-platform.vercel.app
```

### 3. **Update Redirect URLs**
Add these **Redirect URLs**:
```
https://choices-platform.vercel.app/auth/callback
https://choices-platform.vercel.app/auth/verify
http://localhost:3000/auth/callback
http://localhost:3000/auth/verify
```

### 4. **Check Email Templates**
Go to **Authentication > Email Templates** and ensure:
- **Confirm Signup** template uses `{{ .ConfirmationURL }}`
- **Magic Link** template uses `{{ .ConfirmationURL }}`
- **Reset Password** template uses `{{ .ConfirmationURL }}`

### 5. **Test the Fix**

1. **Clear your browser cache**
2. **Go to production**: https://choices-platform.vercel.app/login
3. **Request a new magic link**
4. **Check the email** - the link should now contain `https://choices-platform.vercel.app`
5. **Click the link** - it should work correctly

## 🔍 **Why This Happens**

1. **Supabase caches URL configurations**
2. **Magic links contain the Site URL** where they were generated
3. **If Site URL is localhost**, all magic links will redirect to localhost
4. **Production magic links need production Site URL**

## ✅ **Verification**

After making these changes:
- Magic links should contain `https://choices-platform.vercel.app`
- Authentication should work in both environments
- Smart redirect system should function correctly

## 🚀 **Next Steps**

1. Update Supabase configuration
2. Test with fresh magic link from production
3. Verify smart redirect system works
4. Deploy any remaining changes
