-- migrate:up
-- Wrap auth.*() and current_setting() calls in RLS policies with SELECT to avoid per-row re-evaluation
DO $$
DECLARE
  policy RECORD;
  new_using text;
  new_check text;
  alter_sql text;
BEGIN
  FOR policy IN
    SELECT policyname,
           schemaname,
           tablename,
           qual,
           with_check
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    new_using := policy.qual;
    new_check := policy.with_check;

    IF new_using IS NOT NULL THEN
      new_using := regexp_replace(
        new_using,
        '(?<!select\s)auth\.([a-z_]+)\(\)',
        '(select auth.\1())',
        'gi'
      );

      new_using := regexp_replace(
        new_using,
        '(?<!select\s)current_setting\(([^)]*)\)',
        '(select current_setting(\1))',
        'gi'
      );
    END IF;

    IF new_check IS NOT NULL THEN
      new_check := regexp_replace(
        new_check,
        '(?<!select\s)auth\.([a-z_]+)\(\)',
        '(select auth.\1())',
        'gi'
      );

      new_check := regexp_replace(
        new_check,
        '(?<!select\s)current_setting\(([^)]*)\)',
        '(select current_setting(\1))',
        'gi'
      );
    END IF;

    IF new_using IS DISTINCT FROM policy.qual OR new_check IS DISTINCT FROM policy.with_check THEN
      alter_sql := format('ALTER POLICY %I ON %I.%I', policy.policyname, policy.schemaname, policy.tablename);

      IF new_using IS NOT NULL THEN
        alter_sql := alter_sql || ' USING ' || new_using;
      END IF;

      IF new_check IS NOT NULL THEN
        alter_sql := alter_sql || ' WITH CHECK ' || new_check;
      END IF;

      EXECUTE alter_sql;
    END IF;
  END LOOP;
END $$;

-- migrate:down
-- No-op (rewriting policies back would reintroduce performance warnings)
SELECT 1;

