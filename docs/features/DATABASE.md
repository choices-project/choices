# Database Documentation

**Created**: January 27, 2025  
**Updated**: January 27, 2025  
**Status**: ✅ PRODUCTION READY

## Overview

This document provides comprehensive documentation for the Choices database system, including schema details, access patterns, and integration guidelines.

## Database Configuration

### Environment Variables

The following environment variables are required for database access:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://muqwrehywjrbaeerjgfb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

### Connection Methods

#### 1. Server-Side (Recommended)
```typescript
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/utils/supabase/server';

// For regular operations (respects RLS)
const supabase = await getSupabaseServerClient();

// For admin operations (bypasses RLS)
const adminSupabase = await getSupabaseAdminClient();
```

#### 2. Client-Side
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

#### 3. Direct REST API (For Testing)
```typescript
const response = await fetch(`${SUPABASE_URL}/rest/v1/table_name`, {
  headers: {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  }
});
```

## Database Schema

### Core Tables

#### 1. `polls` Table
Primary table for storing poll data.

**Schema**:
```sql
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL,
  voting_method TEXT NOT NULL CHECK (voting_method IN ('single', 'multiple')),
  privacy_level TEXT NOT NULL DEFAULT 'public',
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'active',
  total_votes INTEGER DEFAULT 0,
  participation INTEGER DEFAULT 0,
  sponsors TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  end_time TIMESTAMPTZ,
  is_mock BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  primary_hashtag VARCHAR,
  poll_settings JSONB DEFAULT '{}',
  total_views INTEGER DEFAULT 0,
  engagement_score NUMERIC DEFAULT 0,
  trending_score NUMERIC DEFAULT 0,
  is_trending BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  last_modified_by UUID REFERENCES auth.users(id),
  modification_reason TEXT,
  baseline_at TIMESTAMPTZ,
  allow_post_close BOOLEAN DEFAULT false,
  allow_reopen BOOLEAN DEFAULT false,
  close_reason TEXT,
  closed_at TIMESTAMPTZ,
  reopened_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES auth.users(id),
  lock_reason TEXT,
  unlock_at TIMESTAMPTZ,
  is_locked BOOLEAN DEFAULT false,
  lock_type TEXT DEFAULT 'manual',
  lock_duration INTEGER,
  auto_lock_at TIMESTAMPTZ,
  lock_notifications_sent BOOLEAN DEFAULT false,
  lock_metadata JSONB DEFAULT '{}',
  end_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  mock_data JSONB DEFAULT '{}',
  participation_rate NUMERIC DEFAULT 0.00,
  verification_status TEXT DEFAULT 'unverified',
  verification_notes TEXT,
  moderation_status TEXT DEFAULT 'approved',
  moderation_notes TEXT,
  moderation_reviewed_by UUID REFERENCES auth.users(id),
  moderation_reviewed_at TIMESTAMPTZ
);
```

**Key Fields**:
- `voting_method`: Must be `'single'` or `'multiple'` (not `'single_choice'`)
- `privacy_level`: Controls RLS access (`'public'`, `'private'`)
- `created_by`: Must reference valid user ID from `auth.users`
- `status`: `'draft'`, `'active'`, `'closed'`

#### 2. `votes` Table
Stores individual votes for polls.

**Schema**:
```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  selected_options JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_anonymous BOOLEAN DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  vote_weight NUMERIC DEFAULT 1.0,
  verification_token TEXT,
  is_verified BOOLEAN DEFAULT false
);
```

#### 3. `user_profiles` Table
Extended user profile information.

**Schema**:
```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  trust_tier TEXT DEFAULT 'basic',
  is_admin BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ,
  privacy_settings JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}'
);
```

#### 4. `representatives_core` Table
Core representative data for civics functionality.

**Schema**:
```sql
CREATE TABLE representatives_core (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  level TEXT NOT NULL,
  office TEXT,
  party TEXT,
  district TEXT,
  contact_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Row Level Security (RLS)

### RLS Policies

The database uses Row Level Security to control data access:

#### Polls Table Policies

1. **INSERT Policy**: `"Users can create polls"`
   - **Command**: `INSERT`
   - **Qualification**: `(auth.uid() = created_by)`

2. **DELETE Policy**: `"Users can delete their own polls"`
   - **Command**: `DELETE`
   - **Qualification**: `(auth.uid() = created_by)`

3. **UPDATE Policy**: `"Users can update their own polls"`
   - **Command**: `UPDATE`
   - **Qualification**: `(auth.uid() = created_by)`

4. **SELECT Policy (Public)**: `"Users can view public polls"`
   - **Command**: `SELECT`
   - **Qualification**: `(privacy_level = 'public'::text)`

5. **SELECT Policy (Own)**: `"Users can view their own polls"`
   - **Command**: `SELECT`
   - **Qualification**: `(auth.uid() = created_by)`

### Bypassing RLS

For admin operations, use the service role key:

```typescript
// This bypasses RLS
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

## Data Access Patterns

### 1. Querying Public Polls

```typescript
const { data: publicPolls, error } = await supabase
  .from('polls')
  .select('*')
  .eq('privacy_level', 'public')
  .eq('status', 'active');
```

### 2. Querying User's Own Polls

```typescript
const { data: userPolls, error } = await supabase
  .from('polls')
  .select('*')
  .eq('created_by', userId);
```

### 3. Creating a Poll

```typescript
const newPoll = {
  title: 'Test Poll',
  description: 'Test Description',
  options: ['Option 1', 'Option 2'],
  voting_method: 'single', // Must be 'single' or 'multiple'
  status: 'active',
  created_by: 'valid-user-id', // Must be valid user ID
  privacy_level: 'public',
  category: 'test'
};

const { data, error } = await supabase
  .from('polls')
  .insert(newPoll)
  .select();
```

### 4. Admin Operations

```typescript
// Use admin client for operations that bypass RLS
const adminSupabase = await getSupabaseAdminClient();

const { data: allPolls, error } = await adminSupabase
  .from('polls')
  .select('*');
```

## Integration Testing

### Database Seeding

For integration tests, use the correct data format:

```typescript
const testPoll = {
  title: 'Test Poll',
  description: 'Test Description',
  options: ['Option 1', 'Option 2'],
  voting_method: 'single', // Correct value
  status: 'active',
  created_by: '6f12e40c-fd46-4ace-9470-2016dc0e2e8b', // Valid user ID
  privacy_level: 'public',
  category: 'test'
};
```

### Test Data Cleanup

```typescript
// Clean up test data after tests
await supabase
  .from('polls')
  .delete()
  .like('title', 'Test%');
```

## Common Issues and Solutions

### 1. Empty Query Results

**Problem**: Queries return `{ data: [], error: null }`

**Solution**: 
- Ensure you're using the correct client (admin vs regular)
- Check RLS policies
- Verify user authentication

### 2. Foreign Key Constraint Errors

**Problem**: `Key (created_by)=(uuid) is not present in table "users"`

**Solution**: Use valid user IDs from the `auth.users` table

### 3. Check Constraint Violations

**Problem**: `violates check constraint "polls_voting_method_check"`

**Solution**: Use correct values:
- `voting_method`: `'single'` or `'multiple'` (not `'single_choice'`)
- `status`: `'draft'`, `'active'`, or `'closed'`
- `privacy_level`: `'public'` or `'private'`

### 4. RLS Blocking Access

**Problem**: Service role key not bypassing RLS

**Solution**: Use the admin client configuration:

```typescript
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

## Performance Considerations

### 1. Indexing

Key indexes are automatically created:
- Primary keys
- Foreign keys
- RLS policy columns

### 2. Query Optimization

```typescript
// Use specific column selection
const { data } = await supabase
  .from('polls')
  .select('id, title, status')
  .eq('privacy_level', 'public');

// Use pagination for large datasets
const { data } = await supabase
  .from('polls')
  .select('*')
  .range(0, 9); // First 10 records
```

### 3. Connection Pooling

Supabase handles connection pooling automatically. For high-traffic applications, consider:
- Using read replicas
- Implementing caching strategies
- Optimizing query patterns

## Security Best Practices

### 1. Environment Variables

- Never commit secrets to version control
- Use different keys for different environments
- Rotate keys regularly

### 2. RLS Policies

- Always use RLS for user data
- Test policies thoroughly
- Use admin client only when necessary

### 3. Input Validation

```typescript
// Validate input before database operations
const validatePollData = (poll: any) => {
  if (!poll.title || !poll.options || !poll.voting_method) {
    throw new Error('Invalid poll data');
  }
  
  if (!['single', 'multiple'].includes(poll.voting_method)) {
    throw new Error('Invalid voting method');
  }
};
```

## Monitoring and Debugging

### 1. Query Logging

```typescript
// Enable query logging in development
const supabase = createClient(url, key, {
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'choices-app'
    }
  }
});
```

### 2. Error Handling

```typescript
const { data, error } = await supabase
  .from('polls')
  .select('*');

if (error) {
  console.error('Database error:', error);
  // Handle specific error types
  if (error.code === '23505') {
    // Handle unique constraint violation
  }
}
```

### 3. Performance Monitoring

- Monitor query execution times
- Track RLS policy performance
- Monitor connection usage

## Migration Guidelines

### 1. Schema Changes

- Always test migrations in development first
- Use Supabase migrations for schema changes
- Backup data before major changes

### 2. Data Migration

```sql
-- Example: Add new column with default value
ALTER TABLE polls ADD COLUMN new_field TEXT DEFAULT 'default_value';

-- Update existing records
UPDATE polls SET new_field = 'calculated_value' WHERE condition;
```

### 3. RLS Policy Updates

```sql
-- Drop old policy
DROP POLICY "old_policy_name" ON polls;

-- Create new policy
CREATE POLICY "new_policy_name" ON polls
  FOR SELECT USING (privacy_level = 'public');
```

## Troubleshooting

### 1. Connection Issues

- Verify environment variables
- Check network connectivity
- Validate Supabase project status

### 2. Authentication Issues

- Ensure correct key usage
- Check user session validity
- Verify RLS policies

### 3. Data Consistency

- Monitor foreign key relationships
- Check constraint violations
- Validate data types

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Note**: This documentation is maintained as part of the Choices project. For updates or corrections, please refer to the project repository.
