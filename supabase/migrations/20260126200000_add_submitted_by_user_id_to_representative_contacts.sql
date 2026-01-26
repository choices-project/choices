-- Add submitted_by_user_id to representative_contacts table
-- Following Supabase best practices: index foreign keys, use appropriate data types, lowercase identifiers
-- Enables tracking which user submitted contact information for notification purposes

begin;

-- Add submitted_by_user_id column (nullable for existing records and ingestion sources)
-- Using UUID to match auth.users.id type (best practice 4.1: appropriate data types)
alter table public.representative_contacts
  add column if not exists submitted_by_user_id uuid;

comment on column public.representative_contacts.submitted_by_user_id is
  'User ID of the person who submitted this contact information. NULL for ingestion sources (openstates_yaml, etc.) or legacy records.';

-- Add foreign key constraint to auth.users
-- Using ON DELETE SET NULL to preserve contact data if user is deleted (best practice 3.1: least privilege)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.representative_contacts'::regclass
    and conname = 'fk_representative_contacts_submitted_by_user_id'
  ) then
    alter table public.representative_contacts
      add constraint fk_representative_contacts_submitted_by_user_id
      foreign key (submitted_by_user_id)
      references auth.users(id)
      on delete set null;
  end if;
end $$;

-- Index the foreign key column (best practice 4.2: index foreign keys)
-- Required for fast JOINs and queries filtering by submitter
create index if not exists idx_representative_contacts_submitted_by_user_id
  on public.representative_contacts(submitted_by_user_id)
  where submitted_by_user_id is not null;  -- Partial index (best practice 1.5) - only index non-null values

comment on index idx_representative_contacts_submitted_by_user_id is
  'Partial index on foreign key for fast queries filtering by submitter. Only indexes non-null values per Supabase best practices.';

-- Create composite index for common query pattern: pending submissions by user
-- (best practice 1.3: composite indexes for multi-column queries)
create index if not exists idx_representative_contacts_user_submissions
  on public.representative_contacts(submitted_by_user_id, is_verified, created_at desc)
  where submitted_by_user_id is not null and source = 'user_submission';

comment on index idx_representative_contacts_user_submissions is
  'Composite index for querying user submissions by verification status and date. Optimizes admin queries filtering pending user submissions.';

commit;
