-- Remove test user script
-- This script removes the test user and all associated data

-- First, let's see what we're working with
SELECT 
    id,
    email,
    created_at,
    updated_at
FROM auth.users 
WHERE email = 'michaeltempesta@gmail.com';

-- Remove user's votes
DELETE FROM public.votes 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'michaeltempesta@gmail.com'
);

-- Remove user's polls
DELETE FROM public.polls 
WHERE created_by IN (
    SELECT id FROM auth.users WHERE email = 'michaeltempesta@gmail.com'
);

-- Remove user's feedback
DELETE FROM public.feedback 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'michaeltempesta@gmail.com'
);

-- Remove user's analytics data
DELETE FROM public.user_analytics 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'michaeltempesta@gmail.com'
);

-- Remove user's demographics
DELETE FROM public.user_demographics 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'michaeltempesta@gmail.com'
);

-- Remove user's privacy settings
DELETE FROM public.user_privacy_settings 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'michaeltempesta@gmail.com'
);

-- Remove user's biometric credentials
DELETE FROM public.biometric_credentials 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'michaeltempesta@gmail.com'
);

-- Remove user's webauthn credentials
DELETE FROM public.webauthn_credentials 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'michaeltempesta@gmail.com'
);

-- Finally, remove the user from auth.users
DELETE FROM auth.users 
WHERE email = 'michaeltempesta@gmail.com';

-- Verify the user is gone
SELECT 
    id,
    email,
    created_at,
    updated_at
FROM auth.users 
WHERE email = 'michaeltempesta@gmail.com';

-- Show remaining users (if any)
SELECT 
    id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

