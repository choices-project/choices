-- Add check constraints for data quality
-- Following Supabase best practices: validate data at database level

begin;

-- State must be 2-letter uppercase code (US state abbreviations)
alter table public.representatives_core
  add constraint chk_representatives_core_state_format
  check (state is null or (length(state) = 2 and state ~ '^[A-Z]{2}$'));

comment on constraint chk_representatives_core_state_format on public.representatives_core is
  'Ensures state is a valid 2-letter uppercase code (e.g., CA, NY, TX).';

-- Level must be one of the valid enum values
alter table public.representatives_core
  add constraint chk_representatives_core_level
  check (level in ('federal', 'state', 'local'));

comment on constraint chk_representatives_core_level on public.representatives_core is
  'Ensures level is one of: federal, state, local.';

-- Term dates must be logical (end >= start)
alter table public.representatives_core
  add constraint chk_representatives_core_term_dates
  check (
    term_end_date is null
    or term_start_date is null
    or term_end_date >= term_start_date
  );

comment on constraint chk_representatives_core_term_dates on public.representatives_core is
  'Ensures term_end_date is not before term_start_date.';

-- Next election must be in the future (or null)
-- Allows null for reps without upcoming elections
alter table public.representatives_core
  add constraint chk_representatives_core_next_election
  check (next_election_date is null or next_election_date >= current_date);

comment on constraint chk_representatives_core_next_election on public.representatives_core is
  'Ensures next_election_date is in the future or null.';

-- Data sources must be a JSONB array (if not null)
alter table public.representatives_core
  add constraint chk_representatives_core_data_sources_array
  check (data_sources is null or jsonb_typeof(data_sources) = 'array');

comment on constraint chk_representatives_core_data_sources_array on public.representatives_core is
  'Ensures data_sources is a JSONB array when not null.';

-- Verification status must be valid enum value
alter table public.representatives_core
  add constraint chk_representatives_core_verification_status
  check (
    verification_status is null
    or verification_status in ('verified', 'pending', 'failed')
  );

comment on constraint chk_representatives_core_verification_status on public.representatives_core is
  'Ensures verification_status is one of: verified, pending, failed.';

commit;
