begin;

create or replace function public.get_table_columns(target_table text)
returns table (
  column_name text,
  data_type text,
  character_maximum_length integer,
  is_nullable text
)
language sql
security definer
as $$
  select column_name, data_type, character_maximum_length, is_nullable
  from information_schema.columns
  where table_schema = 'public'
    and table_name = target_table
  order by ordinal_position;
$$;

grant execute on function public.get_table_columns(text) to authenticated, service_role, anon;

commit;

