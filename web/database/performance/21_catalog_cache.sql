-- ============================================================================
-- CATALOG CACHE - PHASE 2.2 PERFORMANCE OPTIMIZATION
-- ============================================================================
-- Caches system catalog introspection to avoid repeated pg_class/pg_attribute scans
-- Replaces the expensive "with records as (select c.oid..." queries
-- 
-- Created: 2025-01-17
-- Status: Production Ready - Performance Fix
-- ============================================================================

-- Create meta schema for cached metadata
create schema if not exists meta;

-- Cache lightweight table/column metadata your app needs
create materialized view if not exists meta.mv_table_columns as
select
  c.oid::int8                  as table_id,
  nc.nspname                   as schema,
  c.relname                    as table_name,
  a.attnum,
  a.attname                    as column_name,
  pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
  a.attnotnull                 as not_null,
  a.attnum > 0                 as is_user_column,
  not a.attisdropped           as is_active
from pg_class c
join pg_namespace nc on nc.oid = c.relnamespace
join pg_attribute a on a.attrelid = c.oid
where c.relkind in ('r','p','v','m')       -- tables/partitions/views/mviews
  and a.attnum > 0
  and not a.attisdropped
  and nc.nspname = 'public'                -- focus on public schema
order by nc.nspname, c.relname, a.attnum;

-- Fast lookups for common queries
create index if not exists idx_mv_table_columns_schema_table
  on meta.mv_table_columns (schema, table_name);

create index if not exists idx_mv_table_columns_table_id
  on meta.mv_table_columns (table_id);

create index if not exists idx_mv_table_columns_column_name
  on meta.mv_table_columns (column_name);

-- Refresh helper function
create or replace function meta.refresh_mv_table_columns()
returns void language plpgsql as $$
begin
  refresh materialized view concurrently meta.mv_table_columns;
  raise notice 'Refreshed meta.mv_table_columns at %', now();
end$$;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Instead of complex catalog queries, use the materialized view:
-- 
-- OLD (slow):
--   with records as ( select c.oid::int8 as "id", case c...
--
-- NEW (fast):
--   select * from meta.mv_table_columns where table_name = 'civics_votes_minimal';

-- Get all columns for a specific table
-- select column_name, data_type, not_null 
-- from meta.mv_table_columns 
-- where schema = 'public' and table_name = 'civics_votes_minimal'
-- order by attnum;

-- Get all tables in public schema
-- select distinct table_name 
-- from meta.mv_table_columns 
-- where schema = 'public'
-- order by table_name;

-- ============================================================================
-- INITIAL REFRESH
-- ============================================================================

-- Populate the materialized view immediately
refresh materialized view meta.mv_table_columns;

-- Verify it worked
select 
  count(*) as total_columns,
  count(distinct table_name) as total_tables
from meta.mv_table_columns
where schema = 'public';
