begin;

create or replace function public.get_duplicate_canonical_ids()
returns table (
  canonical_id text,
  ids bigint[]
)
language sql
security definer
as $$
  select canonical_id, array_agg(id order by id) as ids
  from public.representatives_core
  where canonical_id is not null
  group by canonical_id
  having count(*) > 1;
$$;

grant execute on function public.get_duplicate_canonical_ids() to authenticated, service_role, anon;

commit;

