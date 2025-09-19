-- ============================================================================
-- POLLS TABLE SCHEMA
-- ============================================================================
-- This table stores user-created polls

CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL,
  voting_method TEXT NOT NULL CHECK (voting_method IN ('single', 'multiple', 'ranked', 'approval', 'range', 'quadratic')),
  privacy_level TEXT NOT NULL DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'invite-only')),
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  total_votes INTEGER DEFAULT 0,
  participation INTEGER DEFAULT 0,
  sponsors TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  is_mock BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}'
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for user's polls
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);

-- Index for active polls
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_polls_category ON polls(category);

-- Index for privacy level
CREATE INDEX IF NOT EXISTS idx_polls_privacy ON polls(privacy_level);

-- Index for recent polls
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);

-- Index for poll expiration
CREATE INDEX IF NOT EXISTS idx_polls_end_time ON polls(end_time);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view public polls
CREATE POLICY "Users can view public polls" ON polls
  FOR SELECT USING (privacy_level = 'public');

-- Policy: Users can view their own polls
CREATE POLICY "Users can view their own polls" ON polls
  FOR SELECT USING (auth.uid() = created_by);

-- Policy: Users can create polls
CREATE POLICY "Users can create polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy: Users can update their own polls
CREATE POLICY "Users can update their own polls" ON polls
  FOR UPDATE USING (auth.uid() = created_by);

-- Policy: Users can delete their own polls
CREATE POLICY "Users can delete their own polls" ON polls
  FOR DELETE USING (auth.uid() = created_by);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_polls_updated_at 
  BEFORE UPDATE ON polls 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA (for development/testing)
-- ============================================================================

-- Insert sample polls (only if table is empty)
INSERT INTO polls (title, description, options, voting_method, category, tags, created_by, status, total_votes, participation)
SELECT 
  'Sample Poll: Climate Action',
  'Which climate initiatives should be prioritized in the coming year?',
  '["Renewable Energy Investment", "Carbon Tax Implementation", "Electric Vehicle Infrastructure", "Green Building Standards", "Public Transportation"]'::jsonb,
  'single',
  'environment',
  ARRAY['climate', 'environment', 'sustainability'],
  auth.uid(),
  'active',
  2847,
  78
WHERE NOT EXISTS (SELECT 1 FROM polls LIMIT 1);

INSERT INTO polls (title, description, options, voting_method, category, tags, created_by, status, total_votes, participation)
SELECT 
  'Sample Poll: Technology Priorities',
  'What emerging technologies should receive government funding?',
  '["Artificial Intelligence Research", "Quantum Computing Development", "Cybersecurity Infrastructure", "Digital Privacy Tools", "Blockchain Applications"]'::jsonb,
  'multiple',
  'technology',
  ARRAY['technology', 'innovation', 'funding'],
  auth.uid(),
  'active',
  1956,
  65
WHERE NOT EXISTS (SELECT 1 FROM polls WHERE title = 'Sample Poll: Technology Priorities');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE polls IS 'Stores user-created polls with voting options and results';
COMMENT ON COLUMN polls.id IS 'Unique identifier for the poll';
COMMENT ON COLUMN polls.title IS 'Poll question or title';
COMMENT ON COLUMN polls.description IS 'Detailed description or context for the poll';
COMMENT ON COLUMN polls.options IS 'JSON array of poll options';
COMMENT ON COLUMN polls.voting_method IS 'Type of voting method used (single, multiple, ranked, etc.)';
COMMENT ON COLUMN polls.privacy_level IS 'Privacy setting for the poll (public, private, invite-only)';
COMMENT ON COLUMN polls.category IS 'Category classification for the poll';
COMMENT ON COLUMN polls.tags IS 'Array of tags for categorization and search';
COMMENT ON COLUMN polls.created_by IS 'User ID who created the poll';
COMMENT ON COLUMN polls.status IS 'Current status of the poll';
COMMENT ON COLUMN polls.total_votes IS 'Total number of votes cast';
COMMENT ON COLUMN polls.participation IS 'Participation percentage or metric';
COMMENT ON COLUMN polls.sponsors IS 'Array of sponsor names or organizations';
COMMENT ON COLUMN polls.end_time IS 'When the poll expires or closes';
COMMENT ON COLUMN polls.is_mock IS 'Flag to identify mock/test data';
COMMENT ON COLUMN polls.settings IS 'Additional poll settings and configuration';

