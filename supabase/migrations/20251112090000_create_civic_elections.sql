-- ------------------------------------------------------------------
-- 20251112090000_create_civic_elections.sql
-- Introduces the civic_elections table and helper RPC for retrieving
-- upcoming elections filtered by OCD division identifiers.
-- ------------------------------------------------------------------

create table if not exists public.civic_elections (
  election_id text primary key,
  name text not null,
  election_day date not null,
  ocd_division_id text not null,
  fetched_at timestamptz not null default timezone('utc', now()),
  raw_payload jsonb
);

comment on table public.civic_elections is
  'Upcoming elections sourced from Google Civic Information API.';

comment on column public.civic_elections.ocd_division_id is
  'OCD division identifier (e.g., ocd-division/country:us/state:ca).';

create index if not exists civic_elections_election_day_idx
  on public.civic_elections (election_day);

create index if not exists civic_elections_ocd_division_id_idx
  on public.civic_elections (ocd_division_id);

-- Helper to fetch elections for a set of division prefixes.
create or replace function public.get_upcoming_elections(divisions text[])
returns table (
  election_id text,
  name text,
  election_day date,
  ocd_division_id text,
  fetched_at timestamptz
)
language sql
stable
as $function$
  select
    e.election_id,
    e.name,
    e.election_day,
    e.ocd_division_id,
    e.fetched_at
  from public.civic_elections e
  where e.election_day >= current_date
    and (
      divisions is null
      or array_length(divisions, 1) is null
      or exists (
        select 1
        from unnest(divisions) as div
        where e.ocd_division_id = div
           or e.ocd_division_id like div || '/%'
      )
    )
  order by e.election_day asc, e.election_id asc;
$function$;

comment on function public.get_upcoming_elections(text[]) is
  'Returns upcoming elections whose OCD division matches any supplied prefix.';


