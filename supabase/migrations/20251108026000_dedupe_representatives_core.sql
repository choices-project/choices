begin;

create temporary table tmp_duplicate_groups
on commit drop
as
with source_flags as (
  select
    representative_id,
    max(case when lower(source_type) in ('congress.gov', 'congress_gov', 'govinfo') then 1 else 0 end) as has_congress_source,
    max(case when lower(source_type) similar to '(wikipedia|wiki)%' then 1 else 0 end) as has_wiki_source
  from public.representative_data_sources
  group by representative_id
),
ranked as (
  select
    rc.canonical_id,
    rc.id,
    case
      when rc.congress_gov_id is not null
        or rc.govinfo_id is not null
        or coalesce(sf.has_congress_source, 0) = 1 then 3
      when rc.wikipedia_url is not null
        or coalesce(sf.has_wiki_source, 0) = 1 then 1
      else 0
    end as priority,
    row_number() over (partition by rc.canonical_id order by
      case
        when rc.congress_gov_id is not null
          or rc.govinfo_id is not null
          or coalesce(sf.has_congress_source, 0) = 1 then 3
        when rc.wikipedia_url is not null
          or coalesce(sf.has_wiki_source, 0) = 1 then 1
        else 0
      end desc,
      rc.id asc
    ) as rn
  from public.representatives_core rc
  left join source_flags sf on sf.representative_id = rc.id
  where rc.canonical_id is not null
)
select
  canonical_id,
  max(id) filter (where rn = 1) as keep_id,
  array_agg(id) filter (where rn > 1) as remove_ids
from ranked
group by canonical_id
having array_length(array_agg(id) filter (where rn > 1), 1) > 0;

create temporary table tmp_duplicate_mappings
on commit drop
as
select
  canonical_id,
  keep_id,
  unnest(remove_ids) as remove_id
from tmp_duplicate_groups;

create temporary table tmp_source_merge
on commit drop
as
select
  d.keep_id,
  rds.source_name,
  rds.source_type,
  rds.confidence,
  rds.validation_status,
  rds.last_updated,
  coalesce(rds.created_at, now()) as created_at,
  now() as updated_at,
  rds.raw_data,
  row_number() over (
    partition by d.keep_id, rds.source_name
    order by
      case
        when lower(rds.source_type) in ('congress.gov', 'congress_gov', 'govinfo') then 3
        when lower(rds.source_name) like 'wikipedia%' then 1
        else 0
      end desc,
      coalesce(rds.last_updated, rds.created_at, now()) desc,
      rds.representative_id asc
  ) as rn
from public.representative_data_sources rds
join tmp_duplicate_mappings d on rds.representative_id = d.remove_id;

-- Update child tables to point at the canonical record we keep.
update public.representative_contacts rc
set representative_id = d.keep_id
from tmp_duplicate_mappings d
where rc.representative_id = d.remove_id;

update public.representative_social_media rs
set representative_id = d.keep_id
from tmp_duplicate_mappings d
where rs.representative_id = d.remove_id;

update public.representative_photos rp
set representative_id = d.keep_id
from tmp_duplicate_mappings d
where rp.representative_id = d.remove_id
and not exists (
  select 1
  from public.representative_photos rp_keep
  where rp_keep.representative_id = d.keep_id
    and rp_keep.source = rp.source
    and (rp_keep.url = rp.url or rp_keep.source = 'wikipedia')
);

update public.representative_committees rc
set representative_id = d.keep_id
from tmp_duplicate_mappings d
where rc.representative_id = d.remove_id;

update public.representative_campaign_finance rcf
set representative_id = d.keep_id
from tmp_duplicate_mappings d
where rcf.representative_id = d.remove_id
and not exists (
  select 1
  from public.representative_campaign_finance rcf_keep
  where rcf_keep.representative_id = d.keep_id
);

update public.representative_data_quality rdq
set representative_id = d.keep_id
from tmp_duplicate_mappings d
where rdq.representative_id = d.remove_id
and not exists (
  select 1
  from public.representative_data_quality keep
  where keep.representative_id = d.keep_id
);

insert into public.representative_data_sources (
  representative_id,
  source_name,
  source_type,
  confidence,
  validation_status,
  last_updated,
  created_at,
  updated_at,
  raw_data
)
select
  keep_id,
  source_name,
  source_type,
  confidence,
  validation_status,
  last_updated,
  created_at,
  updated_at,
  raw_data
from tmp_source_merge
where rn = 1
on conflict (representative_id, source_name) do nothing;

delete from public.representative_data_sources rds
using tmp_duplicate_mappings d
where rds.representative_id = d.remove_id;

update public.representative_crosswalk_enhanced rce
set representative_id = d.keep_id
from tmp_duplicate_mappings d
where rce.representative_id = d.remove_id;

-- Finally, remove the duplicate representatives.
delete from public.representatives_core rc
using tmp_duplicate_mappings d
where rc.id = d.remove_id;

commit;

