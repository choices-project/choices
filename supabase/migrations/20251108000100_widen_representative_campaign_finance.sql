-- Widen representative_campaign_finance to capture richer finance insights.
alter table public.representative_campaign_finance
  add column if not exists cycle integer,
  add column if not exists small_donor_percentage numeric,
  add column if not exists top_contributors jsonb default '[]'::jsonb,
  add column if not exists office_code text,
  add column if not exists district text,
  add column if not exists sources text[] default '{}'::text[];


