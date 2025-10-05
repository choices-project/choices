-- Fix missing columns in representatives_core table
-- Run this in Supabase SQL Editor to add the missing columns

-- Add the missing columns that the code expects
ALTER TABLE representatives_core 
ADD COLUMN IF NOT EXISTS primary_email TEXT,
ADD COLUMN IF NOT EXISTS primary_phone TEXT,
ADD COLUMN IF NOT EXISTS primary_website TEXT,
ADD COLUMN IF NOT EXISTS primary_photo_url TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS last_verified TIMESTAMP WITH TIME ZONE;

-- Update existing records to have default values
UPDATE representatives_core 
SET verification_status = 'unverified' 
WHERE verification_status IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_representatives_core_verification_status 
ON representatives_core(verification_status);

CREATE INDEX IF NOT EXISTS idx_representatives_core_last_verified 
ON representatives_core(last_verified);

-- Verify the schema is now correct
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'representatives_core' 
AND table_schema = 'public'
ORDER BY ordinal_position;
