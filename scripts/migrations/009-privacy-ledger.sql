-- Migration: 009-privacy-ledger.sql
-- Purpose: Add privacy ledger table for differential privacy tracking
-- Created: 2025-08-27
-- Status: Critical privacy-first feature implementation

-- Create privacy_ledger table for tracking differential privacy usage
CREATE TABLE IF NOT EXISTS public.privacy_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    epsilon_used DECIMAL(10,6) NOT NULL CHECK (epsilon_used >= 0),
    query_type TEXT NOT NULL CHECK (query_type IN ('count', 'aggregate', 'histogram', 'custom')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT NOT NULL,
    noise_added DECIMAL(10,6) DEFAULT 0 CHECK (noise_added >= 0),
    k_anonymity_satisfied BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_privacy_ledger_user_id ON public.privacy_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_ledger_poll_id ON public.privacy_ledger(poll_id);
CREATE INDEX IF NOT EXISTS idx_privacy_ledger_timestamp ON public.privacy_ledger(timestamp);
CREATE INDEX IF NOT EXISTS idx_privacy_ledger_query_type ON public.privacy_ledger(query_type);
CREATE INDEX IF NOT EXISTS idx_privacy_ledger_user_timestamp ON public.privacy_ledger(user_id, timestamp);

-- Create composite index for privacy budget queries
CREATE INDEX IF NOT EXISTS idx_privacy_ledger_budget ON public.privacy_ledger(user_id, timestamp, epsilon_used);

-- Add RLS policies for privacy_ledger
ALTER TABLE public.privacy_ledger ENABLE ROW LEVEL SECURITY;

-- Users can only see their own privacy ledger entries
CREATE POLICY "Users can view own privacy ledger" ON public.privacy_ledger
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own privacy ledger entries
CREATE POLICY "Users can insert own privacy ledger" ON public.privacy_ledger
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own privacy ledger entries
CREATE POLICY "Users can update own privacy ledger" ON public.privacy_ledger
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all privacy ledger entries
CREATE POLICY "Admins can view all privacy ledger" ON public.privacy_ledger
    FOR SELECT USING (public.is_admin());

-- Create function to get user's privacy budget
CREATE OR REPLACE FUNCTION public.get_user_privacy_budget(
    user_uuid UUID,
    hours_back INTEGER DEFAULT 24
)
RETURNS DECIMAL(10,6) AS $$
DECLARE
    total_epsilon DECIMAL(10,6);
    max_epsilon DECIMAL(10,6) := 10.0; -- Maximum epsilon per user per day
BEGIN
    SELECT COALESCE(SUM(epsilon_used), 0)
    INTO total_epsilon
    FROM public.privacy_ledger
    WHERE user_id = user_uuid
    AND timestamp >= NOW() - INTERVAL '1 hour' * hours_back;
    
    RETURN GREATEST(0, max_epsilon - total_epsilon);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has sufficient privacy budget
CREATE OR REPLACE FUNCTION public.check_privacy_budget(
    user_uuid UUID,
    required_epsilon DECIMAL(10,6),
    hours_back INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_privacy_budget(user_uuid, hours_back) >= required_epsilon;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get privacy statistics
CREATE OR REPLACE FUNCTION public.get_privacy_stats()
RETURNS TABLE(
    total_queries BIGINT,
    total_epsilon_used DECIMAL(10,6),
    average_noise_added DECIMAL(10,6),
    k_anonymity_satisfied_rate DECIMAL(5,4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_queries,
        COALESCE(SUM(epsilon_used), 0) as total_epsilon_used,
        COALESCE(AVG(noise_added), 0) as average_noise_added,
        COALESCE(
            COUNT(*) FILTER (WHERE k_anonymity_satisfied)::DECIMAL / COUNT(*), 
            0
        ) as k_anonymity_satisfied_rate
    FROM public.privacy_ledger;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean old privacy ledger entries
CREATE OR REPLACE FUNCTION public.cleanup_old_privacy_ledger(
    days_to_keep INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.privacy_ledger
    WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for privacy budget monitoring
CREATE OR REPLACE VIEW public.privacy_budget_monitoring AS
SELECT 
    up.user_id,
    up.username,
    COALESCE(SUM(pl.epsilon_used), 0) as total_epsilon_used,
    public.get_user_privacy_budget(up.user_id) as remaining_budget,
    COUNT(pl.id) as total_queries,
    MAX(pl.timestamp) as last_query_time
FROM public.user_profiles up
LEFT JOIN public.privacy_ledger pl ON up.user_id = pl.user_id
    AND pl.timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY up.user_id, up.username;

-- Grant necessary permissions
GRANT SELECT ON public.privacy_ledger TO authenticated;
GRANT INSERT ON public.privacy_ledger TO authenticated;
GRANT UPDATE ON public.privacy_ledger TO authenticated;
GRANT SELECT ON public.privacy_budget_monitoring TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_privacy_budget(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_privacy_budget(UUID, DECIMAL, INTEGER) TO authenticated;

-- Grant admin permissions
GRANT SELECT ON public.privacy_ledger TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_privacy_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_privacy_ledger(INTEGER) TO authenticated;
GRANT SELECT ON public.privacy_budget_monitoring TO authenticated;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_privacy_ledger_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_privacy_ledger_updated_at
    BEFORE UPDATE ON public.privacy_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.update_privacy_ledger_updated_at();

-- Insert initial privacy configuration
INSERT INTO public.system_configuration (key, value, description, created_at)
VALUES 
    ('privacy.epsilon', '1.0', 'Default epsilon value for differential privacy', NOW()),
    ('privacy.delta', '0.00001', 'Default delta value for differential privacy', NOW()),
    ('privacy.k_anonymity', '20', 'Minimum participants for result disclosure', NOW()),
    ('privacy.max_epsilon_per_user', '10.0', 'Maximum epsilon per user per day', NOW()),
    ('privacy.budget_reset_hours', '24', 'Hours until privacy budget resets', NOW())
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- Log the privacy enhancement
INSERT INTO public.audit_logs (
    action, table_name, user_id, details, ip_address, user_agent, created_at
) VALUES (
    'PRIVACY_ENHANCEMENT', 'privacy_ledger', NULL,
    'Added comprehensive differential privacy tracking with epsilon budget management and k-anonymity thresholds',
    'SYSTEM', 'MIGRATION_SCRIPT', NOW()
);
