-- Verify and add foreign key indexes
-- Following Supabase best practices: always index foreign key columns
-- Postgres does NOT automatically index foreign keys, causing slow JOINs and CASCADE operations

begin;

-- Index for representative_contacts.representative_id
-- Required for fast JOINs and CASCADE deletes
create index if not exists idx_representative_contacts_representative_id
  on public.representative_contacts(representative_id);

comment on index idx_representative_contacts_representative_id is
  'Index on foreign key for fast JOINs and CASCADE operations. Required per Supabase best practices.';

-- Index for representative_photos.representative_id
create index if not exists idx_representative_photos_representative_id
  on public.representative_photos(representative_id);

comment on index idx_representative_photos_representative_id is
  'Index on foreign key for fast JOINs and CASCADE operations.';

-- Index for representative_social_media.representative_id
create index if not exists idx_representative_social_media_representative_id
  on public.representative_social_media(representative_id);

comment on index idx_representative_social_media_representative_id is
  'Index on foreign key for fast JOINs and CASCADE operations.';

-- Index for representative_activity.representative_id
create index if not exists idx_representative_activity_representative_id
  on public.representative_activity(representative_id);

comment on index idx_representative_activity_representative_id is
  'Index on foreign key for fast JOINs and CASCADE operations.';

-- Index for representative_committees.representative_id
create index if not exists idx_representative_committees_representative_id
  on public.representative_committees(representative_id);

comment on index idx_representative_committees_representative_id is
  'Index on foreign key for fast JOINs and CASCADE operations.';

-- Index for representative_divisions.representative_id
-- Note: This may already exist from migration 20260125120000
create index if not exists idx_representative_divisions_representative_id
  on public.representative_divisions(representative_id);

comment on index idx_representative_divisions_representative_id is
  'Index on foreign key for fast JOINs and CASCADE operations.';

-- Index for representative_data_sources.representative_id
create index if not exists idx_representative_data_sources_representative_id
  on public.representative_data_sources(representative_id);

comment on index idx_representative_data_sources_representative_id is
  'Index on foreign key for fast JOINs and CASCADE operations.';

-- Index for representative_data_quality.representative_id
create index if not exists idx_representative_data_quality_representative_id
  on public.representative_data_quality(representative_id);

comment on index idx_representative_data_quality_representative_id is
  'Index on foreign key for fast JOINs and CASCADE operations.';

-- Index for representative_campaign_finance.representative_id
create index if not exists idx_representative_campaign_finance_representative_id
  on public.representative_campaign_finance(representative_id);

comment on index idx_representative_campaign_finance_representative_id is
  'Index on foreign key for fast JOINs and CASCADE operations.';

-- Index for representative_crosswalk_enhanced.representative_id
create index if not exists idx_representative_crosswalk_enhanced_representative_id
  on public.representative_crosswalk_enhanced(representative_id);

comment on index idx_representative_crosswalk_enhanced_representative_id is
  'Index on foreign key for fast JOINs. Uses SET NULL on delete (historical data).';

-- Verify foreign keys exist (add if missing)
-- Use ON DELETE CASCADE for child data that should be deleted with rep
-- Use ON DELETE SET NULL for crosswalk (may reference historical reps)

-- representative_contacts
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.representative_contacts'::regclass
    and conname = 'fk_representative_contacts_representative_id'
  ) then
    alter table public.representative_contacts
      add constraint fk_representative_contacts_representative_id
      foreign key (representative_id)
      references public.representatives_core(id)
      on delete cascade;
  end if;
end $$;

-- representative_photos
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.representative_photos'::regclass
    and conname = 'fk_representative_photos_representative_id'
  ) then
    alter table public.representative_photos
      add constraint fk_representative_photos_representative_id
      foreign key (representative_id)
      references public.representatives_core(id)
      on delete cascade;
  end if;
end $$;

-- representative_social_media
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.representative_social_media'::regclass
    and conname = 'fk_representative_social_media_representative_id'
  ) then
    alter table public.representative_social_media
      add constraint fk_representative_social_media_representative_id
      foreign key (representative_id)
      references public.representatives_core(id)
      on delete cascade;
  end if;
end $$;

-- representative_activity
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.representative_activity'::regclass
    and conname = 'fk_representative_activity_representative_id'
  ) then
    alter table public.representative_activity
      add constraint fk_representative_activity_representative_id
      foreign key (representative_id)
      references public.representatives_core(id)
      on delete cascade;
  end if;
end $$;

-- representative_committees
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.representative_committees'::regclass
    and conname = 'fk_representative_committees_representative_id'
  ) then
    alter table public.representative_committees
      add constraint fk_representative_committees_representative_id
      foreign key (representative_id)
      references public.representatives_core(id)
      on delete cascade;
  end if;
end $$;

-- representative_divisions
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.representative_divisions'::regclass
    and conname = 'fk_representative_divisions_representative_id'
  ) then
    alter table public.representative_divisions
      add constraint fk_representative_divisions_representative_id
      foreign key (representative_id)
      references public.representatives_core(id)
      on delete cascade;
  end if;
end $$;

-- representative_data_sources
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.representative_data_sources'::regclass
    and conname = 'fk_representative_data_sources_representative_id'
  ) then
    alter table public.representative_data_sources
      add constraint fk_representative_data_sources_representative_id
      foreign key (representative_id)
      references public.representatives_core(id)
      on delete cascade;
  end if;
end $$;

-- representative_data_quality
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.representative_data_quality'::regclass
    and conname = 'fk_representative_data_quality_representative_id'
  ) then
    alter table public.representative_data_quality
      add constraint fk_representative_data_quality_representative_id
      foreign key (representative_id)
      references public.representatives_core(id)
      on delete cascade;
  end if;
end $$;

-- representative_campaign_finance
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.representative_campaign_finance'::regclass
    and conname = 'fk_representative_campaign_finance_representative_id'
  ) then
    alter table public.representative_campaign_finance
      add constraint fk_representative_campaign_finance_representative_id
      foreign key (representative_id)
      references public.representatives_core(id)
      on delete cascade;
  end if;
end $$;

-- representative_crosswalk_enhanced (SET NULL for historical data)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.representative_crosswalk_enhanced'::regclass
    and conname = 'fk_representative_crosswalk_enhanced_representative_id'
  ) then
    alter table public.representative_crosswalk_enhanced
      add constraint fk_representative_crosswalk_enhanced_representative_id
      foreign key (representative_id)
      references public.representatives_core(id)
      on delete set null;
  end if;
end $$;

commit;
