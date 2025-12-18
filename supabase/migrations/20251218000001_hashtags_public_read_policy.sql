-- Allow public (anonymous) read access to hashtags table
-- This enables the trending hashtags feature to work without authentication

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS public.hashtags ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to hashtags
-- This allows anyone to view hashtags (trending, search, etc.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'hashtags' 
    AND policyname = 'hashtags_public_read'
  ) THEN
    CREATE POLICY hashtags_public_read ON public.hashtags
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Also ensure authenticated users can read hashtags
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'hashtags' 
    AND policyname = 'hashtags_authenticated_read'
  ) THEN
    CREATE POLICY hashtags_authenticated_read ON public.hashtags
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

