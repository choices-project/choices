-- Candidate profiles and verification schema
create table if not exists public.candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  representative_id int references public.representatives_core(id) on delete set null,
  slug text not null unique,
  display_name text not null,
  office text,
  jurisdiction text,
  party text,
  bio text,
  website text,
  social jsonb,
  filing_status text not null default 'not_started' check (filing_status in ('not_started','in_progress','filed','verified')),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_candidate_profiles_user on public.candidate_profiles(user_id);
create index if not exists idx_candidate_profiles_rep on public.candidate_profiles(representative_id);

create table if not exists public.candidate_onboarding (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  step text not null,
  completed boolean not null default false,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_candidate_onboarding_candidate on public.candidate_onboarding(candidate_id);

create table if not exists public.candidate_verifications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  method text not null check (method in ('gov_email','document','manual')),
  status text not null default 'pending' check (status in ('pending','in_progress','verified','rejected')),
  evidence jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists idx_candidate_verifications_candidate on public.candidate_verifications(candidate_id);

create table if not exists public.official_email_fast_track (
  id uuid primary key default gen_random_uuid(),
  representative_id int not null references public.representatives_core(id) on delete cascade,
  email text,
  domain text,
  verified boolean not null default false,
  last_attempt_at timestamptz
);
create index if not exists idx_official_email_rep on public.official_email_fast_track(representative_id);
create index if not exists idx_official_email_domain on public.official_email_fast_track(domain);

-- Updated timestamps
create or replace function public.tg_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_candidate_profiles_updated on public.candidate_profiles;
create trigger trg_candidate_profiles_updated
before update on public.candidate_profiles
for each row execute function public.tg_set_updated_at();

drop trigger if exists trg_candidate_onboarding_updated on public.candidate_onboarding;
create trigger trg_candidate_onboarding_updated
before update on public.candidate_onboarding
for each row execute function public.tg_set_updated_at();

drop trigger if exists trg_candidate_verifications_updated on public.candidate_verifications;
create trigger trg_candidate_verifications_updated
before update on public.candidate_verifications
for each row execute function public.tg_set_updated_at();

-- RLS (outline; actual policies to be refined)
alter table public.candidate_profiles enable row level security;
alter table public.candidate_onboarding enable row level security;
alter table public.candidate_verifications enable row level security;
alter table public.official_email_fast_track enable row level security;

-- RLS policies
drop policy if exists "candidate_profiles_owner_rw_public_r" on public.candidate_profiles;
create policy "candidate_profiles_owner_rw_public_r"
on public.candidate_profiles
for all
using (
  is_public = true
  or auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

drop policy if exists "candidate_onboarding_owner_rw" on public.candidate_onboarding;
create policy "candidate_onboarding_owner_rw"
on public.candidate_onboarding
for all
using (
  exists (
    select 1 from public.candidate_profiles cp
    where cp.id = candidate_id and cp.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.candidate_profiles cp
    where cp.id = candidate_id and cp.user_id = auth.uid()
  )
);

drop policy if exists "candidate_verifications_owner_rw" on public.candidate_verifications;
create policy "candidate_verifications_owner_rw"
on public.candidate_verifications
for all
using (
  exists (
    select 1 from public.candidate_profiles cp
    where cp.id = candidate_id and cp.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.candidate_profiles cp
    where cp.id = candidate_id and cp.user_id = auth.uid()
  )
);

drop policy if exists "official_email_fast_track_admin_ro" on public.official_email_fast_track;
create policy "official_email_fast_track_admin_ro"
on public.official_email_fast_track
for select
to authenticated
using (true);


