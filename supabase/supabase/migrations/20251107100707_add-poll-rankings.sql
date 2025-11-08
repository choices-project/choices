-- migrate:up
create table if not exists public.poll_rankings (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete cascade,
  rankings integer[] not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
create index if not exists poll_rankings_poll_id_idx on public.poll_rankings(poll_id);
create index if not exists poll_rankings_user_id_idx on public.poll_rankings(user_id);
-- migrate:down
drop table if exists public.poll_rankings;
