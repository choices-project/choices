-- Compiled Axon / Flock political-money dataset.
-- Public SELECT only. Reloads go through service_role (bypasses RLS).

begin;

create table public.accountability_snapshots (
  id bigint generated always as identity primary key,
  generated_at timestamptz not null,
  loaded_at timestamptz not null default now(),
  source text not null default 'surveillance-money.json',
  is_current boolean not null default true,
  official_count integer not null default 0,
  organization_count integer not null default 0,
  contribution_count integer not null default 0,
  constraint accountability_snapshots_counts_nonneg
    check (official_count >= 0 and organization_count >= 0 and contribution_count >= 0)
);

create unique index accountability_snapshots_one_current_idx
  on public.accountability_snapshots (is_current)
  where is_current;

comment on table public.accountability_snapshots is
  'One current compiled accountability dataset. Public read-only.';

create table public.accountability_companies (
  id text primary key,
  snapshot_id bigint not null references public.accountability_snapshots(id) on delete cascade,
  name text not null,
  formerly text,
  hq text,
  products text,
  pac_name text,
  pac_fec_id text,
  constraint accountability_companies_id_check check (id in ('axon', 'flock'))
);

create index accountability_companies_snapshot_id_idx
  on public.accountability_companies (snapshot_id);

comment on table public.accountability_companies is
  'Axon and Flock Safety profiles for the compiled money dataset.';

create table public.accountability_officials (
  id text primary key,
  snapshot_id bigint not null references public.accountability_snapshots(id) on delete cascade,
  representative_id integer references public.representatives_core(id) on delete set null,
  name text not null,
  office text,
  state text,
  level text not null,
  party text,
  is_current boolean,
  bioguide text,
  fec_ids text[] not null default '{}'::text[],
  total_axon numeric(14, 2) not null default 0,
  total_flock numeric(14, 2) not null default 0,
  total_received numeric(14, 2) not null default 0,
  phone text,
  website text,
  contact_form text,
  address text,
  twitter text,
  facebook text,
  instagram text,
  ballotpedia text,
  constraint accountability_officials_level_check
    check (level in ('federal', 'state', 'local', 'association'))
);

create index accountability_officials_snapshot_id_idx
  on public.accountability_officials (snapshot_id);
create index accountability_officials_state_idx
  on public.accountability_officials (state);
create index accountability_officials_level_idx
  on public.accountability_officials (level);
create index accountability_officials_bioguide_idx
  on public.accountability_officials (bioguide)
  where bioguide is not null;
create index accountability_officials_representative_id_idx
  on public.accountability_officials (representative_id)
  where representative_id is not null;

comment on table public.accountability_officials is
  'Officials and candidates who received Axon or Flock political money, with office contact.';

create table public.accountability_organizations (
  id text primary key,
  snapshot_id bigint not null references public.accountability_snapshots(id) on delete cascade,
  name text not null,
  kind text,
  level text,
  state text,
  note text,
  total_axon numeric(14, 2) not null default 0,
  total_flock numeric(14, 2) not null default 0,
  total_received numeric(14, 2) not null default 0,
  constraint accountability_organizations_level_check
    check (level is null or level in ('federal', 'state', 'local', 'association'))
);

create index accountability_organizations_snapshot_id_idx
  on public.accountability_organizations (snapshot_id);
create index accountability_organizations_state_idx
  on public.accountability_organizations (state);

comment on table public.accountability_organizations is
  'Parties, PACs, ballot committees and associations that received Axon or Flock money.';

create table public.accountability_roll_calls (
  id text primary key,
  snapshot_id bigint not null references public.accountability_snapshots(id) on delete cascade,
  jurisdiction text not null,
  chamber text not null,
  vote_date date not null,
  bill text not null,
  title text not null,
  question text not null,
  result text,
  topic text not null,
  tally_yes integer not null default 0,
  tally_no integer not null default 0,
  tally_other integer not null default 0,
  lobbied_by text[] not null default '{}'::text[],
  source_url text not null,
  constraint accountability_roll_calls_chamber_check
    check (chamber in ('house', 'senate'))
);

create index accountability_roll_calls_snapshot_id_idx
  on public.accountability_roll_calls (snapshot_id);

comment on table public.accountability_roll_calls is
  'Tracked roll calls (House Clerk, Voteview Senate, Arizona Legislature).';

create table public.accountability_contributions (
  id bigint generated always as identity primary key,
  snapshot_id bigint not null references public.accountability_snapshots(id) on delete cascade,
  official_id text references public.accountability_officials(id) on delete cascade,
  organization_id text references public.accountability_organizations(id) on delete cascade,
  company text not null,
  channel text not null,
  source text not null,
  amount numeric(14, 2) not null,
  contributed_on date,
  date_from date,
  date_to date,
  donor text,
  donor_role text,
  via text,
  source_url text,
  donor_count integer,
  contribution_count integer,
  constraint accountability_contributions_one_recipient
    check ((official_id is not null) <> (organization_id is not null)),
  constraint accountability_contributions_company_check
    check (company in ('axon', 'flock')),
  constraint accountability_contributions_channel_check
    check (channel in ('pac', 'corporate', 'company_committee', 'executive', 'lobbyist', 'employees')),
  constraint accountability_contributions_amount_check
    check (amount >= 0)
);

create index accountability_contributions_snapshot_id_idx
  on public.accountability_contributions (snapshot_id);
create index accountability_contributions_official_id_idx
  on public.accountability_contributions (official_id)
  where official_id is not null;
create index accountability_contributions_organization_id_idx
  on public.accountability_contributions (organization_id)
  where organization_id is not null;
create index accountability_contributions_company_channel_idx
  on public.accountability_contributions (company, channel);

comment on table public.accountability_contributions is
  'Itemized or aggregated political contributions from Axon or Flock Safety.';

create table public.accountability_official_votes (
  official_id text not null references public.accountability_officials(id) on delete cascade,
  roll_call_id text not null references public.accountability_roll_calls(id) on delete cascade,
  position text not null,
  primary key (official_id, roll_call_id),
  constraint accountability_official_votes_position_check
    check (position in ('yes', 'no', 'nv', 'present'))
);

create index accountability_official_votes_roll_call_id_idx
  on public.accountability_official_votes (roll_call_id);

comment on table public.accountability_official_votes is
  'How compiled officials voted on tracked roll calls.';

create table public.accountability_lobbying (
  id bigint generated always as identity primary key,
  snapshot_id bigint not null references public.accountability_snapshots(id) on delete cascade,
  company text not null,
  year integer not null,
  filings integer not null default 0,
  reported_amount numeric(14, 2) not null default 0,
  registrants text[] not null default '{}'::text[],
  top_issues text[] not null default '{}'::text[],
  bills text[] not null default '{}'::text[],
  source_url text not null,
  constraint accountability_lobbying_company_check
    check (company in ('axon', 'flock')),
  constraint accountability_lobbying_year_check
    check (year >= 2000)
);

create index accountability_lobbying_snapshot_id_idx
  on public.accountability_lobbying (snapshot_id);

comment on table public.accountability_lobbying is
  'Federal LDA lobbying totals by company and year.';

create table public.accountability_coverage (
  id bigint generated always as identity primary key,
  snapshot_id bigint not null references public.accountability_snapshots(id) on delete cascade,
  jurisdiction text not null,
  level text not null,
  source text not null,
  source_url text,
  status text not null,
  note text,
  constraint accountability_coverage_status_check
    check (status in ('searched', 'partial', 'not_searched', 'blocked'))
);

create index accountability_coverage_snapshot_id_idx
  on public.accountability_coverage (snapshot_id);

comment on table public.accountability_coverage is
  'Which jurisdictions were searched for Axon / Flock political money.';

create table public.accountability_reported (
  id bigint generated always as identity primary key,
  snapshot_id bigint not null references public.accountability_snapshots(id) on delete cascade,
  company text not null,
  jurisdiction text not null,
  summary text not null,
  source text not null,
  source_url text not null,
  constraint accountability_reported_company_check
    check (company in ('axon', 'flock'))
);

create index accountability_reported_snapshot_id_idx
  on public.accountability_reported (snapshot_id);

comment on table public.accountability_reported is
  'News-reported items that are not counted in contribution totals.';

-- Public read, no client writes. service_role bypasses RLS for reloads.
do $$
declare
  t text;
begin
  foreach t in array array[
    'accountability_snapshots',
    'accountability_companies',
    'accountability_officials',
    'accountability_organizations',
    'accountability_roll_calls',
    'accountability_contributions',
    'accountability_official_votes',
    'accountability_lobbying',
    'accountability_coverage',
    'accountability_reported'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || '_select_public',
      t
    );
    execute format('grant select on table public.%I to anon, authenticated', t);
    execute format(
      'grant select, insert, update, delete on table public.%I to service_role',
      t
    );
  end loop;
end $$;

grant usage, select on sequence public.accountability_snapshots_id_seq to service_role;
grant usage, select on sequence public.accountability_contributions_id_seq to service_role;
grant usage, select on sequence public.accountability_lobbying_id_seq to service_role;
grant usage, select on sequence public.accountability_coverage_id_seq to service_role;
grant usage, select on sequence public.accountability_reported_id_seq to service_role;

commit;
