-- Add updated_at triggers following Supabase best practices
-- Automatically maintain updated_at timestamps on all tables

begin;

-- Create reusable trigger function for updated_at
-- Following Supabase best practices: single function for all tables
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.update_updated_at_column() is
  'Trigger function to automatically update updated_at timestamp. Apply to any table with updated_at column.';

-- Apply trigger to representatives_core
drop trigger if exists representatives_core_updated_at on public.representatives_core;
create trigger representatives_core_updated_at
  before update on public.representatives_core
  for each row
  execute function public.update_updated_at_column();

-- Apply trigger to representative_contacts
drop trigger if exists representative_contacts_updated_at on public.representative_contacts;
create trigger representative_contacts_updated_at
  before update on public.representative_contacts
  for each row
  execute function public.update_updated_at_column();

-- Apply trigger to representative_photos
drop trigger if exists representative_photos_updated_at on public.representative_photos;
create trigger representative_photos_updated_at
  before update on public.representative_photos
  for each row
  execute function public.update_updated_at_column();

-- Apply trigger to representative_social_media
drop trigger if exists representative_social_media_updated_at on public.representative_social_media;
create trigger representative_social_media_updated_at
  before update on public.representative_social_media
  for each row
  execute function public.update_updated_at_column();

-- Apply trigger to representative_activity
drop trigger if exists representative_activity_updated_at on public.representative_activity;
create trigger representative_activity_updated_at
  before update on public.representative_activity
  for each row
  execute function public.update_updated_at_column();

-- Apply trigger to representative_committees
drop trigger if exists representative_committees_updated_at on public.representative_committees;
create trigger representative_committees_updated_at
  before update on public.representative_committees
  for each row
  execute function public.update_updated_at_column();

-- Apply trigger to representative_divisions
drop trigger if exists representative_divisions_updated_at on public.representative_divisions;
create trigger representative_divisions_updated_at
  before update on public.representative_divisions
  for each row
  execute function public.update_updated_at_column();

-- Apply trigger to representative_data_sources
drop trigger if exists representative_data_sources_updated_at on public.representative_data_sources;
create trigger representative_data_sources_updated_at
  before update on public.representative_data_sources
  for each row
  execute function public.update_updated_at_column();

-- Apply trigger to representative_data_quality
drop trigger if exists representative_data_quality_updated_at on public.representative_data_quality;
create trigger representative_data_quality_updated_at
  before update on public.representative_data_quality
  for each row
  execute function public.update_updated_at_column();

-- Apply trigger to representative_campaign_finance
drop trigger if exists representative_campaign_finance_updated_at on public.representative_campaign_finance;
create trigger representative_campaign_finance_updated_at
  before update on public.representative_campaign_finance
  for each row
  execute function public.update_updated_at_column();

-- Apply trigger to representative_crosswalk_enhanced
drop trigger if exists representative_crosswalk_enhanced_updated_at on public.representative_crosswalk_enhanced;
create trigger representative_crosswalk_enhanced_updated_at
  before update on public.representative_crosswalk_enhanced
  for each row
  execute function public.update_updated_at_column();

commit;
