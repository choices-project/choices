-- Automatically refresh poll_demographic_insights when trust_tier_analytics rows are inserted/updated

create or replace function public.trigger_update_poll_insights()
returns trigger
language plpgsql
as $$
declare
  v_poll_id uuid;
begin
  -- Determine poll_id if present (stored as text in some flows)
  begin
    v_poll_id := coalesce(nullif(new.poll_id::uuid, null), null);
  exception when others then
    -- Attempt to parse text UUID
    begin
      v_poll_id := (new.poll_id)::uuid;
    exception when others then
      v_poll_id := null;
    end;
  end;

  if v_poll_id is not null then
    perform public.update_poll_demographic_insights(v_poll_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trust_tier_analytics_update_insights on public.trust_tier_analytics;
create trigger trust_tier_analytics_update_insights
after insert or update on public.trust_tier_analytics
for each row
execute procedure public.trigger_update_poll_insights();

grant execute on function public.trigger_update_poll_insights() to anon, authenticated, service_role;


