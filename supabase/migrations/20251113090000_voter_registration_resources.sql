begin;

create table if not exists public.voter_registration_resources (
  state_code text primary key,
  election_office_name text,
  online_url text,
  mail_form_url text,
  mailing_address text,
  status_check_url text,
  special_instructions text,
  sources text[] not null default '{}'::text[],
  metadata jsonb,
  last_verified timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint voter_registration_resources_state_code_check
    check (state_code ~ '^[A-Z]{2}$')
);

comment on table public.voter_registration_resources is
  'Curated voter registration resources per state (online portals, mail instructions, election offices).';

comment on column public.voter_registration_resources.state_code is 'Two-letter USPS state or territory code.';

create or replace view public.voter_registration_resources_view as
select
  state_code,
  election_office_name,
  online_url,
  mail_form_url,
  mailing_address,
  status_check_url,
  special_instructions,
  sources,
  metadata,
  last_verified,
  updated_at
from public.voter_registration_resources
order by state_code;

-- Seed non-NVRA edge case: North Dakota (no-registration state)
insert into public.voter_registration_resources (state_code, special_instructions, sources)
values (
  'ND',
  'North Dakota does not require voter registration. Bring an acceptable ID to your polling place on Election Day.',
  array['manual']
)
on conflict (state_code) do update
set special_instructions = excluded.special_instructions,
    sources = excluded.sources,
    updated_at = now(),
    last_verified = now();

grant select, insert, update, delete on public.voter_registration_resources to service_role;
grant select on public.voter_registration_resources to authenticated, anon;
grant select on public.voter_registration_resources_view to service_role, authenticated, anon;

commit;

