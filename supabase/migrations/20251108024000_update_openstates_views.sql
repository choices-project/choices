begin;

set search_path = public, extensions;

create or replace view public.openstates_people_current_roles_v as
select
  r.openstates_person_id,
  d.openstates_id,
  r.id as role_id,
  r.role_type,
  r.title,
  r.member_role,
  r.district,
  r.division,
  r.jurisdiction,
  r.start_date,
  r.end_date,
  r.end_reason,
  coalesce(r.is_current, (r.end_date is null) or (r.end_date::date >= current_date)) as is_current,
  lower(coalesce(
    nullif(regexp_replace(r.jurisdiction, '^.*state:([a-z]{2}).*$', '\1'), ''),
    nullif(regexp_replace(r.division, '^.*state:([a-z]{2}).*$', '\1'), '')
  )) as state_code
from public.openstates_people_roles r
join public.openstates_people_data d
  on d.id = r.openstates_person_id;

comment on view public.openstates_people_current_roles_v is
  'Denormalised OpenStates roles with inferred state codes.';

commit;

