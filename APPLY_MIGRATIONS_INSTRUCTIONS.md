# Database Migration Instructions
**Date:** November 5, 2025  
**Migrations to Apply:** 4 new migrations

---

## Quick Start

### Option 1: Manual Application (Recommended)

1. **Open Supabase SQL Editor:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Navigate to SQL Editor

2. **Apply migrations in order:**

   **a) Civic Database Entries Table:**
   ```bash
   cat supabase/migrations/20251105000002_civic_database_entries.sql
   ```
   Copy and run in SQL Editor

   **b) Poll Demographic Insights Function:**
   ```bash
   cat supabase/migrations/20251105000003_poll_demographic_insights_function.sql
   ```
   Copy and run in SQL Editor

   **c) Biometric Trust Scores Table:**
   ```bash
   cat supabase/migrations/20251105000004_biometric_trust_scores.sql
   ```
   Copy and run in SQL Editor

   **d) Get Heatmap Function:**
   ```bash
   cat supabase/migrations/20251105000005_get_heatmap_function.sql
   ```
   Copy and run in SQL Editor

3. **Regenerate TypeScript types:**
   ```bash
   cd web
   npm run types:generate
   ```

4. **Verify:**
   ```bash
   # Check tables exist
   SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
     AND tablename IN ('civic_database_entries', 'biometric_trust_scores');
   
   # Check functions exist
   SELECT proname FROM pg_proc WHERE proname IN 
     ('update_poll_demographic_insights', 'get_heatmap');
   ```

---

### Option 2: Supabase CLI (If Linked)

If your project is linked to Supabase CLI:

```bash
# Make script executable
chmod +x apply_migrations_nov5.sh

# Set environment variables
export SUPABASE_PROJECT_REF="your-project-ref"
export DATABASE_URL="postgresql://..."

# Run script
./apply_migrations_nov5.sh
```

---

### Option 3: Combined SQL File

Run all at once:

```bash
cat supabase/migrations/20251105000002_civic_database_entries.sql \
    supabase/migrations/20251105000003_poll_demographic_insights_function.sql \
    supabase/migrations/20251105000004_biometric_trust_scores.sql \
    supabase/migrations/20251105000005_get_heatmap_function.sql \
    > /tmp/apply_all_migrations.sql

# Then paste /tmp/apply_all_migrations.sql into Supabase SQL Editor
```

---

## What These Migrations Do

### 1. civic_database_entries
**Purpose:** Track comprehensive user civic engagement

**Columns:**
- `stable_user_id` - User reference
- `total_polls_participated` - Engagement count
- `total_votes_cast` - Vote count
- `average_engagement_score` - Engagement metric
- `current_trust_tier` - Current tier
- `trust_tier_history` - JSONB history
- `user_hash` - Anonymized identifier

**Result:** Analytics service stops logging "table not implemented" warnings

---

### 2. update_poll_demographic_insights
**Purpose:** Update poll statistics and demographics

**Parameters:**
- `p_poll_id UUID` - Poll to update

**Result:** Analytics service stops logging "function not implemented" warnings

---

### 3. biometric_trust_scores
**Purpose:** Track trust scores from biometric authentication

**Columns:**
- `user_id` - User reference
- `trust_score` - Score 0-1
- `confidence_level` - Confidence 0-1
- `factors` - JSONB verification factors
- `device_info` - JSONB device context

**Result:** WebAuthn trust score endpoint can store scores

---

### 4. get_heatmap
**Purpose:** Privacy-safe geographic analytics with k-anonymity

**Parameters:**
- `prefixes TEXT[]` - Geohash prefixes
- `min_count INTEGER` - Minimum count (default 5 for k-anonymity)

**Returns:** Table of (geohash, count) pairs

**Result:** Civics heatmap API returns real data instead of random placeholders

---

## After Migration

### Expected Results:

**Console warnings that will disappear:**
```
✅ Warning: civic_database_entries table not yet implemented
✅ Warning: update_poll_demographic_insights function not implemented
✅ Warning: biometric_trust_scores table doesn't exist
```

**Features that will work fully:**
- ✅ Analytics tracking with database persistence
- ✅ Trust tier history tracking
- ✅ Poll demographic insights updates
- ✅ Biometric authentication trust scoring
- ✅ Geographic heatmap with real data

### Verify Migrations Worked:

```bash
# In your application logs, these warnings should stop appearing
grep "table not yet implemented" logs/
grep "function not implemented" logs/

# Should return no results after migration
```

---

## Rollback (If Needed)

If something goes wrong:

```sql
-- Rollback in reverse order
DROP FUNCTION IF EXISTS get_heatmap(TEXT[], INTEGER);
DROP TABLE IF EXISTS biometric_trust_scores CASCADE;
DROP FUNCTION IF EXISTS update_poll_demographic_insights(UUID);
DROP TABLE IF EXISTS civic_database_entries CASCADE;
```

---

## Migration Checklist

- [ ] Apply civic_database_entries migration
- [ ] Apply update_poll_demographic_insights migration
- [ ] Apply biometric_trust_scores migration
- [ ] Apply get_heatmap migration
- [ ] Regenerate TypeScript types
- [ ] Deploy updated application
- [ ] Monitor logs for warnings
- [ ] Verify analytics tracking works

---

**Total Time:** 15-20 minutes  
**Complexity:** Low  
**Risk:** Low (all tables have IF NOT EXISTS)

