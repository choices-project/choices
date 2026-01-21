# Scripts Directory

This directory contains utility scripts for database migrations and maintenance.

## Security Fix Scripts

### apply-security-fix-direct.ts

Applies the RLS policy security fixes directly via Supabase REST API.

**Usage:**
```bash
cd web
npx tsx ../scripts/apply-security-fix-direct.ts
```

**Requirements:**
- `.env.local` file in `web/` directory with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

**What it does:**
- Fixes overly permissive RLS policies on:
  - `analytics_events`
  - `analytics_event_data`
  - `bot_detection_logs`
  - `cache_performance_log`
  - `voter_registration_resources_view`

## Environment Variables

All scripts load environment variables from `web/.env.local` using dotenv.

**Never commit credentials to git!** The `.env.local` file is already in `.gitignore`.

## Index Optimization

### review-index-recommendations.ts

Reviews slow queries and helps generate index migration files.

**Usage:**
```bash
cd web
npx tsx ../scripts/review-index-recommendations.ts
```

**Features:**
- Queries slow queries from `pg_stat_statements`
- Helps identify index candidates
- Generates migration files for recommended indexes

**See also:** `docs/INDEX_OPTIMIZATION_GUIDE.md`

## Security Notes

- Scripts use the service role key which has full database access
- Only run these scripts in trusted environments
- Never expose service role keys in client-side code
- Review migration SQL before executing
