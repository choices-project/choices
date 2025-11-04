# Apply PWA Migration - Simple Steps

**Migration File**: `database/migrations/20251104_pwa_push_subscriptions.sql`

---

## 🎯 Easiest Method: Supabase Dashboard

1. **Go to**: https://app.supabase.com/project/YOUR_PROJECT_ID/sql

2. **Click**: "New query" button (top right)

3. **Open file**: `database/migrations/20251104_pwa_push_subscriptions.sql`

4. **Copy & Paste** entire contents into SQL editor

5. **Click**: "Run" button (bottom right)

6. **Success**: You should see "Migration Complete - PWA Tables Created" ✅

**Time**: < 2 minutes

---

## Alternative: Command Line

### If you have DATABASE_URL in .env.local:

```bash
cd web
source ../.env.local  # or wherever your env file is
psql "$DATABASE_URL" -f database/migrations/20251104_pwa_push_subscriptions.sql
```

### If using Supabase CLI:

```bash
cd web

# Pull latest from remote first
supabase db pull

# Then your local migration will be synced, and you can push
supabase db push
```

---

## ✅ Verify It Worked

Run this in Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('push_subscriptions', 'notification_log', 'sync_log');
```

Should return 3 rows. ✅ Migration successful!

---

**Migration is idempotent** - safe to run multiple times if needed.

**Next step**: Install web-push and configure VAPID keys (see QUICK_START_GUIDE.md)

