-- ------------------------------------------------------------------
-- 20251112090500_grant_civic_elections.sql
-- Grants appropriate privileges for the civic_elections table.
-- ------------------------------------------------------------------

grant select, insert, update, delete on table public.civic_elections to service_role;
grant select on table public.civic_elections to authenticated;
grant select on table public.civic_elections to anon;


