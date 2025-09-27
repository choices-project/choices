-- ============================================================================
-- SLOW QUERIES ANALYSIS - PHASE 2.1 PERFORMANCE INVESTIGATION
-- ============================================================================
-- Identifies the "with records as (select c.oid..." slow queries causing 7-8 second execution times
-- 
-- Created: 2025-01-17
-- Status: Production Ready - Analysis Tool
-- ============================================================================

-- Check if pg_stat_statements is available and get column names
do $$
declare
  has_extension boolean;
  column_names text;
begin
  -- Check if extension exists
  select exists(
    select 1 from pg_extension where extname = 'pg_stat_statements'
  ) into has_extension;
  
  if not has_extension then
    raise notice 'pg_stat_statements extension not found. Attempting to create...';
    begin
      create extension pg_stat_statements;
      raise notice 'pg_stat_statements extension created successfully.';
    exception when others then
      raise notice 'Could not create pg_stat_statements extension: %', SQLERRM;
      raise notice 'This is normal in some Supabase configurations.';
    end;
  end if;
  
  -- Check what columns are available
  select string_agg(column_name, ', ' order by ordinal_position)
  into column_names
  from information_schema.columns
  where table_name = 'pg_stat_statements' and table_schema = 'pg_catalog';
  
  raise notice 'Available columns in pg_stat_statements: %', column_names;
end
$$;

-- Top offenders (edit threshold as needed)
-- Note: Column names may vary by PostgreSQL version
select
  calls,
  round(mean_exec_time::numeric, 2) as mean_ms,
  round(total_exec_time::numeric, 2) as total_ms,
  rows,
  left(query, 200) as query_preview
from pg_stat_statements
where mean_exec_time > 1000  -- >1s
order by mean_exec_time desc
limit 50;

-- Focus on the specific "records / c.oid" pattern from dashboard
select
  calls,
  round(mean_exec_time::numeric, 2) as mean_ms,
  round(total_exec_time::numeric, 2) as total_ms,
  rows,
  left(query, 200) as query_preview
from pg_stat_statements
where query like '%with records as%'
   or query like '%c.oid::int8%'
   or query like '%pg_class%'
order by mean_exec_time desc
limit 10;

-- System catalog queries (likely the culprits)
select
  calls,
  round(mean_exec_time::numeric, 2) as mean_ms,
  round(total_exec_time::numeric, 2) as total_ms,
  rows,
  left(query, 200) as query_preview
from pg_stat_statements
where query like '%pg_%'
  and mean_exec_time > 500  -- >500ms
order by mean_exec_time desc
limit 15;

-- ============================================================================
-- ANALYSIS NOTES
-- ============================================================================
-- If you see queries like:
--   "with records as ( select c.oid::int8 as "id", case c..."
-- 
-- These are likely:
-- 1. System catalog introspection (pg_class, pg_attribute)
-- 2. Executed by tooling (codegen, analytics, GraphQL/PostgREST explorers)
-- 3. One-time operations or migrations
-- 
-- Solution: Cache the introspection results in materialized views
-- See: 21_catalog_cache.sql for the fix
-- ============================================================================
