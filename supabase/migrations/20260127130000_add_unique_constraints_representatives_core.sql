-- Add unique constraints on identifier columns
-- Following Supabase best practices: use partial indexes for NOT NULL values
-- Note: CONCURRENTLY cannot be used in a transaction, so indexes are created outside transaction
-- Run deduplication first: npm run tools:fix:duplicates -- --apply

-- Unique constraint on openstates_id (where not null)
-- Partial index is smaller and faster than full index
-- CONCURRENTLY allows zero-downtime index creation
create unique index concurrently if not exists idx_representatives_core_openstates_id_unique
  on public.representatives_core(openstates_id)
  where openstates_id is not null;

comment on index idx_representatives_core_openstates_id_unique is
  'Ensures unique openstates_id values. Partial index only includes non-null values for efficiency.';

-- Unique constraint on bioguide_id for federal reps only
-- Partial index filters by level = 'federal' AND bioguide_id IS NOT NULL
create unique index concurrently if not exists idx_representatives_core_bioguide_id_unique
  on public.representatives_core(bioguide_id)
  where bioguide_id is not null and level = 'federal';

comment on index idx_representatives_core_bioguide_id_unique is
  'Ensures unique bioguide_id values for federal representatives. Partial index for efficiency.';

-- Unique constraint on canonical_id (where not null)
-- Partial index only includes non-null values
create unique index concurrently if not exists idx_representatives_core_canonical_id_unique
  on public.representatives_core(canonical_id)
  where canonical_id is not null;

comment on index idx_representatives_core_canonical_id_unique is
  'Ensures unique canonical_id values. Partial index only includes non-null values for efficiency.';
