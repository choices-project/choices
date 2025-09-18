-- ============================================================================
-- CIVICS RLS ENABLEMENT - PHASE 1 SECURITY HARDENING
-- ============================================================================
-- Safe to re-run. Creates a private helper, enables RLS, and sets read-only public policies.
-- 
-- Created: 2025-01-17
-- Status: Production Ready - Idempotent
-- ============================================================================

-- 1) Safe private schema for helpers
create schema if not exists private;

-- 2) Helper to conditionally create a policy
create or replace function private.create_policy_if_absent(
  p_schema text, p_table text, p_policy_name text, p_cmd text, p_roles text, p_using text, p_check text default null
) returns void language plpgsql as $$
declare
  v_exists boolean;
  v_sql text;
begin
  select exists(
    select 1 from pg_policies
    where schemaname = p_schema and tablename = p_table and policyname = p_policy_name
  ) into v_exists;

  if not v_exists then
    v_sql := format(
      'create policy %I on %I.%I for %s to %s using (%s)%s;',
      p_policy_name, p_schema, p_table, p_cmd, p_roles, p_using,
      case when p_check is not null then format(' with check (%s)', p_check) else '' end
    );
    execute v_sql;
  end if;
end
$$;

-- 3) Enable RLS + public read for truly public datasets
do $$
declare
  table_name text;
  civics_tables text[] := array[
    'civics_votes_minimal',
    'civics_fec_minimal',
    'civics_quality_thresholds',
    'civics_expected_counts',
    'civics_source_precedence',
    'civics_person_xref'
  ];
begin
  foreach table_name in array civics_tables loop
    execute format('alter table if exists public.%I enable row level security;', table_name);

    -- Explicit, read-only public access (anon + authenticated)
    perform private.create_policy_if_absent('public', table_name, 'public_select', 'select', 'anon, authenticated', 'true', null);

    -- DO NOT add write policies for anon/authenticated.
    -- Admin/ETL should use service key which bypasses RLS. (No policy required)
  end loop;
end
$$;

-- 4) (Optional) If you ever want authenticated-only reads instead of public:
--    comment out the 'public_select' creation above, and use:
-- perform private.create_policy_if_absent('public', r, 'auth_select', 'select', 'authenticated', 'true', null);

-- ============================================================================
-- VERIFICATION QUERIES (run these to confirm success)
-- ============================================================================

-- Check RLS is enabled on all civics tables
select 
  'RLS Status' as check_type,
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename like 'civics_%'
order by tablename;

-- Check policies are created
select 
  'Policy Status' as check_type,
  schemaname, 
  tablename, 
  policyname, 
  roles, 
  cmd, 
  qual as using_expr
from pg_policies
where schemaname = 'public'
  and tablename like 'civics_%'
order by tablename, policyname;
