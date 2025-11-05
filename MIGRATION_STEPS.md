# How to Apply Migrations

## Easiest Method: Supabase Dashboard

1. **Go to** https://supabase.com/dashboard/project/muqwrehywjrbaeerjgfb/editor

2. **Copy and paste** the contents of `APPLY_ALL_MIGRATIONS_NOV5.sql` into the SQL Editor

3. **Click "Run"**

4. **Verify success:** You should see:
   ```
   Tables created successfully!
   Functions created successfully!
   ```

5. **Regenerate types:**
   ```bash
   cd web
   npm run types:generate
   ```

---

## Alternative: Command Line

The combined SQL file is ready:
```bash
cat APPLY_ALL_MIGRATIONS_NOV5.sql
```

Contains 285 lines of SQL creating:
- ✅ civic_database_entries table
- ✅ update_poll_demographic_insights function  
- ✅ biometric_trust_scores table
- ✅ get_heatmap function

---

## After Applying

**Restart your app** and the following warnings should disappear:
- ✅ "civic_database_entries table not yet implemented"
- ✅ "update_poll_demographic_insights function not implemented"
- ✅ "biometric_trust_scores table doesn't exist"

**Analytics tracking will be fully functional!**

