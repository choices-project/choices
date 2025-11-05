-- ============================================================================
-- CRITICAL MISSING TABLES FOR CHOICES PLATFORM
-- Run this in Supabase SQL Editor to create all missing tables
-- ============================================================================

-- USER_FOLLOWED_REPRESENTATIVES - Track user follows
CREATE TABLE IF NOT EXISTS public.user_followed_representatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  representative_id integer NOT NULL,
  notify_on_votes boolean DEFAULT true,
  notify_on_committee_activity boolean DEFAULT false,
  notify_on_public_statements boolean DEFAULT false,
  notify_on_events boolean DEFAULT false,
  notes text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, representative_id)
);

CREATE INDEX idx_user_followed_reps_user ON public.user_followed_representatives(user_id);
CREATE INDEX idx_user_followed_reps_rep ON public.user_followed_representatives(representative_id);

-- NOTIFICATIONS - User notifications (alternative to notification_log)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL,
  priority text DEFAULT 'normal',
  action_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- ONBOARDING_PROGRESS - Track user onboarding
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  current_step integer DEFAULT 0,
  completed_steps integer[] DEFAULT '{}',
  data jsonb DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_onboarding_progress_user ON public.onboarding_progress(user_id);

-- USER_PRIVACY_PREFERENCES - Privacy settings
CREATE TABLE IF NOT EXISTS public.user_privacy_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  profile_visibility text DEFAULT 'public',
  show_email boolean DEFAULT false,
  show_activity boolean DEFAULT true,
  allow_messages boolean DEFAULT true,
  share_demographics boolean DEFAULT false,
  allow_analytics boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_user_privacy_user ON public.user_privacy_preferences(user_id);

-- IDEMPOTENCY_KEYS - Prevent duplicate operations
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  request_hash text NOT NULL,
  response jsonb,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX idx_idempotency_keys_key ON public.idempotency_keys(key);
CREATE INDEX idx_idempotency_keys_expires ON public.idempotency_keys(expires_at);


-- ============================================================================
-- APPLY TABLES NOTICE
-- ============================================================================
-- After running this SQL in Supabase SQL Editor:
-- 1. Run: cd web && npm run types:generate
-- 2. Verify TypeScript errors reduce significantly
-- 3. The following tables will be added to your schema
-- ============================================================================

SELECT 'Tables created successfully!' as status;
