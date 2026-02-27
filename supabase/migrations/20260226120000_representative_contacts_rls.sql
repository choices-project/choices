-- RLS policies for representative_contacts (Contact Information System)
-- Enables secure read/write for user submissions and admin approval flow.
-- Applied: Feb 2026. See docs/FEATURE_STATUS.md, docs/RLS_VERIFICATION_GUIDE.md.

begin;

-- Enable RLS if not already
alter table public.representative_contacts enable row level security;

-- Public read: anyone can read contact info (displayed on representative detail pages)
drop policy if exists representative_contacts_public_read on public.representative_contacts;
create policy representative_contacts_public_read on public.representative_contacts
  for select
  using (true);

-- Authenticated insert: users can submit contact info (submitted_by_user_id = auth.uid())
drop policy if exists representative_contacts_insert_own on public.representative_contacts;
create policy representative_contacts_insert_own on public.representative_contacts
  for insert to authenticated
  with check (submitted_by_user_id = auth.uid());

-- Owner update: users can update their own unverified user submissions
drop policy if exists representative_contacts_update_own on public.representative_contacts;
create policy representative_contacts_update_own on public.representative_contacts
  for update to authenticated
  using (
    source = 'user_submission'
    and submitted_by_user_id = auth.uid()
    and is_verified = false
    and rejected_at is null
  )
  with check (
    source = 'user_submission'
    and submitted_by_user_id = auth.uid()
  );

-- Owner delete: users can delete their own unverified user submissions
drop policy if exists representative_contacts_delete_own on public.representative_contacts;
create policy representative_contacts_delete_own on public.representative_contacts
  for delete to authenticated
  using (
    source = 'user_submission'
    and submitted_by_user_id = auth.uid()
    and is_verified = false
    and rejected_at is null
  );

-- Admin read: admins can read all contact submissions (for pending queue)
drop policy if exists representative_contacts_admin_read on public.representative_contacts;
create policy representative_contacts_admin_read on public.representative_contacts
  for select to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where user_profiles.user_id = auth.uid()
      and user_profiles.is_admin = true
    )
  );

-- Admin update: admins can approve/reject (update is_verified, rejected_at, rejection_reason)
drop policy if exists representative_contacts_admin_update on public.representative_contacts;
create policy representative_contacts_admin_update on public.representative_contacts
  for update to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where user_profiles.user_id = auth.uid()
      and user_profiles.is_admin = true
    )
  );

-- Service role full access (for sync functions, background jobs)
drop policy if exists representative_contacts_service_full on public.representative_contacts;
create policy representative_contacts_service_full on public.representative_contacts
  for all to service_role
  using (true)
  with check (true);

commit;
