-- Add privacy level support to existing tables
-- This script adds privacy-related columns to the po_polls table

-- Add privacy level column to po_polls table
ALTER TABLE po_polls 
ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'public' 
CHECK (privacy_level IN ('public', 'private', 'high-privacy'));

-- Add privacy metadata column
ALTER TABLE po_polls 
ADD COLUMN IF NOT EXISTS privacy_metadata JSONB DEFAULT '{}';

-- Add user_id column for poll creators (if not exists)
ALTER TABLE po_polls 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add created_by column for poll creators (if not exists)
ALTER TABLE po_polls 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add voting_method column (if not exists)
ALTER TABLE po_polls 
ADD COLUMN IF NOT EXISTS voting_method TEXT DEFAULT 'single' 
CHECK (voting_method IN ('single', 'multiple', 'ranked', 'approval', 'range', 'quadratic'));

-- Add category and tags columns (if not exists)
ALTER TABLE po_polls 
ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE po_polls 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_po_polls_privacy_level ON po_polls(privacy_level);
CREATE INDEX IF NOT EXISTS idx_po_polls_user_id ON po_polls(user_id);
CREATE INDEX IF NOT EXISTS idx_po_polls_category ON po_polls(category);
CREATE INDEX IF NOT EXISTS idx_po_polls_status_privacy ON po_polls(status, privacy_level);

-- Add privacy level to po_votes table for tracking
ALTER TABLE po_votes 
ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'public' 
CHECK (privacy_level IN ('public', 'private', 'high-privacy'));

-- Add user_id column to po_votes (if not exists)
ALTER TABLE po_votes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add vote metadata column
ALTER TABLE po_votes 
ADD COLUMN IF NOT EXISTS vote_metadata JSONB DEFAULT '{}';

-- Add indexes for vote privacy
CREATE INDEX IF NOT EXISTS idx_po_votes_privacy_level ON po_votes(privacy_level);
CREATE INDEX IF NOT EXISTS idx_po_votes_user_id ON po_votes(user_id);

-- Create function to get poll privacy settings
CREATE OR REPLACE FUNCTION get_poll_privacy_settings(poll_id_param TEXT)
RETURNS TABLE (
  poll_id TEXT,
  privacy_level TEXT,
  requires_authentication BOOLEAN,
  allows_anonymous_voting BOOLEAN,
  uses_blinded_tokens BOOLEAN,
  provides_audit_receipts BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.poll_id,
    p.privacy_level,
    CASE 
      WHEN p.privacy_level = 'public' THEN FALSE
      ELSE TRUE
    END as requires_authentication,
    CASE 
      WHEN p.privacy_level = 'public' THEN TRUE
      ELSE FALSE
    END as allows_anonymous_voting,
    CASE 
      WHEN p.privacy_level = 'high-privacy' THEN TRUE
      ELSE FALSE
    END as uses_blinded_tokens,
    CASE 
      WHEN p.privacy_level = 'high-privacy' THEN TRUE
      ELSE FALSE
    END as provides_audit_receipts
  FROM po_polls p
  WHERE p.poll_id = poll_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update poll privacy level
CREATE OR REPLACE FUNCTION update_poll_privacy_level(
  poll_id_param TEXT,
  new_privacy_level TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE po_polls 
  SET 
    privacy_level = new_privacy_level,
    privacy_metadata = jsonb_set(
      COALESCE(privacy_metadata, '{}'),
      '{updated_at}',
      to_jsonb(NOW())
    )
  WHERE poll_id = poll_id_param;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
