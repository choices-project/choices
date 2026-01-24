# Supabase Operations Guide

This runbook explains how to work with the Choices Supabase project (`muqwrehywjrbaeerjgfb`) from a local checkout. Use it whenever you need to run migrations, inspect schema, or regenerate TypeScript definitions.

## Prerequisites

- Install the Supabase CLI (v2.54.0 or newer). `brew install supabase/tap/supabase`
- Install `psql` (PostgreSQL client) for direct SQL access.
- Ensure you have project credentials:
  - `SUPABASE_ACCESS_TOKEN`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - Database password for the pooled user (`postgres.muqwrehywjrbaeerjgfb`).

Store credentials securely—do **not** commit them to git.

## Environment configuration

Populate `.env.local` in the **project root** with the Supabase values. Critical keys:

```
SUPABASE_ACCESS_TOKEN=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://postgres.muqwrehywjrbaeerjgfb:<PASSWORD>@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

- Always include the `postgres.<project-ref>` username and the pooled host (`pooler.supabase.com`).
- Keep the password in sync with the Supabase dashboard; rotations invalidate CLI access.

## Linking the project

From `supabase/` run:

```
supabase link --project-ref muqwrehywjrbaeerjgfb
```

The CLI stores the reference under `supabase/.temp/project-ref`, so subsequent commands know which project to target.

## Working with migrations

1. **Fetch remote history (one time or after teammates add migrations):**
   ```
   supabase migration fetch
   ```
2. **Review status:**
   ```
   supabase migration list
   ```
3. **Apply pending migrations to the linked project:**
   ```
   supabase db push
   ```

> If `db push` complains about missing versions, run `supabase migration fetch` first to pull down the remote-only migrations before pushing new ones.

## Running manual SQL

Use the pooled connection from `.env.local` (project root):

```
cd <project-root>
set -a && source .env.local && set +a
psql "$DATABASE_URL"
```

Inside `psql` you can run statements such as:

```
select * from public.poll_rankings limit 5;
\d+ public.poll_rankings
```

## Regenerating TypeScript types

After schema changes, regenerate the shared types used by the app:

```
cd <project-root>/web
npx supabase gen types typescript --project-id muqwrehywjrbaeerjgfb > types/supabase.ts
```

Commit the updated `web/types/supabase.ts` along with any new migration files so backend, frontend, and docs stay aligned.

## Common troubleshooting

- **Connection refused:** verify your IP is not temporarily banned in the Supabase dashboard and that the database is running.
- **Password authentication failed:** reset the database password in the dashboard and update `.env.local`.
- **Remote migration versions not found:** run `supabase migration fetch` to sync history before pushing new migrations.

Keep this guide handy so future database operations stay consistent across the team.
