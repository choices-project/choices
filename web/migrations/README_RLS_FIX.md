# RLS Fix for Poll Vote Counts

## Problem

We were using `adminClient` everywhere to bypass RLS policies, which:
1. Defeats the purpose of Row Level Security
2. Could be a security risk if misused
3. Makes the code harder to understand and maintain
4. Doesn't fix the root cause

## Solution

Instead of bypassing RLS, we **fix the RLS policies** to allow legitimate operations:

### 1. Created `update_poll_vote_count()` Function

A secure function that:
- Recalculates vote counts from actual vote records (can't be faked)
- Uses `SECURITY DEFINER` to run with elevated privileges
- Ensures data integrity by always recalculating

### 2. Added Proper RLS Policies

- **`polls_creator_update`**: Poll creators can update their polls
- **`polls_vote_count_update`**: Users who have voted can trigger vote count updates
- **`polls_service_full`**: Service role has full access (for admin operations)

## Migration Steps

1. Run the migration: `fix_polls_rls_for_vote_counts.sql`
2. Update code to use the function instead of adminClient
3. Test thoroughly
4. Remove adminClient usage where no longer needed

## Code Changes Needed

### Before (using adminClient):
```typescript
const { error: updateError } = await adminClient
  .from('polls')
  .update({ total_votes: uniqueVoterCount })
  .eq('id', pollId);
```

### After (using RLS function):
```typescript
const { error: updateError } = await supabase
  .rpc('update_poll_vote_count', { poll_id_param: pollId });
```

## Benefits

1. ✅ Proper security: RLS policies enforce access control
2. ✅ Data integrity: Function ensures counts are always accurate
3. ✅ Maintainability: Clear, understandable code
4. ✅ Performance: Function can be optimized at database level
5. ✅ Safety: Can't accidentally update wrong fields

## Testing

After applying the migration, test:
1. Vote on a poll - count should update
2. Multiple users vote - count should be accurate
3. Ranked polls - count should work correctly
4. Poll creator updates - should still work
5. Unauthorized updates - should be blocked
