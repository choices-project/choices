-- Comprehensive update to sync_representatives_from_openstates to use status field
-- This migration recreates the entire function with status tracking integrated
-- Based on 20251108023000_sync_representatives_function_v2.sql

begin;

set search_path = public, extensions;

drop function if exists public.sync_representatives_from_openstates cascade;

create function public.sync_representatives_from_openstates()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_updated integer := 0;
  v_inserted integer := 0;
  v_committees integer := 0;
  v_contacts integer := 0;
  v_social integer := 0;
  v_photos integer := 0;
  v_crosswalk integer := 0;
  v_sources integer := 0;
  v_quality integer := 0;
  v_err_msg text;
  v_err_context text;
begin
  -- Stage canonical data from OpenStates helper views.
  create temporary table tmp_openstates_stage
  on commit drop as
  with current_roles as (
    select *
    from public.openstates_people_current_roles_v
    where is_current
  ),
  role_choice as (
    select distinct on (r.openstates_person_id)
      r.openstates_person_id,
      r.openstates_id,
      r.state_code,
      r.role_type,
      r.title,
      r.member_role,
      r.district,
      r.start_date,
      r.end_date,
      r.is_current,
      r.jurisdiction
    from current_roles r
    order by r.openstates_person_id, r.start_date desc nulls last, r.end_date desc nulls last
  ),
  contacts as (
    select
      c.openstates_id,
      max(case when lower(c.contact_type) in ('email', 'email address') then c.value end) as primary_email,
      max(case when lower(c.contact_type) in ('voice', 'phone', 'telephone', 'office phone', 'main') then c.value end) as primary_phone,
      max(case when lower(c.contact_type) in ('url', 'website', 'home page') then c.value end) as primary_website,
      bool_or(lower(c.contact_type) in ('address', 'office')) as has_address
    from public.openstates_people_primary_contacts_v c
    group by c.openstates_id
  ),
  social_core as (
    select
      s.openstates_id,
      max(case when s.platform = 'twitter' then s.handle end) as twitter_handle,
      max(case when s.platform = 'facebook' then s.handle end) as facebook_handle,
      max(case when s.platform = 'instagram' then s.handle end) as instagram_handle,
      max(case when s.platform = 'linkedin' then s.handle end) as linkedin_handle,
      max(case when s.platform = 'youtube' then s.handle end) as youtube_handle
    from public.openstates_people_social_v s
    group by s.openstates_id
  ),
  identifier_core as (
    select
      d.openstates_id,
      max(case when lower(i.scheme) in ('wikipedia', 'wiki', 'wikipedia_id') then i.identifier end) as wikipedia_id,
      max(case when lower(i.scheme) like 'ballotpedia%' then i.identifier end) as ballotpedia_id,
      max(case when lower(i.scheme) in ('govtrack', 'govtrack_id') then i.identifier end) as govtrack_id,
      max(case when lower(i.scheme) in ('bioguide', 'bioguide_id') then i.identifier end) as bioguide_id,
      max(case when lower(i.scheme) in ('fec', 'fec_id') then i.identifier end) as fec_id
    from public.openstates_people_identifiers i
    join public.openstates_people_data d
      on d.id = i.openstates_person_id
    group by d.openstates_id
  )
  select
    d.id as openstates_person_id,
    d.openstates_id,
    left(d.name, 255) as name,
    left(coalesce(d.given_name, split_part(d.name, ' ', 1)), 120) as given_name,
    left(
      coalesce(
        d.family_name,
        split_part(d.name, ' ', cardinality(regexp_split_to_array(d.name, '\s+')))
      ),
      120
    ) as family_name,
    left(d.image_url, 500) as image_url,
    left(d.party, 100) as party,
    upper(
      coalesce(
        role_choice.state_code,
        substring(role_choice.jurisdiction from 'state:([a-z]{2})'),
        'NA'
      )
    ) as state,
    case
      when role_choice.role_type in ('upper', 'lower', 'joint') then 'state'
      when role_choice.role_type in ('executive') then 'state'
      when role_choice.role_type is null then 'local'
      else 'local'
    end::text as level,
    coalesce(
      nullif(left(role_choice.title, 180), ''),
      nullif(left(role_choice.member_role, 180), ''),
      case
        when role_choice.role_type = 'upper' then 'State Senator'
        when role_choice.role_type = 'lower' then 'State Representative'
        else 'Representative'
      end
    ) as office,
    left(role_choice.district, 50) as district,
    role_choice.start_date::date as term_start_date,
    role_choice.end_date::date as term_end_date,
    coalesce(role_choice.is_current, true) as is_active,
    left(contacts.primary_email, 255) as primary_email,
    left(contacts.primary_phone, 20) as primary_phone,
    left(contacts.primary_website, 500) as primary_website,
    left(d.image_url, 500) as primary_photo_url,
    left(social_core.twitter_handle, 50) as twitter_handle,
    case when social_core.facebook_handle is not null then left('https://www.facebook.com/' || social_core.facebook_handle, 255) else null end as facebook_url,
    left(social_core.instagram_handle, 50) as instagram_handle,
    case when social_core.linkedin_handle is not null then left('https://www.linkedin.com/in/' || social_core.linkedin_handle, 500) else null end as linkedin_url,
    case when social_core.youtube_handle is not null then left('https://www.youtube.com/' || social_core.youtube_handle, 100) else null end as youtube_channel,
    contacts.has_address,
    case
      when identifier_core.wikipedia_id is not null and identifier_core.wikipedia_id like 'http%' then left(identifier_core.wikipedia_id, 500)
      when identifier_core.wikipedia_id is not null then left('https://en.wikipedia.org/wiki/' || identifier_core.wikipedia_id, 500)
      else null
    end as wikipedia_url,
    case
      when identifier_core.ballotpedia_id is not null and identifier_core.ballotpedia_id like 'http%' then left(identifier_core.ballotpedia_id, 500)
      when identifier_core.ballotpedia_id is not null then left('https://ballotpedia.org/' || identifier_core.ballotpedia_id, 500)
      else null
    end as ballotpedia_url,
    left(identifier_core.bioguide_id, 20) as bioguide_id,
    left(identifier_core.fec_id, 20) as fec_id,
    left(identifier_core.govtrack_id, 50) as govtrack_id
  from role_choice
  join public.openstates_people_data d
    on d.id = role_choice.openstates_person_id
  left join contacts on contacts.openstates_id = role_choice.openstates_id
  left join social_core on social_core.openstates_id = role_choice.openstates_id
  left join identifier_core on identifier_core.openstates_id = role_choice.openstates_id
  where role_choice.is_current = true;

  if not exists (select 1 from tmp_openstates_stage) then
    raise notice 'No active OpenStates representatives found to sync.';
    return;
  end if;

  -- Update existing representatives_core rows.
  -- KEY CHANGE: Preserve historical status, set status='active' only for current reps
  update public.representatives_core rc
  set
    name = coalesce(left(s.name, 255), rc.name),
    office = coalesce(left(s.office, 255), rc.office),
    level = coalesce(left(s.level, 20), rc.level),
    state = coalesce(left(s.state, 2), rc.state),
    district = coalesce(left(s.district, 50), rc.district),
    party = coalesce(left(s.party, 100), rc.party),
    primary_email = coalesce(left(s.primary_email, 255), rc.primary_email),
    primary_phone = coalesce(left(s.primary_phone, 20), rc.primary_phone),
    primary_website = coalesce(left(s.primary_website, 500), rc.primary_website),
    primary_photo_url = coalesce(left(s.primary_photo_url, 500), rc.primary_photo_url),
    twitter_handle = coalesce(left(s.twitter_handle, 50), rc.twitter_handle),
    facebook_url = coalesce(left(s.facebook_url, 500), rc.facebook_url),
    instagram_handle = coalesce(left(s.instagram_handle, 50), rc.instagram_handle),
    linkedin_url = coalesce(left(s.linkedin_url, 500), rc.linkedin_url),
    youtube_channel = coalesce(left(s.youtube_channel, 100), rc.youtube_channel),
    wikipedia_url = coalesce(left(s.wikipedia_url, 500), rc.wikipedia_url),
    ballotpedia_url = coalesce(left(s.ballotpedia_url, 500), rc.ballotpedia_url),
    bioguide_id = coalesce(left(s.bioguide_id, 20), rc.bioguide_id),
    fec_id = coalesce(left(s.fec_id, 20), rc.fec_id),
    term_start_date = coalesce(s.term_start_date, rc.term_start_date),
    term_end_date = coalesce(s.term_end_date, rc.term_end_date),
    is_active = coalesce(s.is_active, rc.is_active),  -- Keep for backward compatibility
    -- KEY CHANGE: Set status='active' for current reps, preserve historical status
    status = case
      when rc.status = 'historical'::public.representative_status then 'historical'::public.representative_status
      when coalesce(s.is_active, rc.is_active) = true then 'active'::public.representative_status
      else 'inactive'::public.representative_status
    end,
    verification_status = coalesce(rc.verification_status, 'pending'),
    updated_at = now()
  from tmp_openstates_stage s
  where rc.openstates_id = s.openstates_id;
  get diagnostics v_updated = row_count;

  -- Insert new representatives_core rows.
  -- KEY CHANGE: Set status='active' for new rows
  insert into public.representatives_core (
    name,
    office,
    level,
    state,
    district,
    party,
    primary_email,
    primary_phone,
    primary_website,
    primary_photo_url,
    twitter_handle,
    facebook_url,
    instagram_handle,
    linkedin_url,
    youtube_channel,
    term_start_date,
    term_end_date,
    is_active,
    status,
    openstates_id,
    canonical_id,
    wikipedia_url,
    ballotpedia_url,
    bioguide_id,
    fec_id,
    verification_status,
    created_at,
    updated_at
  )
  select
    left(s.name, 255),
    left(s.office, 255),
    left(s.level, 20),
    left(s.state, 2),
    left(s.district, 50),
    left(s.party, 100),
    left(s.primary_email, 255),
    left(s.primary_phone, 20),
    left(s.primary_website, 500),
    left(s.primary_photo_url, 500),
    left(s.twitter_handle, 50),
    left(s.facebook_url, 500),
    left(s.instagram_handle, 50),
    left(s.linkedin_url, 500),
    left(s.youtube_channel, 100),
    s.term_start_date,
    s.term_end_date,
    s.is_active,  -- Keep for backward compatibility
    'active'::public.representative_status,  -- KEY CHANGE: Set status for new rows
    s.openstates_id,
    left('openstates:' || s.openstates_id, 255),
    left(s.wikipedia_url, 500),
    left(s.ballotpedia_url, 500),
    left(s.bioguide_id, 20),
    left(s.fec_id, 20),
    'pending',
    now(),
    now()
  from tmp_openstates_stage s
  where not exists (
    select 1 from public.representatives_core rc
    where rc.openstates_id = s.openstates_id
  );
  get diagnostics v_inserted = row_count;

  -- Map OpenStates IDs to representative IDs.
  create temporary table tmp_rep_map
  on commit drop as
  select rc.id as representative_id, s.openstates_id, s.has_address
  from public.representatives_core rc
  join tmp_openstates_stage s
    on s.openstates_id = rc.openstates_id;

  -- Contacts (replace openstates-derived rows).
  delete from public.representative_contacts
  where source = 'openstates_yaml'
    and representative_id in (select representative_id from tmp_rep_map);

  create temporary table tmp_contacts
  on commit drop as
  select distinct
    m.representative_id,
    case
      when lower(c.contact_type) in ('voice', 'phone', 'telephone', 'office phone', 'main') then 'phone'
      when lower(c.contact_type) in ('email', 'email address') then 'email'
      when lower(c.contact_type) in ('fax') then 'fax'
      when lower(c.contact_type) in ('url', 'website', 'home page') then 'website'
      when lower(c.contact_type) in ('address', 'office') then 'address'
      else lower(c.contact_type)
    end as contact_type,
    c.value,
    c.is_primary
  from public.openstates_people_primary_contacts_v c
  join tmp_rep_map m on m.openstates_id = c.openstates_id
  where c.value is not null and c.value <> '';

  insert into public.representative_contacts (
    representative_id,
    contact_type,
    value,
    is_primary,
    is_verified,
    source,
    updated_at
  )
  select
    representative_id,
    left(contact_type, 50),
    value,
    is_primary,
    false,
    'openstates_yaml',
    now()
  from tmp_contacts
  on conflict on constraint unique_representative_contact
  do nothing;
  get diagnostics v_contacts = row_count;

  -- Committees derived from OpenStates roles (non-legislative).
  delete from public.representative_committees
  where representative_id in (select representative_id from tmp_rep_map);

  insert into public.representative_committees (
    representative_id,
    committee_name,
    role,
    start_date,
    end_date,
    is_current,
    created_at,
    updated_at
  )
  select
    m.representative_id,
    left(coalesce(nullif(r.title, ''), nullif(r.member_role, ''), 'Committee Member'), 255) as committee_name,
    left(r.member_role, 100),
    r.start_date::date,
    r.end_date::date,
    coalesce(r.is_current, (r.end_date is null or r.end_date::date >= current_date)),
    now(),
    now()
  from public.openstates_people_roles r
  join public.openstates_people_data d
    on d.id = r.openstates_person_id
  join tmp_rep_map m
    on m.openstates_id = d.openstates_id
  where coalesce(r.title, r.member_role) is not null
    and coalesce(r.jurisdiction, '') <> ''
    and lower(r.role_type) not in ('upper', 'lower', 'joint', 'executive', 'mayor', 'governor');
  get diagnostics v_committees = row_count;

  -- Social media (upsert per platform).
  with ranked_social as (
    select
      m.representative_id,
      s.platform,
      s.handle,
      case s.platform
        when 'twitter' then 'https://twitter.com/' || s.handle
        when 'facebook' then 'https://www.facebook.com/' || s.handle
        when 'instagram' then 'https://www.instagram.com/' || s.handle
        when 'youtube' then 'https://www.youtube.com/' || s.handle
        when 'linkedin' then 'https://www.linkedin.com/in/' || s.handle
        else null
      end as url,
      row_number() over (
        partition by m.representative_id, s.platform
        order by s.created_at desc nulls last, s.social_id
      ) as rn
    from public.openstates_people_social_v s
    join tmp_rep_map m on m.openstates_id = s.openstates_id
    where s.handle is not null and s.handle <> ''
  )
  insert into public.representative_social_media (
    representative_id,
    platform,
    handle,
    url,
    is_primary,
    is_verified,
    verified,
    followers_count,
    created_at,
    updated_at
  )
  select
    representative_id,
    left(platform, 50),
    left(handle, 100),
    left(url, 255),
    true,
    false,
    false,
    null,
    now(),
    now()
  from ranked_social
  where rn = 1
  on conflict (representative_id, platform)
  do update set
    handle = excluded.handle,
    url = excluded.url,
    is_primary = excluded.is_primary,
    is_verified = excluded.is_verified,
    verified = excluded.verified,
    updated_at = excluded.updated_at;
  get diagnostics v_social = row_count;

  -- Photos (replace OpenStates-sourced entries).
  delete from public.representative_photos
  where source = 'openstates_yaml'
    and representative_id in (select representative_id from tmp_rep_map);

  insert into public.representative_photos (
    representative_id,
    url,
    source,
    is_primary,
    created_at,
    updated_at
  )
  select
    m.representative_id,
    left(s.primary_photo_url, 255),
    'openstates_yaml',
    true,
    now(),
    now()
  from tmp_rep_map m
  join tmp_openstates_stage s on s.openstates_id = m.openstates_id
  where s.primary_photo_url is not null and s.primary_photo_url <> '';
  get diagnostics v_photos = row_count;

  -- Crosswalk identifiers (bioguide, fec, etc.).
  begin
    insert into public.representative_crosswalk_enhanced (
      canonical_id,
      representative_id,
      source_system,
      source_id,
      source_confidence,
      created_at,
      updated_at,
      last_verified
    )
    select distinct
      coalesce(rc.canonical_id, 'openstates:' || d.openstates_id),
      m.representative_id,
      left(lower(i.scheme), 50),
      left(i.identifier, 255),
      case when lower(i.scheme) in ('bioguide', 'fec') then 'high' else 'medium' end,
      now(),
      now(),
      now()
    from public.openstates_people_identifiers i
    join public.openstates_people_data d
      on d.id = i.openstates_person_id
    join tmp_rep_map m
      on m.openstates_id = d.openstates_id
    join public.representatives_core rc
      on rc.id = m.representative_id
    where i.scheme is not null
      and i.identifier is not null
    on conflict do nothing;
    get diagnostics v_crosswalk = row_count;
  exception
    when string_data_right_truncation then
      raise exception 'Crosswalk insert truncation: %', SQLERRM;
  end;

  -- Provenance (data sources).
  delete from public.representative_data_sources
  where representative_id in (select representative_id from tmp_rep_map)
    and source_type in ('openstates', 'openstates_source');

  create temporary table tmp_sources
  on commit drop as
  select
    representative_id,
    source_name,
    source_type,
    confidence,
    validation_status,
    last_updated,
    updated_at,
    raw_data,
    row_number() over (
      partition by representative_id, source_name, source_type
      order by last_updated desc nulls last, updated_at desc
    ) as rn
  from (
    select
      m.representative_id,
      'OpenStates People YAML'::text as source_name,
      'openstates'::text as source_type,
      'high'::text as confidence,
      'synced'::text as validation_status,
      now() as last_updated,
      now() as updated_at,
      jsonb_build_object('openstates_id', m.openstates_id) as raw_data
    from tmp_rep_map m

    union all

    select
      m.representative_id,
      coalesce(nullif(left(s.note, 255), ''), 'OpenStates Source') as source_name,
      'openstates_source'::text as source_type,
      'medium'::text as confidence,
      'synced'::text as validation_status,
      coalesce(s.created_at, now()) as last_updated,
      now() as updated_at,
      jsonb_build_object('url', s.url, 'note', s.note) as raw_data
    from public.openstates_people_sources_v s
    join tmp_rep_map m on m.openstates_id = s.openstates_id
  ) unioned;

  insert into public.representative_data_sources (
    representative_id,
    source_name,
    source_type,
    confidence,
    validation_status,
    last_updated,
    updated_at,
    raw_data
  )
  select
    representative_id,
    source_name,
    source_type,
    confidence,
    validation_status,
    last_updated,
    updated_at,
    raw_data
  from tmp_sources
  where rn = 1
  on conflict on constraint unique_representative_data_sources
  do update set
    confidence = excluded.confidence,
    validation_status = excluded.validation_status,
    last_updated = excluded.last_updated,
    updated_at = excluded.updated_at,
    raw_data = excluded.raw_data;
  get diagnostics v_sources = row_count;

  update public.representatives_core rc
  set data_sources = (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'source_name', rds.source_name,
          'source_type', rds.source_type,
          'confidence', rds.confidence,
          'validation_status', rds.validation_status
        )
      ),
      '[]'::jsonb
    )::json
    from public.representative_data_sources rds
    where rds.representative_id = rc.id
  )
  where rc.id in (select representative_id from tmp_rep_map);

  -- Quality metrics.
  delete from public.representative_data_quality
  where representative_id in (select representative_id from tmp_rep_map);

  insert into public.representative_data_quality (
    representative_id,
    data_completeness,
    overall_confidence,
    primary_source_score,
    secondary_source_score,
    source_reliability,
    validation_method,
    last_validated,
    updated_at
  )
  select
    m.representative_id,
    round((
      (case when s.primary_email is not null then 1 else 0 end) +
      (case when s.primary_phone is not null then 1 else 0 end) +
      (case when s.has_address then 1 else 0 end) +
      (case when s.twitter_handle is not null or s.facebook_url is not null or s.instagram_handle is not null then 1 else 0 end)
    )::numeric / 4, 2) as data_completeness,
    round((
      (case when s.primary_email is not null then 1 else 0 end) +
      (case when s.primary_phone is not null then 1 else 0 end) +
      (case when s.has_address then 1 else 0 end) +
      (case when s.twitter_handle is not null or s.facebook_url is not null or s.instagram_handle is not null then 1 else 0 end)
    )::numeric / 4, 2) as overall_confidence,
    1.0 as primary_source_score,
    0.0 as secondary_source_score,
    0.75 as source_reliability,
    'openstates_sync',
    now(),
    now()
  from tmp_openstates_stage s
  join tmp_rep_map m on m.openstates_id = s.openstates_id;
  get diagnostics v_quality = row_count;

  raise notice 'OpenStates sync complete: updated %, inserted %, committees %, contacts %, social %, photos %, crosswalk %, sources %, quality %',
    v_updated, v_inserted, v_committees, v_contacts, v_social, v_photos, v_crosswalk, v_sources, v_quality;

exception
  when string_data_right_truncation then
    get stacked diagnostics v_err_msg = MESSAGE_TEXT, v_err_context = PG_EXCEPTION_CONTEXT;
    raise exception 'Data truncation: % | Context: %', v_err_msg, v_err_context;
  when others then
    get stacked diagnostics v_err_msg = message_text;
    get stacked diagnostics v_err_context = pg_exception_context;
    raise exception 'sync_representatives_from_openstates failed: % (context: %)', v_err_msg, v_err_context;
end;
$$;

comment on function public.sync_representatives_from_openstates() is
  'Syncs OpenStates YAML data into representatives_core. Updated to use status field: sets status=''active'' for current reps, preserves historical status when updating existing rows.';

commit;
