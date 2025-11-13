-- ------------------------------------------------------------------
-- 20251112093100_update_refresh_divisions_function.sql
-- Normalises division identifiers when refreshing representative_divisions.
-- ------------------------------------------------------------------

begin;

set search_path = public, extensions;

create or replace function public.refresh_divisions_from_openstates()
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
  with raw as (
    select
      rc.id as representative_id,
      rc.level as representative_level,
      coalesce(nullif(cr.division, ''), nullif(cr.jurisdiction, '')) as raw_division,
      lower(cr.state_code) as state_code,
      lower(rc.state) as fallback_state,
      cr.role_type,
      cr.district
    from public.openstates_people_current_roles_v cr
    join public.representatives_core rc
      on rc.openstates_id = cr.openstates_id
    where coalesce(cr.is_current, true)
  )
  select distinct
    representative_id,
    case
      when raw_division ilike 'ocd-division/%' then lower(raw_division)
      when raw_division ilike 'ocd-jurisdiction/%/government' then
        lower(regexp_replace(regexp_replace(raw_division, '^ocd-jurisdiction', 'ocd-division'), '/government$', ''))
      when raw_division ilike 'ocd-jurisdiction/%' then lower(regexp_replace(raw_division, '^ocd-jurisdiction', 'ocd-division'))
      when raw_division ilike 'state:%' then 'ocd-division/country:us/state:' || substring(raw_division from 'state:([a-z]{2})')
      when raw_division ilike 'ocd-division:%' then lower(raw_division)
      when state_code is not null then 'ocd-division/country:us/state:' || state_code
      when fallback_state is not null then 'ocd-division/country:us/state:' || fallback_state
      else null
    end as division_id,
    representative_level
  from raw
  where raw_division is not null
     or state_code is not null
     or fallback_state is not null;

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
    division_id,
    representative_level,
    'openstates_yaml',
    now(),
    now()
  from tmp_divisions
  where division_id is not null;
  get diagnostics v_inserted = row_count;

  return v_inserted;
end;
$$;

comment on function public.refresh_divisions_from_openstates() is
  'Rebuilds representative_divisions from OpenStates current roles.';

commit;


