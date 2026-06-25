-- Block self-service updates to privilege columns on user_profiles.
-- Admin/service-role updates (dashboard, migrations) are unaffected.
-- Trust tier guards added in 20260624120000_prevent_user_trust_tier_self_update.sql.

CREATE OR REPLACE FUNCTION public.guard_user_profiles_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  jwt_role text := nullif(current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- Supabase service role (admin client, SECURITY DEFINER RPCs)
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Direct SQL maintenance without PostgREST JWT context
  IF jwt_role IS NULL AND session_user IN ('postgres', 'supabase_admin', 'supabase_storage_admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    RAISE EXCEPTION 'cannot modify is_admin';
  END IF;

  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'cannot modify is_active';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_privileged_columns_guard ON public.user_profiles;

CREATE TRIGGER user_profiles_privileged_columns_guard
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_user_profiles_privileged_columns();
