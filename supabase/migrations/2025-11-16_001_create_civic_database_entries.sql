-- Create civic_database_entries table used by AnalyticsService
-- Safe to run multiple times: use IF NOT EXISTS guards.

create table if not exists public.civic_database_entries (
  id uuid primary key default gen_random_uuid(),
  stable_user_id uuid not null,
  user_hash text not null,
  total_polls_participated integer not null default 0,
  total_votes_cast integer not null default 0,
  average_engagement_score numeric not null default 0,
  current_trust_tier text not null default 'T0',
  trust_tier_history jsonb not null default '[]'::jsonb,
  trust_tier_upgrade_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Uniqueness per stable_user_id (one row per stable user)
create unique index if not exists civic_database_entries_stable_user_id_idx
  on public.civic_database_entries (stable_user_id);

-- Helpful filtering
create index if not exists civic_database_entries_trust_tier_idx
  on public.civic_database_entries (current_trust_tier);

-- Trigger to maintain updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists civic_database_entries_set_updated_at on public.civic_database_entries;
create trigger civic_database_entries_set_updated_at
before update on public.civic_database_entries
for each row
execute procedure public.set_updated_at();

-- Grant basic access (adjust to your security model)
grant select, insert, update on table public.civic_database_entries to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;


