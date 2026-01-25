-- Add NOT NULL constraints on critical fields
-- Following Supabase best practices: ensure data integrity at schema level
-- Note: Backfill any NULLs before running this migration

begin;

-- Backfill any NULL values before adding constraints
-- Use safe defaults that won't break existing data
update public.representatives_core
set
  name = coalesce(name, 'Unknown'),
  level = coalesce(level, 'local'),
  state = coalesce(state, 'XX'),
  office = coalesce(office, 'Representative'),
  is_active = coalesce(is_active, false),
  data_quality_score = coalesce(data_quality_score, 0),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  name is null
  or level is null
  or state is null
  or office is null
  or is_active is null
  or data_quality_score is null
  or created_at is null
  or updated_at is null;

-- Add NOT NULL constraints on critical identification fields
alter table public.representatives_core
  alter column name set not null,
  alter column level set not null,
  alter column state set not null,
  alter column office set not null,
  alter column is_active set not null,
  alter column is_active set default false,
  alter column data_quality_score set not null,
  alter column data_quality_score set default 0;

-- Add NOT NULL constraints on timestamps with defaults
alter table public.representatives_core
  alter column created_at set not null,
  alter column created_at set default now(),
  alter column updated_at set not null,
  alter column updated_at set default now();

comment on column public.representatives_core.name is
  'Representative full name. Required.';
comment on column public.representatives_core.level is
  'Government level: federal, state, or local. Required.';
comment on column public.representatives_core.state is
  'US state code (2 letters, uppercase). Required.';
comment on column public.representatives_core.office is
  'Office title (e.g., "U.S. Senator", "State Representative"). Required.';
comment on column public.representatives_core.is_active is
  'Whether representative is currently in office. Defaults to false.';
comment on column public.representatives_core.data_quality_score is
  'Data quality score (0-100). Defaults to 0.';
comment on column public.representatives_core.created_at is
  'Timestamp when record was created. Auto-set to now().';
comment on column public.representatives_core.updated_at is
  'Timestamp when record was last updated. Auto-updated by trigger.';

commit;
