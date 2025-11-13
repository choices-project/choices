-- ------------------------------------------------------------------
-- 20251112092000_refresh_divisions_from_openstates.sql
-- Adds helper function to rebuild representative_divisions from
-- OpenStates current roles and wires it to Supabase RPC.
-- ------------------------------------------------------------------

begin;

set search_path = public, extensions;

drop function if exists public.refresh_divisions_from_openstates cascade;

create function public.refresh_divisions_from_openstates()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_inserted integer := 0;
begin
  create temporary table tmp_divisions
  on commit drop as
  select distinct
    rc.id as representative_id,
    coalesce(nullif(cr.division, ''), nullif(cr.jurisdiction, '')) as division_id,
    case
      when coalesce(nullif(cr.division, ''), nullif(cr.jurisdiction, '')) ilike 'ocd-division/country:us/state:%/cd:%' then 'federal'
      when coalesce(nullif(cr.division, ''), nullif(cr.jurisdiction, '')) ilike 'ocd-division/country:us/state:%' then 'state'
      when coalesce(nullif(cr.division, ''), nullif(cr.jurisdiction, '')) ilike 'ocd-division/country:us/county:%' then 'local'
      else null
    end as level
  from public.openstates_people_current_roles_v cr
  join public.representatives_core rc
    on rc.openstates_id = cr.openstates_id
  where coalesce(cr.is_current, true)
    and coalesce(nullif(cr.division, ''), nullif(cr.jurisdiction, '')) is not null;

  delete from public.representative_divisions
  where source = 'openstates_yaml';

  insert into public.representative_divisions (
    representative_id,
    division_id,
    level,
    source,
    created_at,
    updated_at
  )
  select
    representative_id,
    left(division_id, 255),
    level,
    'openstates_yaml',
    now(),
    now()
  from tmp_divisions;
  get diagnostics v_inserted = row_count;

  return v_inserted;
end;
$$;

comment on function public.refresh_divisions_from_openstates() is
  'Rebuilds representative_divisions from OpenStates current roles.';

commit;


