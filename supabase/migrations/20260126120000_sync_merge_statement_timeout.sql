-- Increase statement_timeout for OpenStates merge RPCs.
-- Merge failed with "canceling statement due to statement timeout" when
-- processing ~25k representatives. Default timeout is often 8s; set to 10min.
-- See: services/civics-backend/docs/CURRENT_STATUS.md

begin;

set search_path = public, extensions;

alter function public.sync_representatives_from_openstates()
  set statement_timeout = '600s';

alter function public.refresh_divisions_from_openstates()
  set statement_timeout = '300s';

commit;
