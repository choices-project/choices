-- Store rejected contact submissions instead of deleting
-- Applied: Feb 2026. See MASTER_ROADMAP.md, docs/FEATURE_STATUS.md, docs/DATABASE_SCHEMA.md.
-- Enables "My Submissions" to show rejected items with badge
-- Rejected rows: rejected_at IS NOT NULL

begin;

-- Add rejected_at timestamp (when admin rejected; NULL = not rejected)
alter table public.representative_contacts
  add column if not exists rejected_at timestamptz;

comment on column public.representative_contacts.rejected_at is
  'When this user submission was rejected by admin. NULL = pending or approved.';

-- Add rejection_reason for user feedback
alter table public.representative_contacts
  add column if not exists rejection_reason text;

comment on column public.representative_contacts.rejection_reason is
  'Optional reason provided by admin when rejecting the submission.';

-- Index for filtering pending (exclude rejected) in admin queries
create index if not exists idx_representative_contacts_rejected_at
  on public.representative_contacts(rejected_at)
  where source = 'user_submission' and rejected_at is not null;

commit;
