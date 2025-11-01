-- Migration: Fix contact_threads schema to match code expectations
-- Created: January 26, 2025
-- Purpose: Convert contact_threads from junction table to entity table
-- 
-- This migration fixes the schema mismatch where the code expects
-- contact_threads to be an entity table with thread metadata, but
-- the database currently has it as a junction/linking table.
--
-- Changes:
-- 1. Drop old contact_threads table (if exists)
-- 2. Create new contact_threads table with proper schema
-- 3. Add thread_id column to contact_messages
-- 4. Set up indexes, RLS, and triggers

-- ============================================================================
-- Step 1: Drop old contact_threads table if it exists
-- ============================================================================

-- Drop foreign key constraints first
ALTER TABLE IF EXISTS contact_threads 
  DROP CONSTRAINT IF EXISTS contact_threads_message_id_fkey;

-- Drop the old table
DROP TABLE IF EXISTS contact_threads;

-- ============================================================================
-- Step 2: Create new contact_threads table with proper schema
-- ============================================================================

CREATE TABLE contact_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User and representative
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  representative_id INTEGER NOT NULL REFERENCES representatives_core(id) ON DELETE CASCADE,
  
  -- Thread metadata
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived', 'spam')),
  priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE,
  
  -- Message count (denormalized for performance)
  message_count INTEGER DEFAULT 0 NOT NULL CHECK (message_count >= 0),
  
  -- Ensure one active thread per user-representative pair
  CONSTRAINT unique_active_thread UNIQUE(user_id, representative_id) 
    DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================================
-- Step 3: Add thread_id column to contact_messages
-- ============================================================================

-- Add thread_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contact_messages' AND column_name = 'thread_id'
  ) THEN
    ALTER TABLE contact_messages 
      ADD COLUMN thread_id UUID REFERENCES contact_threads(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- Step 4: Create indexes for performance
-- ============================================================================

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_contact_threads_user_id 
  ON contact_threads(user_id);

-- Index for representative queries
CREATE INDEX IF NOT EXISTS idx_contact_threads_representative_id 
  ON contact_threads(representative_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_contact_threads_status 
  ON contact_threads(status);

-- Index for last_message_at sorting
CREATE INDEX IF NOT EXISTS idx_contact_threads_last_message_at 
  ON contact_threads(last_message_at DESC NULLS LAST);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_contact_threads_user_status 
  ON contact_threads(user_id, status);

-- Index for thread_id lookups in messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_thread_id 
  ON contact_messages(thread_id) 
  WHERE thread_id IS NOT NULL;

-- ============================================================================
-- Step 5: Create updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_contact_threads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_threads_updated_at
  BEFORE UPDATE ON contact_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_threads_updated_at();

-- ============================================================================
-- Step 6: Create function to update message count
-- ============================================================================

CREATE OR REPLACE FUNCTION update_contact_thread_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment message count and update last_message_at
    UPDATE contact_threads
    SET 
      message_count = message_count + 1,
      last_message_at = COALESCE(NEW.created_at, NOW())
    WHERE id = NEW.thread_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement message count
    UPDATE contact_threads
    SET message_count = GREATEST(message_count - 1, 0)
    WHERE id = OLD.thread_id;
    
    -- Update last_message_at to the most recent message in the thread
    UPDATE contact_threads
    SET last_message_at = (
      SELECT MAX(created_at) 
      FROM contact_messages 
      WHERE thread_id = OLD.thread_id
    )
    WHERE id = OLD.thread_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update message count
DROP TRIGGER IF EXISTS trigger_update_contact_thread_message_count ON contact_messages;

CREATE TRIGGER trigger_update_contact_thread_message_count
  AFTER INSERT OR DELETE ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_thread_message_count();

-- ============================================================================
-- Step 7: Enable Row Level Security
-- ============================================================================

ALTER TABLE contact_threads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 8: RLS Policies
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own threads" ON contact_threads;
DROP POLICY IF EXISTS "Users can create threads" ON contact_threads;
DROP POLICY IF EXISTS "Users can update their own threads" ON contact_threads;
DROP POLICY IF EXISTS "Users can delete their own threads" ON contact_threads;

-- Users can view their own threads
CREATE POLICY "Users can view their own threads"
  ON contact_threads
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own threads
CREATE POLICY "Users can create threads"
  ON contact_threads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own threads
CREATE POLICY "Users can update their own threads"
  ON contact_threads
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete (close/archive) their own threads
CREATE POLICY "Users can delete their own threads"
  ON contact_threads
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Step 9: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON contact_threads TO authenticated;

-- Note: No sequence grant needed since we're using gen_random_uuid() for UUID primary keys
-- Sequences are only created for SERIAL/BIGSERIAL columns

-- ============================================================================
-- Step 10: Add comments
-- ============================================================================

COMMENT ON TABLE contact_threads IS 'Message threads between users and representatives';
COMMENT ON COLUMN contact_threads.user_id IS 'User who created the thread';
COMMENT ON COLUMN contact_threads.representative_id IS 'Representative the thread is with';
COMMENT ON COLUMN contact_threads.subject IS 'Thread subject line';
COMMENT ON COLUMN contact_threads.status IS 'Thread status: active, closed, archived, or spam';
COMMENT ON COLUMN contact_threads.priority IS 'Thread priority: low, normal, high, or urgent';
COMMENT ON COLUMN contact_threads.message_count IS 'Denormalized count of messages in thread';
COMMENT ON COLUMN contact_threads.last_message_at IS 'Timestamp of the most recent message in the thread';
COMMENT ON COLUMN contact_messages.thread_id IS 'References the thread this message belongs to';

-- ============================================================================
-- Step 11: Migrate existing data (if any)
-- ============================================================================

-- If there are existing messages that should be grouped into threads,
-- this would need custom logic based on business rules.
-- For now, we'll leave existing messages without thread_id (NULL)
-- and they can be manually associated or new threads can be created.

-- Note: Any existing contact_threads junction table data will be lost.
-- If you have important data, export it before running this migration.

