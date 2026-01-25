-- Add performance indexes following Supabase best practices
-- Using partial indexes for filtered queries, composite indexes for multi-column queries
-- Using GIN index for text search (trigram)

begin;

-- Enable pg_trgm extension for trigram text search
create extension if not exists pg_trgm;

-- Composite index for most common query pattern: is_active + state + level
-- Partial index only includes active reps (smaller, faster)
-- Column order: equality first (is_active), then state, then level
create index if not exists idx_representatives_core_active_state_level
  on public.representatives_core(is_active, state, level)
  where is_active = true;

comment on index idx_representatives_core_active_state_level is
  'Composite partial index for active rep queries filtered by state and level. Most common query pattern.';

-- GIN index for name search using trigram (ILIKE queries)
-- GIN is optimal for pattern matching and text search
create index if not exists idx_representatives_core_name_trgm
  on public.representatives_core using gin(name gin_trgm_ops);

comment on index idx_representatives_core_name_trgm is
  'GIN trigram index for fast name search (ILIKE queries). Supports pattern matching.';

-- Composite index for data quality sorting on active reps
-- Partial index only includes active reps
-- Column order: data_quality_score DESC (for sorting), then name (for tie-breaking)
create index if not exists idx_representatives_core_data_quality_active
  on public.representatives_core(data_quality_score desc nulls last, name)
  where is_active = true;

comment on index idx_representatives_core_data_quality_active is
  'Composite partial index for sorting active reps by data quality score, then name.';

-- Partial indexes for external ID lookups (only non-null values)
-- These support fast lookups when filtering by external IDs
create index if not exists idx_representatives_core_fec_id
  on public.representatives_core(fec_id)
  where fec_id is not null;

comment on index idx_representatives_core_fec_id is
  'Partial index for FEC ID lookups. Only includes non-null values.';

create index if not exists idx_representatives_core_congress_gov_id
  on public.representatives_core(congress_gov_id)
  where congress_gov_id is not null;

comment on index idx_representatives_core_congress_gov_id is
  'Partial index for Congress.gov ID lookups. Only includes non-null values.';

-- Index for bioguide_id lookups (federal reps)
create index if not exists idx_representatives_core_bioguide_id
  on public.representatives_core(bioguide_id)
  where bioguide_id is not null and level = 'federal';

comment on index idx_representatives_core_bioguide_id is
  'Partial index for bioguide_id lookups on federal reps. Only includes non-null values.';

-- Index for state + level queries (common filter pattern)
-- Partial index for active reps only
create index if not exists idx_representatives_core_state_level_active
  on public.representatives_core(state, level)
  where is_active = true;

comment on index idx_representatives_core_state_level_active is
  'Composite partial index for state + level queries on active reps.';

commit;
