-- Add RLS policy to allow anonymous read access to civics_representatives
-- This enables public access to representative data while maintaining security
-- Safe to run multiple times: uses IF NOT EXISTS guards

-- Enable RLS on civics_representatives if not already enabled
DO $$
BEGIN
  -- Check if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'civics_representatives'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.civics_representatives ENABLE ROW LEVEL SECURITY;

    -- Create policy for anonymous read access
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = 'civics_representatives'
      AND policyname = 'allow_anonymous_read_access'
    ) THEN
      CREATE POLICY allow_anonymous_read_access ON public.civics_representatives
        FOR SELECT
        USING (true);

      COMMENT ON POLICY allow_anonymous_read_access ON public.civics_representatives IS
        'Allows anonymous users to read all representative data. This enables public API access while RLS still protects writes/updates.';
    END IF;

    -- Grant SELECT permission to anon role if not already granted
    GRANT SELECT ON TABLE public.civics_representatives TO anon;

  ELSE
    RAISE NOTICE 'Table civics_representatives does not exist. Skipping RLS policy creation.';
  END IF;
END $$;

