-- Update sync functions to use new status field instead of is_active
-- Following Phase 1.2: Update Sync Functions from the plan
-- This migration updates existing functions to use status tracking

begin;

set search_path = public, extensions;

-- Update deactivate_non_current_openstates_reps to use status tracking
-- This function is simpler and can be fully updated here
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
  set 
    status = case
      -- Only change status if currently active
      when rc.status = 'active'::public.representative_status then 'inactive'::public.representative_status
      -- Preserve historical status
      else rc.status
    end,
    status_reason = case
      when rc.status = 'active'::public.representative_status then 'no_longer_current_in_openstates'
      else rc.status_reason
    end,
    status_changed_at = case
      when rc.status = 'active'::public.representative_status then now()
      else rc.status_changed_at
    end,
    is_active = false,  -- Keep for backward compatibility during migration
    updated_at = now()
  where rc.openstates_id is not null
    and rc.status = 'active'::public.representative_status
    and not exists (select 1 from role_choice r where r.openstates_id = rc.openstates_id);

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

comment on function public.deactivate_non_current_openstates_reps() is
  'Sets status=''inactive'' for representatives_core rows whose openstates_id is no longer current. Uses status tracking with reason and timestamp. Run after sync_representatives_from_openstates.';

-- Note: sync_representatives_from_openstates is a large function (600+ lines)
-- The full update should be done in a separate migration that recreates the entire function
-- For now, we document what needs to change:
-- 1. Line 123: Change `coalesce(role_choice.is_current, true) as is_active` to also set status
-- 2. Line 184: Change `is_active = coalesce(s.is_active, rc.is_active)` to update status
-- 3. Line 210: Add `status` to INSERT column list
-- 4. Line 239: Add status value to INSERT (set to 'active' for new rows)
-- 5. Preserve existing status for historical reps when updating

-- Create a helper function to determine status from is_active
create or replace function public.determine_status_from_active(
  p_is_active boolean,
  p_existing_status public.representative_status default null
)
returns public.representative_status
language plpgsql
immutable
as $$
begin
  -- If existing status is historical, preserve it
  if p_existing_status = 'historical'::public.representative_status then
    return p_existing_status;
  end if;
  
  -- Otherwise, use is_active to determine status
  if p_is_active then
    return 'active'::public.representative_status;
  else
    return 'inactive'::public.representative_status;
  end if;
end;
$$;

comment on function public.determine_status_from_active is
  'Helper function to convert is_active boolean to status enum. Preserves historical status.';

commit;
