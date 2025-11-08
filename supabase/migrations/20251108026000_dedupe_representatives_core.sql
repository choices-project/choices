begin;

create temporary table tmp_duplicate_groups
on commit drop
as
select
  canonical_id,
  min(id) as keep_id,
  array_remove(array_agg(id order by id), min(id)) as remove_ids
from public.representatives_core
where canonical_id is not null
group by canonical_id
having count(*) > 1;

create temporary table tmp_duplicate_mappings
on commit drop
as
select
  canonical_id,
  keep_id,
  unnest(remove_ids) as remove_id
from tmp_duplicate_groups;

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
where rcf.representative_id = d.remove_id;

update public.representative_data_sources rds
set representative_id = d.keep_id
from tmp_duplicate_mappings d
where rds.representative_id = d.remove_id;

update public.representative_data_quality rdq
set representative_id = d.keep_id
from tmp_duplicate_mappings d
where rdq.representative_id = d.remove_id;

update public.representative_crosswalk_enhanced rce
set representative_id = d.keep_id
from tmp_duplicate_mappings d
where rce.representative_id = d.remove_id;

-- Finally, remove the duplicate representatives.
delete from public.representatives_core rc
using tmp_duplicate_mappings d
where rc.id = d.remove_id;

commit;

