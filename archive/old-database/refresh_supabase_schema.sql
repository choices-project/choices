-- Refresh Supabase Schema Cache
-- This script helps refresh the PostgREST schema cache

-- Notify PostgREST to refresh its schema cache
NOTIFY pgrst, 'reload schema';

-- Alternative: You can also try restarting the PostgREST service
-- This is done through the Supabase dashboard

-- Verify the feedback table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'feedback' 
ORDER BY ordinal_position;

-- Test inserting a simple record to verify schema
INSERT INTO feedback (
    type, 
    title, 
    description, 
    sentiment, 
    user_journey
) VALUES (
    'test',
    'Schema Test',
    'Testing if schema cache is refreshed',
    'positive',
    '{"test": true}'::jsonb
) ON CONFLICT DO NOTHING;

-- Clean up test record
DELETE FROM feedback WHERE title = 'Schema Test';

-- Show success message
SELECT 'Schema cache refresh completed. Please wait 1-2 minutes for changes to take effect.' as message;
