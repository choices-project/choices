# 🚀 Quick RLS Deployment Guide

## **Option 1: Supabase Dashboard (Easiest)**

1. **Go to your Supabase project dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your Choices project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Copy and paste the RLS policies**
   - Open `database/rls-policies.sql` in this repository
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Execute the SQL**
   - Click "Run" to apply all RLS policies

## **Option 2: Supabase CLI (Recommended for future)**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (replace with your project ref)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy RLS policies
./database/deploy-rls-supabase.sh
```

## **Option 3: Direct Database Connection**

```bash
# Set your Supabase credentials
export SUPABASE_URL="your-supabase-project-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Deploy RLS policies
./database/deploy-rls.sh
```

## **✅ Verification Steps**

After deployment, verify RLS is working:

1. **Check RLS Status**
   ```sql
   SELECT 
       schemaname,
       tablename,
       rowsecurity
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('ia_users', 'ia_tokens', 'po_polls', 'po_votes');
   ```

2. **Test User Access**
   - Try accessing the dashboard as a logged-in user
   - Verify you can only see your own data
   - Test poll creation (should require T2+ tier)

3. **Test Anonymous Access**
   - Visit the site without logging in
   - Verify you can see active polls but not user data

## **🔧 What RLS Policies Do**

### **For Users:**
- ✅ Can view their own profile
- ✅ Can update their own profile
- ❌ Cannot see other users' emails (unless T2+)
- ❌ Cannot access admin functions (unless T3)

### **For Polls:**
- ✅ Anyone can view active polls
- ✅ T2+ users can create polls
- ✅ T3 users can manage all polls
- ❌ Anonymous users cannot create polls

### **For Votes:**
- ✅ Active users can vote on active polls
- ✅ Votes are immutable (cannot be changed/deleted)
- ✅ Only poll results are visible (not individual votes)

## **🚨 Important Notes**

1. **Backup First**: Consider backing up your data before applying RLS
2. **Test Thoroughly**: RLS can break existing functionality if not configured correctly
3. **Monitor Logs**: Watch for permission denied errors after deployment
4. **User Tiers**: Make sure your test users have appropriate verification tiers

## **🆘 Troubleshooting**

If you encounter issues:

1. **"Permission denied" errors**: Check user authentication and verification tier
2. **"Policy does not exist"**: Verify RLS policies were created successfully
3. **"RLS is not enabled"**: Run the ALTER TABLE commands manually

## **📞 Need Help?**

- Check the full documentation: `SUPABASE_RLS_SETUP.md`
- Review the SQL file: `database/rls-policies.sql`
- Test with the verification queries above
