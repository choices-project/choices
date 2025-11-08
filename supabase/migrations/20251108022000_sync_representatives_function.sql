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
  _job_id uuid := gen_random_uuid();
begin
  -- Placeholder implementation.
  -- The final version will:
  --   * merge staged OpenStates data into representatives_core
  --   * update child tables (contacts, social, photos, committees, activity)
  --   * refresh provenance + quality tables
  --   * run in a single transaction
  --
  -- For now, we emit a NOTICE so the wrapper script confirms invocation.
  raise notice 'sync_representatives_from_openstates() invoked (job_id=%). Implementation pending.', _job_id;
end;
$$;

comment on function public.sync_representatives_from_openstates() is
  'Merge staged OpenStates data into canonical representative tables (skeleton implementation).';

commit;

