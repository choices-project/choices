-- Add failed_attempts column to candidate_email_challenges table
-- This tracks how many times a user has entered an incorrect code
-- Used for rate limiting and security

alter table public.candidate_email_challenges
add column if not exists failed_attempts integer not null default 0;

-- Add comment for documentation
comment on column public.candidate_email_challenges.failed_attempts is 
  'Number of failed verification attempts for this code. Maximum 5 attempts allowed before code is locked.';

