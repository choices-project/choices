-- SQL to create all critical missing tables
-- Run this directly in Supabase SQL Editor

-- ============================================================================
-- USER_FOLLOWED_REPRESENTATIVES
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS idx_user_followed_reps_user ON public.user_followed_representatives(user_id);
CREATE INDEX IF NOT EXISTS idx_user_followed_reps_rep ON public.user_followed_representatives(representative_id);

-- ============================================================================
-- NOTIFICATIONS (if not using notification_log)
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read);

