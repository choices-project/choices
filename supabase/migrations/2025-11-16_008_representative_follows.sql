-- Representative follows table to back /api/representatives/my
-- Creates a per-user follow relationship for representatives with notification prefs

begin;

create table if not exists public.representative_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  representative_id integer not null references public.representatives_core(id) on delete cascade,

  notify_on_votes boolean not null default false,
  notify_on_committee_activity boolean not null default false,
  notify_on_public_statements boolean not null default false,
  notify_on_events boolean not null default false,

  notes text null,
  tags text[] null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint representative_follows_pkey primary key (user_id, representative_id)
);

-- Update timestamp trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_representative_follows_updated_at on public.representative_follows;
create trigger trg_representative_follows_updated_at
before update on public.representative_follows
for each row
execute function public.set_updated_at();

-- Indexes
create index if not exists idx_representative_follows_user on public.representative_follows(user_id);
create index if not exists idx_representative_follows_rep on public.representative_follows(representative_id);

-- Enable RLS and add policies
alter table public.representative_follows enable row level security;

drop policy if exists "Users can select their follows" on public.representative_follows;
create policy "Users can select their follows"
  on public.representative_follows
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their follows" on public.representative_follows;
create policy "Users can insert their follows"
  on public.representative_follows
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their follows" on public.representative_follows;
create policy "Users can update their follows"
  on public.representative_follows
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their follows" on public.representative_follows;
create policy "Users can delete their follows"
  on public.representative_follows
  for delete
  to authenticated
  using (auth.uid() = user_id);

commit;


