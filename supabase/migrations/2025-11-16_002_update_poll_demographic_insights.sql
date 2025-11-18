-- Create poll_demographic_insights table and a full implementation of
-- update_poll_demographic_insights(p_poll_id uuid) to compute and upsert metrics.

create table if not exists public.poll_demographic_insights (
  poll_id uuid primary key,
  total_responses integer not null default 0,
  trust_tier_breakdown jsonb not null default '{}'::jsonb,
  age_group_breakdown jsonb not null default '{}'::jsonb,
  geographic_breakdown jsonb not null default '{}'::jsonb,
  education_breakdown jsonb not null default '{}'::jsonb,
  income_breakdown jsonb not null default '{}'::jsonb,
  political_breakdown jsonb not null default '{}'::jsonb,
  average_confidence_level numeric not null default 0,
  data_quality_distribution jsonb not null default '{}'::jsonb,
  verification_method_distribution jsonb not null default '{}'::jsonb,
  trust_tier_by_demographic jsonb not null default '{}'::jsonb,
  demographic_by_trust_tier jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists poll_demographic_insights_set_updated_at on public.poll_demographic_insights;
create trigger poll_demographic_insights_set_updated_at
before update on public.poll_demographic_insights
for each row
execute procedure public.set_updated_at();

grant select, insert, update on table public.poll_demographic_insights to anon, authenticated, service_role;

create or replace function public.update_poll_demographic_insights(p_poll_id uuid)
returns void
language plpgsql
as $$
declare
  v_total integer := 0;
  v_t0 integer := 0;
  v_t1 integer := 0;
  v_t2 integer := 0;
  v_t3 integer := 0;
  v_avg_conf numeric := 0;
  v_age jsonb := '{}'::jsonb;
  v_geo jsonb := '{}'::jsonb;
  v_edu jsonb := '{}'::jsonb;
  v_inc jsonb := '{}'::jsonb;
  v_pol jsonb := '{}'::jsonb;
  v_quality jsonb := '{}'::jsonb;
  v_verif jsonb := '{}'::jsonb;
begin
  -- Total responses
  select count(*) into v_total
  from public.trust_tier_analytics
  where poll_id = p_poll_id::text or poll_id = p_poll_id; -- support text or uuid

  -- Trust tier breakdown (T0..T3)
  select
    sum(case when (trust_tier::text in ('T0','0','t0')) then 1 else 0 end),
    sum(case when (trust_tier::text in ('T1','1','t1')) then 1 else 0 end),
    sum(case when (trust_tier::text in ('T2','2','t2')) then 1 else 0 end),
    sum(case when (trust_tier::text in ('T3','3','t3')) then 1 else 0 end)
  into v_t0, v_t1, v_t2, v_t3
  from public.trust_tier_analytics
  where poll_id = p_poll_id::text or poll_id = p_poll_id;

  -- Average confidence
  select coalesce(avg((factors->>'confidence_level')::numeric), 0)
  into v_avg_conf
  from public.trust_tier_analytics
  where poll_id = p_poll_id::text or poll_id = p_poll_id;

  -- Demographic breakdown helpers
  with base as (
    select
      coalesce(nullif(trim(factors->>'age_group'), ''), 'unknown') as age_group,
      coalesce(nullif(trim(factors->>'geographic_region'), ''), 'unknown') as geographic_region,
      coalesce(nullif(trim(factors->>'education_level'), ''), 'unknown') as education_level,
      coalesce(nullif(trim(factors->>'income_bracket'), ''), 'unknown') as income_bracket,
      coalesce(nullif(trim(factors->>'political_affiliation'), ''), 'unknown') as political_affiliation
    from public.trust_tier_analytics
    where poll_id = p_poll_id::text or poll_id = p_poll_id
  ),
  age as (
    select jsonb_object_agg(age_group, cnt) as agg
    from (
      select age_group, count(*)::int as cnt
      from base
      group by age_group
    ) s
  ),
  geo as (
    select jsonb_object_agg(geographic_region, cnt) as agg
    from (
      select geographic_region, count(*)::int as cnt
      from base
      group by geographic_region
    ) s
  ),
  edu as (
    select jsonb_object_agg(education_level, cnt) as agg
    from (
      select education_level, count(*)::int as cnt
      from base
      group by education_level
    ) s
  ),
  inc as (
    select jsonb_object_agg(income_bracket, cnt) as agg
    from (
      select income_bracket, count(*)::int as cnt
      from base
      group by income_bracket
    ) s
  ),
  pol as (
    select jsonb_object_agg(political_affiliation, cnt) as agg
    from (
      select political_affiliation, count(*)::int as cnt
      from base
      group by political_affiliation
    ) s
  )
  select
    coalesce((select agg from age), '{}'::jsonb),
    coalesce((select agg from geo), '{}'::jsonb),
    coalesce((select agg from edu), '{}'::jsonb),
    coalesce((select agg from inc), '{}'::jsonb),
    coalesce((select agg from pol), '{}'::jsonb)
  into v_age, v_geo, v_edu, v_inc, v_pol;

  -- Data quality distribution (high >=0.8, medium 0.5-0.8, low <0.5)
  with q as (
    select
      sum(case when (coalesce((factors->>'confidence_level')::numeric, 0) >= 0.8) then 1 else 0 end)::int as high_quality,
      sum(case when (coalesce((factors->>'confidence_level')::numeric, 0) >= 0.5 and coalesce((factors->>'confidence_level')::numeric, 0) < 0.8) then 1 else 0 end)::int as medium_quality,
      sum(case when (coalesce((factors->>'confidence_level')::numeric, 0) < 0.5) then 1 else 0 end)::int as low_quality
    from public.trust_tier_analytics
    where poll_id = p_poll_id::text or poll_id = p_poll_id
  )
  select jsonb_build_object(
    'high_quality', high_quality,
    'medium_quality', medium_quality,
    'low_quality', low_quality
  ) into v_quality from q;

  -- Verification method distribution
  with methods as (
    select lower(trim(elem)) as method
    from public.trust_tier_analytics t,
    lateral jsonb_array_elements_text(coalesce(t.factors->'verification_methods', '[]'::jsonb)) as elem
    where t.poll_id = p_poll_id::text or t.poll_id = p_poll_id
  )
  select coalesce(jsonb_object_agg(method, cnt), '{}'::jsonb) into v_verif
  from (
    select method, count(*)::int as cnt
    from methods
    group by method
  ) s;

  -- Upsert row
  insert into public.poll_demographic_insights (
    poll_id,
    total_responses,
    trust_tier_breakdown,
    age_group_breakdown,
    geographic_breakdown,
    education_breakdown,
    income_breakdown,
    political_breakdown,
    average_confidence_level,
    data_quality_distribution,
    verification_method_distribution,
    trust_tier_by_demographic,
    demographic_by_trust_tier,
    created_at,
    updated_at
  )
  values (
    p_poll_id,
    v_total,
    jsonb_build_object('T0', v_t0, 'T1', v_t1, 'T2', v_t2, 'T3', v_t3),
    v_age,
    v_geo,
    v_edu,
    v_inc,
    v_pol,
    coalesce(v_avg_conf, 0),
    v_quality,
    v_verif,
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  )
  on conflict (poll_id) do update
  set
    total_responses = excluded.total_responses,
    trust_tier_breakdown = excluded.trust_tier_breakdown,
    age_group_breakdown = excluded.age_group_breakdown,
    geographic_breakdown = excluded.geographic_breakdown,
    education_breakdown = excluded.education_breakdown,
    income_breakdown = excluded.income_breakdown,
    political_breakdown = excluded.political_breakdown,
    average_confidence_level = excluded.average_confidence_level,
    data_quality_distribution = excluded.data_quality_distribution,
    verification_method_distribution = excluded.verification_method_distribution,
    trust_tier_by_demographic = excluded.trust_tier_by_demographic,
    demographic_by_trust_tier = excluded.demographic_by_trust_tier,
    updated_at = now();
end;
$$;

grant execute on function public.update_poll_demographic_insights(uuid) to anon, authenticated, service_role;


