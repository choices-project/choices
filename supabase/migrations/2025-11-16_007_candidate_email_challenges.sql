create table if not exists public.candidate_email_challenges (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_candidate_email_challenges_candidate on public.candidate_email_challenges(candidate_id);
create index if not exists idx_candidate_email_challenges_user on public.candidate_email_challenges(user_id);
create index if not exists idx_candidate_email_challenges_email on public.candidate_email_challenges(email);

alter table public.candidate_email_challenges enable row level security;
drop policy if exists "challenge_owner_rw" on public.candidate_email_challenges;
create policy "challenge_owner_rw"
on public.candidate_email_challenges
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


