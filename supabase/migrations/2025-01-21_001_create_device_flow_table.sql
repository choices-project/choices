-- Device Flow Auth Table
-- Implements OAuth 2.0 Device Authorization Grant (RFC 8628)
-- Stores device codes, user codes, and authorization state

create table if not exists public.device_flow (
  id uuid primary key default gen_random_uuid(),
  device_code text not null unique,
  user_code text not null unique,
  provider text not null check (provider in ('google', 'github', 'facebook', 'twitter', 'linkedin', 'discord')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'expired', 'error')),
  expires_at timestamptz not null,
  client_ip text not null,
  redirect_to text,
  scopes text[] default '{}',
  user_id uuid references auth.users(id) on delete cascade,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for efficient lookups
create index if not exists idx_device_flow_device_code on public.device_flow(device_code);
create index if not exists idx_device_flow_user_code on public.device_flow(user_code);
create index if not exists idx_device_flow_status on public.device_flow(status);
create index if not exists idx_device_flow_expires_at on public.device_flow(expires_at);
create index if not exists idx_device_flow_user_id on public.device_flow(user_id) where user_id is not null;

-- Enable RLS
alter table public.device_flow enable row level security;

-- Policy: Users can only see their own completed device flows
create policy "device_flow_user_read"
on public.device_flow
for select
using (auth.uid() = user_id);

-- Policy: System can insert device flow records (no auth required for creation)
create policy "device_flow_insert"
on public.device_flow
for insert
with check (true);

-- Policy: System can update device flow records (for polling and completion)
create policy "device_flow_update"
on public.device_flow
for update
using (true)
with check (true);

-- Function to automatically update updated_at timestamp
create or replace function update_device_flow_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger device_flow_updated_at
before update on public.device_flow
for each row
execute function update_device_flow_updated_at();

-- Function to clean up expired device flows (can be called periodically)
create or replace function cleanup_expired_device_flows()
returns integer as $$
declare
  deleted_count integer;
begin
  delete from public.device_flow
  where expires_at < now() and status = 'pending';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$ language plpgsql;

