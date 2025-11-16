## Cron: Backfill Poll Demographic Insights

- Method: POST
- URL: `/api/cron/backfill-poll-insights`
- Auth: Requires header `x-cron-secret: ${CRON_SECRET}` (or `Authorization: Bearer ${CRON_SECRET}`)
- Purpose: Iterates all polls and invokes `update_poll_demographic_insights(poll_id)` to precompute entries in `poll_demographic_insights`.

### Request

- Headers:
  - `Content-Type: application/json`
  - `x-cron-secret: ${CRON_SECRET}`
- Body: none

### Response

- 200 OK

```json
{
  "success": true,
  "data": {
    "message": "Backfill complete",
    "processed": 1204,
    "updated": 1204,
    "errors": 0
  }
}
```

- Error: 403 (invalid secret), 500 (database error)

### Notes

- Paginates through `polls` in batches (see route source for batch size).
- Safe to run repeatedly; the RPC performs upserts in `poll_demographic_insights`.
- Configure `CRON_SECRET` in your environment and your job runner (e.g., Vercel Cron, GitHub Actions).


