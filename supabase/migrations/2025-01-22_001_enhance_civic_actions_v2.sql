-- Enhance civic_actions table for Civic Engagement V2 features
-- Adds: urgency_level, is_public, target_representatives (array), metadata support
-- Safe to run multiple times: uses IF NOT EXISTS guards

-- Add urgency_level column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'civic_actions'
    AND column_name = 'urgency_level'
  ) THEN
    ALTER TABLE public.civic_actions
    ADD COLUMN urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'critical'));

    -- Set default for existing rows
    UPDATE public.civic_actions
    SET urgency_level = 'medium'
    WHERE urgency_level IS NULL;

    -- Make it NOT NULL after setting defaults
    ALTER TABLE public.civic_actions
    ALTER COLUMN urgency_level SET NOT NULL;
    ALTER TABLE public.civic_actions
    ALTER COLUMN urgency_level SET DEFAULT 'medium';
  END IF;
END $$;

-- Add is_public column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'civic_actions'
    AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.civic_actions
    ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT true;

    -- Create index for public actions filtering
    CREATE INDEX IF NOT EXISTS civic_actions_is_public_idx
    ON public.civic_actions (is_public)
    WHERE is_public = true;
  END IF;
END $$;

-- Add target_representatives array column (for multiple representatives)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'civic_actions'
    AND column_name = 'target_representatives'
  ) THEN
    ALTER TABLE public.civic_actions
    ADD COLUMN target_representatives INTEGER[];

    -- Migrate existing target_representative_id to array
    UPDATE public.civic_actions
    SET target_representatives = ARRAY[target_representative_id]::INTEGER[]
    WHERE target_representative_id IS NOT NULL
    AND target_representatives IS NULL;

    -- Create GIN index for array queries
    CREATE INDEX IF NOT EXISTS civic_actions_target_representatives_idx
    ON public.civic_actions USING GIN (target_representatives);
  END IF;
END $$;

-- Add metadata JSONB column for flexible data storage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'civic_actions'
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.civic_actions
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

    -- Create GIN index for JSONB queries
    CREATE INDEX IF NOT EXISTS civic_actions_metadata_idx
    ON public.civic_actions USING GIN (metadata);
  END IF;
END $$;

-- Add index for urgency_level filtering
CREATE INDEX IF NOT EXISTS civic_actions_urgency_level_idx
ON public.civic_actions (urgency_level);

-- Add index for status + is_public for common queries
CREATE INDEX IF NOT EXISTS civic_actions_status_public_idx
ON public.civic_actions (status, is_public)
WHERE status = 'active' AND is_public = true;

-- Add index for trending queries (status, current_signatures, created_at)
CREATE INDEX IF NOT EXISTS civic_actions_trending_idx
ON public.civic_actions (status, current_signatures DESC, created_at DESC)
WHERE status = 'active' AND is_public = true;

-- Add RLS policies if they don't exist
DO $$
BEGIN
  -- Enable RLS
  ALTER TABLE public.civic_actions ENABLE ROW LEVEL SECURITY;

  -- Policy: Users can view public actions or their own actions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'civic_actions'
    AND policyname = 'civic_actions_select_policy'
  ) THEN
    CREATE POLICY civic_actions_select_policy ON public.civic_actions
      FOR SELECT
      USING (
        is_public = true
        OR created_by::text = auth.uid()::text
      );
  END IF;

  -- Policy: Authenticated users can create actions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'civic_actions'
    AND policyname = 'civic_actions_insert_policy'
  ) THEN
    CREATE POLICY civic_actions_insert_policy ON public.civic_actions
      FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
  END IF;

  -- Policy: Users can update their own actions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'civic_actions'
    AND policyname = 'civic_actions_update_policy'
  ) THEN
    CREATE POLICY civic_actions_update_policy ON public.civic_actions
      FOR UPDATE
      USING (created_by::text = auth.uid()::text)
      WITH CHECK (created_by::text = auth.uid()::text);
  END IF;

  -- Policy: Users can delete their own actions (or admins)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'civic_actions'
    AND policyname = 'civic_actions_delete_policy'
  ) THEN
    CREATE POLICY civic_actions_delete_policy ON public.civic_actions
      FOR DELETE
      USING (
        created_by::text = auth.uid()::text
        OR EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_id = auth.uid()
          AND is_admin = true
        )
      );
  END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.civic_actions TO authenticated;
GRANT SELECT ON TABLE public.civic_actions TO anon;

-- Add comment
COMMENT ON COLUMN public.civic_actions.urgency_level IS 'Urgency level: low, medium, high, critical';
COMMENT ON COLUMN public.civic_actions.is_public IS 'Whether the action is publicly visible';
COMMENT ON COLUMN public.civic_actions.target_representatives IS 'Array of representative IDs to target (replaces single target_representative_id)';
COMMENT ON COLUMN public.civic_actions.metadata IS 'Additional metadata stored as JSONB';

