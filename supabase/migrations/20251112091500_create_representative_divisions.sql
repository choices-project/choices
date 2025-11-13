-- ------------------------------------------------------------------
-- 20251112091500_create_representative_divisions.sql
-- Maps representatives to OCD division identifiers.
-- ------------------------------------------------------------------

create table if not exists public.representative_divisions (
  representative_id integer not null references public.representatives_core(id) on delete cascade,
  division_id text not null,
  level text,
  source text not null default 'openstates_yaml',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint representative_divisions_pkey primary key (representative_id, division_id)
);

comment on table public.representative_divisions is
  'Normalized mapping between representatives and OCD division identifiers.';

comment on column public.representative_divisions.level is 'High-level category (federal/state/local) when derivable.';
comment on column public.representative_divisions.source is 'Upstream source for the mapping (default openstates_yaml).';

create index if not exists representative_divisions_division_id_idx
  on public.representative_divisions (division_id);

-- grant permissions
grant select, insert, update, delete on table public.representative_divisions to service_role;
grant select on table public.representative_divisions to authenticated;
grant select on table public.representative_divisions to anon;

-- helper to maintain updated_at
create or replace function public.touch_representative_divisions()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create trigger trg_representative_divisions_updated_at
before update on public.representative_divisions
for each row
execute function public.touch_representative_divisions();


