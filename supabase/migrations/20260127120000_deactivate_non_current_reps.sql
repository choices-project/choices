-- Deactivate representatives_core rows that are no longer "current" per OpenStates.
-- Run after sync_representatives_from_openstates (e.g. from openstates:merge script).
-- Uses same "current" logic as sync (openstates_people_current_roles_v WHERE is_current,
-- role_choice distinct on person). Only touches rows with openstates_id set.

begin;

set search_path = public, extensions;

create or replace function public.deactivate_non_current_openstates_reps()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_updated integer;
begin
  with current_roles as (
    select *
    from public.openstates_people_current_roles_v
    where is_current
  ),
  role_choice as (
    select distinct on (r.openstates_person_id)
      r.openstates_id
    from current_roles r
    order by r.openstates_person_id, r.start_date desc nulls last, r.end_date desc nulls last
  )
  update public.representatives_core rc
  set is_active = false, updated_at = now()
  where rc.openstates_id is not null
    and not exists (select 1 from role_choice r where r.openstates_id = rc.openstates_id);

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

comment on function public.deactivate_non_current_openstates_reps() is
  'Set is_active=false for representatives_core rows whose openstates_id is no longer current. Run after sync_representatives_from_openstates.';

commit;
