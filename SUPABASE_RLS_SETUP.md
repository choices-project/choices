# Supabase Row Level Security (RLS) Setup Guide

## 🎯 **Overview**

This guide explains how to set up Row Level Security (RLS) policies for the Choices platform on Supabase. RLS ensures that users can only access data they're authorized to see, providing a robust security layer at the database level.

## 🔐 **What is RLS?**

Row Level Security (RLS) is a PostgreSQL feature that restricts which rows users can access in database tables. It's implemented through policies that define access rules based on user authentication and authorization levels.

## 📋 **Table Structure**

Our platform uses these main tables with RLS:

### **1. ia_users** - User Accounts
- `id`: Primary key
- `stable_id`: Unique user identifier (matches Supabase auth.uid())
- `email`: User email address
- `verification_tier`: Trust level (T0, T1, T2, T3)
- `is_active`: Account status

### **2. ia_tokens** - Authentication Tokens
- `user_stable_id`: Links to user
- `poll_id`: Associated poll
- `token_hash`: Encrypted token
- `scope`: Token permissions

### **3. po_polls** - Polls
- `poll_id`: Unique poll identifier
- `title`: Poll question
- `status`: Active/inactive
- `options`: JSON array of choices

### **4. po_votes** - Votes
- `poll_id`: Associated poll
- `token`: Voting token
- `choice`: Selected option
- `voted_at`: Timestamp

## 🛡️ **RLS Policies**

### **User Access Control**

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON ia_users
    FOR SELECT USING (
        auth.uid()::text = stable_id OR
        verification_tier IN ('T2', 'T3')
    );
```

**What this means:**
- Users can always see their own profile
- Trusted users (T2, T3) can see other profiles
- Anonymous users cannot see any profiles

### **Poll Access Control**

```sql
-- Anyone can view active polls
CREATE POLICY "Anyone can view active polls" ON po_polls
    FOR SELECT USING (
        status = 'active' OR
        verification_tier IN ('T2', 'T3')
    );
```

**What this means:**
- Active polls are publicly readable
- Trusted users can see all polls (including inactive)
- Only trusted users can create polls

### **Voting Security**

```sql
-- Users can vote on active polls
CREATE POLICY "Users can vote on active polls" ON po_votes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM po_polls 
            WHERE poll_id = po_votes.poll_id 
            AND status = 'active'
        ) AND
        EXISTS (
            SELECT 1 FROM ia_users 
            WHERE stable_id = auth.uid()::text 
            AND is_active = true
        )
    );
```

**What this means:**
- Only active users can vote
- Only active polls accept votes
- Votes are immutable (cannot be updated/deleted)

## 🚀 **Deployment Options**

### **Option 1: Supabase CLI (Recommended)**

```bash
# Install Supabase CLI
npm install -g supabase

# Deploy RLS policies
./database/deploy-rls-supabase.sh
```

### **Option 2: Direct SQL Execution**

```bash
# Set environment variables
export SUPABASE_URL="your-project-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Deploy RLS policies
./database/deploy-rls.sh
```

### **Option 3: Manual Dashboard Deployment**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database/rls-policies.sql`
4. Execute the SQL

## 🔍 **Verification**

### **Check RLS Status**

```sql
-- Verify RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('ia_users', 'ia_tokens', 'po_polls', 'po_votes');
```

### **Test Policies**

```sql
-- Test user access (run as authenticated user)
SELECT * FROM ia_users WHERE stable_id = auth.uid()::text;

-- Test poll access
SELECT * FROM po_polls WHERE status = 'active';

-- Test vote creation
INSERT INTO po_votes (poll_id, token, choice) 
VALUES ('test-poll', 'test-token', 1);
```

## 🛠️ **Troubleshooting**

### **Common Issues**

1. **"RLS is not enabled"**
   ```sql
   ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
   ```

2. **"Policy does not exist"**
   - Check if policies were created successfully
   - Verify policy names match exactly

3. **"Permission denied"**
   - Ensure user is authenticated
   - Check user's verification tier
   - Verify user is active

### **Debugging Queries**

```sql
-- Check current user
SELECT auth.uid(), auth.role();

-- Check user verification tier
SELECT verification_tier FROM ia_users WHERE stable_id = auth.uid()::text;

-- Test policy conditions
SELECT * FROM ia_users WHERE auth.uid()::text = stable_id;
```

## 🔧 **Customization**

### **Adding New Policies**

```sql
-- Example: Allow users to see poll results
CREATE POLICY "Users can view poll results" ON po_polls
    FOR SELECT USING (
        status = 'completed' OR
        auth.uid()::text IN (
            SELECT stable_id FROM ia_users 
            WHERE verification_tier IN ('T2', 'T3')
        )
    );
```

### **Modifying Existing Policies**

```sql
-- Drop existing policy
DROP POLICY "Policy name" ON table_name;

-- Create new policy
CREATE POLICY "New policy name" ON table_name
    FOR SELECT USING (your_condition);
```

## 📚 **Best Practices**

1. **Always test policies** with different user roles
2. **Use specific conditions** rather than broad permissions
3. **Document policy purposes** in comments
4. **Regularly audit** access patterns
5. **Monitor policy performance** for large datasets

## 🔗 **Related Documentation**

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Choices Platform Security Standards](./SECURITY_STANDARDS.md)
