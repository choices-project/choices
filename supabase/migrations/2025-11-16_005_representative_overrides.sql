-- Representative public-facing overrides, with RLS and audit trigger hooks
create table if not exists public.representative_overrides (
  id uuid primary key default gen_random_uuid(),
  representative_id int not null references public.representatives_core(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_photo_url text,
  socials jsonb,
  short_bio text,
  campaign_website text,
  press_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (representative_id)
);

create index if not exists idx_rep_overrides_rep on public.representative_overrides(representative_id);
create index if not exists idx_rep_overrides_user on public.representative_overrides(user_id);

-- Update timestamp
drop trigger if exists trg_rep_overrides_updated on public.representative_overrides;
create trigger trg_rep_overrides_updated
before update on public.representative_overrides
for each row execute function public.tg_set_updated_at();

-- Enable RLS
alter table public.representative_overrides enable row level security;

-- Ownership/claim policy:
-- The owner is the user fast-tracked to this representative via candidate_profiles.representative_id
-- or an existing matching email domain (checked server-side). For RLS, enforce user match on row.
drop policy if exists "rep_overrides_owner_rw" on public.representative_overrides;
create policy "rep_overrides_owner_rw"
on public.representative_overrides
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Minimal read for public (only select to authenticated users if needed)
drop policy if exists "rep_overrides_read_public" on public.representative_overrides;
create policy "rep_overrides_read_public"
on public.representative_overrides
for select
to authenticated
using (true);


