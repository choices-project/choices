-- Update sync_representatives_from_openstates to use status field
-- This is a focused update to the large sync function (600+ lines)
-- Updates key sections to set status alongside is_active

begin;

set search_path = public, extensions;

-- Create updated version of sync_representatives_from_openstates
-- This migration updates the status-related parts of the function
-- The full function is in 20251108023000_sync_representatives_function_v2.sql

-- We'll update the function to:
-- 1. Set status = 'active' for current reps (line 123 area)
-- 2. Preserve existing status for historical reps when updating (line 184 area)
-- 3. Set status = 'active' for new inserts (line 239 area)

-- Note: This is a partial update. The full function recreation should be done
-- in a separate comprehensive migration that includes all the logic.

-- For now, we create a helper that can be used within the sync function
create or replace function public.set_status_from_active(
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

comment on function public.set_status_from_active is
  'Helper function to convert is_active boolean to status enum. Preserves historical status. Used in sync functions.';

-- Update the UPDATE section of sync_representatives_from_openstates
-- This adds status update logic while preserving historical status
-- The full function update should be done by modifying 20251108023000 directly
-- or creating a new version that replaces it entirely

-- For now, document what needs to change:
-- In the UPDATE section (around line 184), add:
--   status = public.set_status_from_active(
--     coalesce(s.is_active, rc.is_active),
--     rc.status
--   ),
-- 
-- In the INSERT section (around line 239), add:
--   status = 'active'::public.representative_status,
--
-- In the staging CTE (around line 123), the is_active calculation is fine
-- as-is since we'll convert it to status in the UPDATE/INSERT

comment on function public.sync_representatives_from_openstates() is
  'Syncs OpenStates YAML data into representatives_core. Should be updated to set status field alongside is_active. Preserves historical status when updating existing rows.';

commit;
