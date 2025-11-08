-- NOTE: this migration only introduces helper views to normalise OpenStates staging data.
-- No existing tables, policies, or functions are altered.
-- All statements execute inside a transaction to maintain atomicity.

begin;

set search_path = public, extensions;

-- View: openstates_people_current_roles_v
-- Normalises current role information and extracts state/district metadata.
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
  coalesce(r.is_current,
           (r.end_date is null) or (r.end_date::date >= current_date)) as is_current,
  lower(
    regexp_replace(
      regexp_replace(r.jurisdiction, '^ocd-jurisdiction/country:us/state:', ''),
      '/.*$',
      ''
    )
  ) as state_code
from public.openstates_people_roles r
join public.openstates_people_data d
  on d.id = r.openstates_person_id;

comment on view public.openstates_people_current_roles_v is
  'Denormalised OpenStates roles with inferred state codes.';

-- View: openstates_people_primary_contacts_v
-- Resolves contact rows and marks primary entries based on contact_type + ordering.
create or replace view public.openstates_people_primary_contacts_v as
with ordered_contacts as (
  select
    c.openstates_person_id,
    d.openstates_id,
    c.contact_type,
    c.value,
    c.note,
    c.created_at,
    row_number() over (
      partition by c.openstates_person_id, c.contact_type
      order by
        case
          when c.note ilike '%capitol%' then 0
          when c.note ilike '%main%' then 1
          else 2
        end,
        c.id
    ) as contact_rank
  from public.openstates_people_contacts c
  join public.openstates_people_data d
    on d.id = c.openstates_person_id
)
select
  openstates_person_id,
  openstates_id,
  contact_type,
  value,
  note,
  created_at,
  (contact_rank = 1) as is_primary
from ordered_contacts;

comment on view public.openstates_people_primary_contacts_v is
  'OpenStates contacts with deterministic primary flag ordering.';

-- View: openstates_people_social_v
create or replace view public.openstates_people_social_v as
select
  s.openstates_person_id,
  d.openstates_id,
  s.id as social_id,
  lower(s.platform) as platform,
  s.username as handle,
  null::text as url,
  s.created_at
from public.openstates_people_social_media s
join public.openstates_people_data d
  on d.id = s.openstates_person_id;

comment on view public.openstates_people_social_v is
  'OpenStates social media entries keyed by OpenStates ID.';

-- View: openstates_people_sources_v
create or replace view public.openstates_people_sources_v as
select
  s.openstates_person_id,
  d.openstates_id,
  s.id as source_id,
  s.note,
  s.url,
  s.created_at
from public.openstates_people_sources s
join public.openstates_people_data d
  on d.id = s.openstates_person_id;

comment on view public.openstates_people_sources_v is
  'OpenStates source URLs (metadata for provenance logging).';

commit;

