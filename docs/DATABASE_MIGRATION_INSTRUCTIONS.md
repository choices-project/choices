# PWA Database Migration Instructions

**Migration File**: `web/database/migrations/20251104_pwa_push_subscriptions.sql`  
**Date**: November 4, 2025  
**Purpose**: Add PWA push notification and background sync tables

---

## What This Migration Does

### Creates 3 New Tables
1. **push_subscriptions** - Web Push notification subscriptions
2. **notification_log** - Sent notification tracking
3. **sync_log** - Background sync operation tracking

### Enhances 4 Existing Tables
Adds `offline_synced` columns to:
- `votes` - Track offline votes
- `civic_actions` - Track offline civic engagement
- `contact_messages` - Track offline messages
- `polls` - Track offline poll creation

### Creates Security Policies
- 12 RLS policies for secure access
- User-scoped data access
- Admin viewing permissions
- Service role for API operations

### Creates Cleanup Functions
- `cleanup_old_notification_logs()` - Remove logs >30 days
- `cleanup_inactive_subscriptions()` - Remove inactive >90 days  
- `cleanup_old_sync_logs()` - Remove logs >90 days

---

## How to Run the Migration

### Option 1: Local PostgreSQL
```bash
cd web
psql -U your_username -d choices_db -f database/migrations/20251104_pwa_push_subscriptions.sql
```

### Option 2: Supabase CLI (Recommended)
```bash
# Make sure you're authenticated
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply migration
supabase db push

# Or manually:
supabase db execute -f database/migrations/20251104_pwa_push_subscriptions.sql
```

### Option 3: Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project
3. Go to "SQL Editor"
4. Create new query
5. Paste contents of `20251104_pwa_push_subscriptions.sql`
6. Click "Run"

### Option 4: Node.js Script
```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sql = fs.readFileSync(
  'web/database/migrations/20251104_pwa_push_subscriptions.sql',
  'utf8'
);

// Execute migration
// Note: Supabase JS client doesn't support raw SQL directly
// Use Supabase CLI or Dashboard instead
```

---

## Verification

### Check Tables Were Created
```sql
-- Should return 3 rows
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('push_subscriptions', 'notification_log', 'sync_log');
```

### Check Columns Were Added
```sql
-- Check votes table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'votes' 
AND column_name IN ('offline_synced', 'offline_timestamp');

-- Should return 2 rows
```

### Check RLS Policies
```sql
-- Should return 12 policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('push_subscriptions', 'notification_log', 'sync_log');
```

### Check Functions
```sql
-- Should return 3 functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE 'cleanup_%' 
AND routine_schema = 'public';
```

---

## Rollback (If Needed)

```sql
-- Drop tables (cascades to related data)
DROP TABLE IF EXISTS public.sync_log CASCADE;
DROP TABLE IF EXISTS public.notification_log CASCADE;
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;

-- Remove columns from existing tables
ALTER TABLE public.votes DROP COLUMN IF EXISTS offline_synced;
ALTER TABLE public.votes DROP COLUMN IF EXISTS offline_timestamp;
ALTER TABLE public.civic_actions DROP COLUMN IF EXISTS offline_synced;
ALTER TABLE public.contact_messages DROP COLUMN IF EXISTS offline_synced;
ALTER TABLE public.polls DROP COLUMN IF EXISTS offline_created;

-- Drop functions
DROP FUNCTION IF EXISTS cleanup_old_notification_logs();
DROP FUNCTION IF EXISTS cleanup_inactive_subscriptions();
DROP FUNCTION IF EXISTS cleanup_old_sync_logs();
```

---

## Post-Migration

### Update Schema Count
The database now has:
- **67 tables** (was 64, +3)
- **36 RPC functions** (was 33, +3)

### Enable PWA Features
No additional configuration needed - features activate once:
1. Migration is applied ✅
2. VAPID keys are configured
3. `web-push` package is installed

---

## Troubleshooting

### Error: "relation already exists"
- Migration uses `CREATE TABLE IF NOT EXISTS` - safe to run multiple times
- If error persists, tables exist and migration succeeded

### Error: "column already exists"
- Migration uses `DO $$ BEGIN IF NOT EXISTS` - safe to run multiple times
- Columns exist and migration succeeded

### Error: "permission denied"
- Ensure you're using a user with CREATE TABLE permissions
- Or use Supabase service role key

### Tables Created But RLS Not Working
- Run: `SELECT * FROM pg_policies WHERE tablename = 'push_subscriptions';`
- Should see 5+ policies
- If not, re-run migration file

---

## Next Steps After Migration

1. ✅ Migration applied
2. Install `web-push`: `npm install web-push`
3. Generate VAPID keys: `npx web-push generate-vapid-keys`
4. Add keys to `.env.local`
5. Restart dev server
6. Test PWA features!

---

**Migration Ready**: File is idempotent (safe to run multiple times)  
**Schema Validated**: Follows project conventions  
**Security**: Full RLS policies implemented

*Last Updated: November 4, 2025*

