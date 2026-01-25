-- Add status tracking for representatives
-- Following Supabase best practices: use ENUM type for status, proper foreign keys
-- Part of Phase 1: Database Schema Updates - Status Tracking

begin;

-- Create status enum type
-- Following Supabase best practices: use ENUM for fixed set of values
create type public.representative_status as enum ('active', 'inactive', 'historical');

comment on type public.representative_status is
  'Status of representative: active (currently in office), inactive (no longer in office), historical (preserved for historical data).';

-- Add status column (defaults to 'active' for existing rows)
alter table public.representatives_core
  add column if not exists status public.representative_status not null default 'active';

comment on column public.representatives_core.status is
  'Current status of representative. Replaces is_active boolean with more granular tracking.';

-- Migrate existing is_active to status
update public.representatives_core
set status = case
  when is_active = true then 'active'::public.representative_status
  else 'inactive'::public.representative_status
end;

-- Add replaced_by_id for tracking successor relationships
alter table public.representatives_core
  add column if not exists replaced_by_id integer;

comment on column public.representatives_core.replaced_by_id is
  'ID of representative who replaced this one (for tracking elections, retirements, etc.). Self-referencing foreign key.';

-- Add status_reason for tracking why status changed
alter table public.representatives_core
  add column if not exists status_reason text;

comment on column public.representatives_core.status_reason is
  'Reason for status change (e.g., "Election", "Retirement", "Resignation", "Term ended").';

-- Add status_changed_at for tracking when status changed
alter table public.representatives_core
  add column if not exists status_changed_at timestamptz;

comment on column public.representatives_core.status_changed_at is
  'Timestamp when status was last changed.';

-- Add foreign key constraint for replaced_by_id (self-reference)
-- Following Supabase best practices: index foreign keys
alter table public.representatives_core
  add constraint fk_representatives_core_replaced_by
  foreign key (replaced_by_id)
  references public.representatives_core(id)
  on delete set null;

comment on constraint fk_representatives_core_replaced_by on public.representatives_core is
  'Self-referencing foreign key for tracking representative replacements. Uses SET NULL on delete to preserve historical data.';

-- Index for replaced_by_id (required per Supabase best practices: index all foreign keys)
create index if not exists idx_representatives_core_replaced_by_id
  on public.representatives_core(replaced_by_id)
  where replaced_by_id is not null;

comment on index idx_representatives_core_replaced_by_id is
  'Index on foreign key for fast lookups of representatives who replaced others. Partial index only includes non-null values.';

-- Index for status queries (common filter pattern)
-- Partial index for active reps (most common query)
create index if not exists idx_representatives_core_status_active
  on public.representatives_core(status, state, level)
  where status = 'active';

comment on index idx_representatives_core_status_active is
  'Composite partial index for active rep queries filtered by status, state, and level. Replaces is_active index.';

-- Index for status + state queries
create index if not exists idx_representatives_core_status_state
  on public.representatives_core(status, state)
  where status != 'active';

comment on index idx_representatives_core_status_state is
  'Composite partial index for inactive/historical rep queries by state.';

-- Create function to update status with tracking
-- Following Supabase best practices: use functions for complex operations
create or replace function public.update_representative_status(
  p_representative_id integer,
  p_new_status public.representative_status,
  p_status_reason text default null,
  p_replaced_by_id integer default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.representatives_core
  set
    status = p_new_status,
    status_reason = p_status_reason,
    replaced_by_id = p_replaced_by_id,
    status_changed_at = now(),
    updated_at = now()
  where id = p_representative_id;
end;
$$;

comment on function public.update_representative_status is
  'Updates representative status with reason and replacement tracking. Automatically sets status_changed_at and updated_at.';

-- Grant execute permission
grant execute on function public.update_representative_status to authenticated, service_role;

commit;
