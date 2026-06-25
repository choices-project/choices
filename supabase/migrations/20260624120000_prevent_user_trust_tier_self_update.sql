-- Trust tier is server-managed only (service role / maintenance SQL).
-- Users must not set or change trust_tier* via PostgREST as authenticated/anon.
-- Production may record this as version 20260625000926 when applied via Supabase MCP apply_migration.

CREATE OR REPLACE FUNCTION public.guard_user_profiles_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  jwt_role text := nullif(current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF jwt_role IS NULL AND session_user IN ('postgres', 'supabase_admin', 'supabase_storage_admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.trust_tier := 'T0';
    NEW.trust_tier_score := NULL;
    RETURN NEW;
  END IF;

  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    RAISE EXCEPTION 'cannot modify is_admin';
  END IF;

  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'cannot modify is_active';
  END IF;

  IF NEW.trust_tier IS DISTINCT FROM OLD.trust_tier THEN
    RAISE EXCEPTION 'cannot modify trust_tier';
  END IF;

  IF NEW.trust_tier_score IS DISTINCT FROM OLD.trust_tier_score THEN
    RAISE EXCEPTION 'cannot modify trust_tier_score';
  END IF;

  IF NEW.trust_tier_version IS DISTINCT FROM OLD.trust_tier_version THEN
    RAISE EXCEPTION 'cannot modify trust_tier_version';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_privileged_columns_guard ON public.user_profiles;

CREATE TRIGGER user_profiles_privileged_columns_guard
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_user_profiles_privileged_columns();

REVOKE UPDATE (trust_tier, trust_tier_score, trust_tier_version)
  ON public.user_profiles
  FROM authenticated, anon;
