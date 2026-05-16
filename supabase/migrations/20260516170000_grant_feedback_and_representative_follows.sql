-- Restore API access for feedback persistence (service role) and civics follow buttons.
-- Without these grants, getSupabaseAdminClient() gets "permission denied" and the
-- session fallback can fail RLS on INSERT ... RETURNING.

begin;

grant select, insert, update, delete on table public.feedback to service_role;

grant select, insert, update, delete on table public.representative_follows to service_role;
grant select, insert, update, delete on table public.representative_follows to authenticated;

commit;
