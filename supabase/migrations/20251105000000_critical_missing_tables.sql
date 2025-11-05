-- Create user_followed_representatives table
-- This table tracks which representatives users are following and their notification preferences

CREATE TABLE IF NOT EXISTS public.user_followed_representatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  representative_id integer NOT NULL REFERENCES public.representatives_core(id) ON DELETE CASCADE,
  
  -- Notification preferences
  notify_on_votes boolean DEFAULT true,
  notify_on_committee_activity boolean DEFAULT false,
  notify_on_public_statements boolean DEFAULT false,
  notify_on_events boolean DEFAULT false,
  
  -- Optional user notes/tags
  notes text,
  tags text[],
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure user can't follow same representative twice
  UNIQUE(user_id, representative_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_followed_representatives_user_id 
  ON public.user_followed_representatives(user_id);
  
CREATE INDEX IF NOT EXISTS idx_user_followed_representatives_representative_id 
  ON public.user_followed_representatives(representative_id);

-- Add RLS policies
ALTER TABLE public.user_followed_representatives ENABLE ROW LEVEL SECURITY;

-- Users can only see their own follows
CREATE POLICY "Users can view their own followed representatives"
  ON public.user_followed_representatives
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own follows
CREATE POLICY "Users can follow representatives"
  ON public.user_followed_representatives
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own follows
CREATE POLICY "Users can update their followed representatives"
  ON public.user_followed_representatives
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own follows
CREATE POLICY "Users can unfollow representatives"
  ON public.user_followed_representatives
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_followed_representatives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_followed_representatives_updated_at
  BEFORE UPDATE ON public.user_followed_representatives
  FOR EACH ROW
  EXECUTE FUNCTION update_user_followed_representatives_updated_at();

-- Add comment
COMMENT ON TABLE public.user_followed_representatives IS 
  'Tracks which representatives users are following and their notification preferences';
