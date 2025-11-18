-- Audit tables to capture edits on candidate profiles and representative overrides

create table if not exists public.candidate_profile_audit (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  field text not null,
  old_value jsonb,
  new_value jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_candidate_profile_audit_candidate on public.candidate_profile_audit(candidate_id);
alter table public.candidate_profile_audit enable row level security;
drop policy if exists "candidate_audit_owner_view" on public.candidate_profile_audit;
create policy "candidate_audit_owner_view"
on public.candidate_profile_audit
for select
to authenticated
using (
  exists (
    select 1 from public.candidate_profiles cp
    where cp.id = candidate_id and (cp.user_id = auth.uid() or cp.is_public = true)
  )
);

create table if not exists public.representative_overrides_audit (
  id uuid primary key default gen_random_uuid(),
  representative_id int not null references public.representatives_core(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  field text not null,
  old_value jsonb,
  new_value jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_rep_overrides_audit_rep on public.representative_overrides_audit(representative_id);
alter table public.representative_overrides_audit enable row level security;
drop policy if exists "rep_overrides_audit_owner_view" on public.representative_overrides_audit;
create policy "rep_overrides_audit_owner_view"
on public.representative_overrides_audit
for select
to authenticated
using (true);

-- Triggers to log changes
create or replace function public.tg_audit_candidate_profiles()
returns trigger as $$
declare
  changed boolean := false;
begin
  if row_to_json(old) is null then
    return new;
  end if;

  if new.display_name is distinct from old.display_name then
    insert into public.candidate_profile_audit(candidate_id, user_id, field, old_value, new_value)
    values (new.id, new.user_id, 'display_name', to_jsonb(old.display_name), to_jsonb(new.display_name));
    changed := true;
  end if;
  if new.bio is distinct from old.bio then
    insert into public.candidate_profile_audit(candidate_id, user_id, field, old_value, new_value)
    values (new.id, new.user_id, 'bio', to_jsonb(old.bio), to_jsonb(new.bio));
    changed := true;
  end if;
  if new.website is distinct from old.website then
    insert into public.candidate_profile_audit(candidate_id, user_id, field, old_value, new_value)
    values (new.id, new.user_id, 'website', to_jsonb(old.website), to_jsonb(new.website));
    changed := true;
  end if;
  if new.social is distinct from old.social then
    insert into public.candidate_profile_audit(candidate_id, user_id, field, old_value, new_value)
    values (new.id, new.user_id, 'social', to_jsonb(old.social), to_jsonb(new.social));
    changed := true;
  end if;
  if new.party is distinct from old.party then
    insert into public.candidate_profile_audit(candidate_id, user_id, field, old_value, new_value)
    values (new.id, new.user_id, 'party', to_jsonb(old.party), to_jsonb(new.party));
    changed := true;
  end if;
  if new.is_public is distinct from old.is_public then
    insert into public.candidate_profile_audit(candidate_id, user_id, field, old_value, new_value)
    values (new.id, new.user_id, 'is_public', to_jsonb(old.is_public), to_jsonb(new.is_public));
    changed := true;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_candidate_profiles_audit on public.candidate_profiles;
create trigger trg_candidate_profiles_audit
after update on public.candidate_profiles
for each row execute function public.tg_audit_candidate_profiles();

create or replace function public.tg_audit_rep_overrides()
returns trigger as $$
begin
  if row_to_json(old) is null then
    return new;
  end if;
  if new.profile_photo_url is distinct from old.profile_photo_url then
    insert into public.representative_overrides_audit(representative_id, user_id, field, old_value, new_value)
    values (new.representative_id, new.user_id, 'profile_photo_url', to_jsonb(old.profile_photo_url), to_jsonb(new.profile_photo_url));
  end if;
  if new.socials is distinct from old.socials then
    insert into public.representative_overrides_audit(representative_id, user_id, field, old_value, new_value)
    values (new.representative_id, new.user_id, 'socials', to_jsonb(old.socials), to_jsonb(new.socials));
  end if;
  if new.short_bio is distinct from old.short_bio then
    insert into public.representative_overrides_audit(representative_id, user_id, field, old_value, new_value)
    values (new.representative_id, new.user_id, 'short_bio', to_jsonb(old.short_bio), to_jsonb(new.short_bio));
  end if;
  if new.campaign_website is distinct from old.campaign_website then
    insert into public.representative_overrides_audit(representative_id, user_id, field, old_value, new_value)
    values (new.representative_id, new.user_id, 'campaign_website', to_jsonb(old.campaign_website), to_jsonb(new.campaign_website));
  end if;
  if new.press_contact is distinct from old.press_contact then
    insert into public.representative_overrides_audit(representative_id, user_id, field, old_value, new_value)
    values (new.representative_id, new.user_id, 'press_contact', to_jsonb(old.press_contact), to_jsonb(new.press_contact));
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_rep_overrides_audit on public.representative_overrides;
create trigger trg_rep_overrides_audit
after update on public.representative_overrides
for each row execute function public.tg_audit_rep_overrides();


