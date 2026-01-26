# OpenStates Comprehensive Sync Guide

**Last Updated:** 2026-01-26

## Overview

This guide explains how to run comprehensive OpenStates data synchronization to populate all representative data in the database.

## Master Sync Script

The `sync-all.ts` script runs all OpenStates sync operations in the correct order:

1. **Contacts** - Email, phone, address (from YAML, no API calls)
2. **Social Media** - Twitter, Facebook, etc. (from YAML, no API calls)
3. **Photos** - Representative photos (from YAML, no API calls)
4. **Data Sources** - Data provenance tracking (from YAML, no API calls)
5. **Committees** - Committee assignments (from YAML, no API calls)
6. **Activity** - Bill activity (uses OpenStates API - rate limited)

## Usage

### Basic Usage

```bash
cd services/civics-backend
npm run openstates:sync:all
```

### Options

- `--states=CA,NY,TX` - Filter by specific states
- `--limit=100` - Limit number of representatives to process
- `--dry-run` - Preview what would be synced without making changes
- `--skip-activity` - Skip activity sync (API rate limited)
- `--federal-only` - Only sync federal representatives

### Examples

```bash
# Dry run to see what would be synced
npm run openstates:sync:all -- --dry-run --limit=10

# Sync only federal representatives
npm run openstates:sync:all -- --federal-only

# Sync specific states
npm run openstates:sync:all -- --states=CA,NY,TX

# Sync with activity (may take time due to rate limits)
npm run openstates:sync:all -- --limit=50

# Skip activity sync (faster, no API calls)
npm run openstates:sync:all -- --skip-activity
```

## Rate Limits

### Activity Sync

The activity sync uses the OpenStates API and is rate limited:
- **Daily Limit:** 10,000 requests/day
- **Throttle:** 6500ms between requests
- **Automatic Retry:** Exponential backoff for 429 errors

The script will:
- Track API usage and stop if daily limit reached
- Show progress every 10 representatives
- Log rate limit errors separately

### Best Practices

1. **Start with Federal:** Federal representatives are fewer and easier to sync
   ```bash
   npm run openstates:sync:all -- --federal-only
   ```

2. **Sync by State:** Process states in batches to avoid rate limits
   ```bash
   npm run openstates:sync:all -- --states=CA
   npm run openstates:sync:all -- --states=NY
   ```

3. **Skip Activity Initially:** Sync all other data first, then run activity separately
   ```bash
   # Sync everything except activity
   npm run openstates:sync:all -- --skip-activity
   
   # Then sync activity separately (respects rate limits)
   npm run openstates:sync:activity
   ```

4. **Monitor Progress:** Check logs for API usage and errors
   ```bash
   npm run openstates:sync:all -- --limit=100 2>&1 | tee sync.log
   ```

## Individual Sync Scripts

You can also run individual sync operations:

```bash
# Contacts only
npm run openstates:sync:contacts

# Social media only
npm run openstates:sync:social

# Photos only
npm run openstates:sync:photos

# Data sources only
npm run openstates:sync:data-sources

# Committees only
npm run openstates:sync:committees

# Activity only (uses API)
npm run openstates:sync:activity
```

## Data Populated

The sync scripts populate the following database tables:

- `representative_contacts` - Email, phone, address
- `representative_social_media` - Social media profiles
- `representative_photos` - Photo URLs
- `representative_data_sources` - Data provenance
- `representative_committees` - Committee assignments
- `representative_activity` - Bill activity (sponsorships, votes)

## Troubleshooting

### "No representatives with Supabase IDs found"

This means the baseline OpenStates YAML data hasn't been merged yet. Run:

```bash
npm run openstates:ingest
```

This will:
1. Sync OpenStates people YAML submodule
2. Stage the data
3. Merge into Supabase

### Rate Limit Errors

If you hit rate limits:
1. Wait for the daily limit to reset (24 hours)
2. Use `--skip-activity` to sync other data
3. Run activity sync separately with smaller batches

### Missing Data

If data is missing:
1. Check that OpenStates YAML submodule is up to date:
   ```bash
   npm run openstates:sync-people
   ```
2. Re-run the baseline ingest:
   ```bash
   npm run openstates:ingest
   ```
3. Re-run the sync:
   ```bash
   npm run openstates:sync:all
   ```

## Monitoring

The sync script provides detailed progress information:

```
🚀 Starting comprehensive OpenStates sync for 100 representatives...

📞 Syncing contacts...
✅ Contacts: 100 succeeded, 0 failed
   totalAdded: 250, totalSkipped: 50

📱 Syncing social media...
✅ Social Media: 100 succeeded, 0 failed

📷 Syncing photos...
✅ Photos: 100 succeeded, 0 failed

📊 Syncing data sources...
✅ Data Sources: 100 succeeded, 0 failed

🏛️  Syncing committees...
✅ Committees: 100 succeeded, 0 failed
   totalAssignments: 150

📜 Syncing activity (OpenStates API - may take time due to rate limits)...
Progress: 50/100 (50%). API usage: 50/10000 (9950 remaining)
✅ Activity: 100 succeeded, 0 failed
   activityRows: 800
   rateLimited: 0
   apiUsage: { dailyRequests: 100, dailyLimit: 10000, remaining: 9900 }

============================================================
📊 SYNC SUMMARY
============================================================
Total: 600 succeeded, 0 failed
============================================================
```

## Next Steps

After running the sync:

1. **Verify Data:** Check database for completeness
2. **Check Gaps:** Identify any missing data fields
3. **Run Federal Enrichment:** Congress.gov, FEC, GovInfo
4. **Run State Enrichment:** Google Civic API

See `ROADMAP.md` for full ingestion flow details.
