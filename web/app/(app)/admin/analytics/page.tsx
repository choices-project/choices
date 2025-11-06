/**
 * Analytics Page - ADMIN ONLY
 * 
 * Dual-mode analytics dashboard:
 * - Classic Mode: EnhancedAnalyticsDashboard (tabbed layout)
 * - Widget Mode: WidgetDashboard (customizable drag-drop)
 * 
 * Updated: November 6, 2025
 * - Added widget dashboard with full customization
 * - Toggle between modes
 * - Persists user preference
 * 
 * Access: Admin-only
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Layout, Grid } from 'lucide-react';
import { EnhancedAnalyticsDashboard } from '@/features/analytics';
import { WidgetDashboard } from '@/features/analytics/components/widgets/WidgetDashboard';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';
import { logger } from '@/lib/utils/logger';

type DashboardMode = 'classic' | 'widget';

export default function AnalyticsPage() {
  const [mode, setMode] = useState<DashboardMode>('classic');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = await getSupabaseBrowserClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          logger.error('Failed to get user for analytics', { error });
          setIsLoading(false);
          return;
        }

        setUserId(user.id);

        // Load user's preferred mode
        const { data: prefs } = await (supabase as any)
          .from('user_preferences')
          .select('analytics_dashboard_mode')
          .eq('user_id', user.id)
          .single();

        if (prefs?.analytics_dashboard_mode) {
          setMode(prefs.analytics_dashboard_mode as DashboardMode);
        }
        
        setIsLoading(false);
      } catch (error) {
        logger.error('Error loading user preferences', { error });
        setIsLoading(false);
      }
    };

    getUser();
  }, []);

  // Save mode preference
  const handleModeChange = async (newMode: DashboardMode) => {
    setMode(newMode);

    if (!userId) return;

    try {
      const supabase = await getSupabaseBrowserClient();
      await (supabase as any)
        .from('user_preferences')
        .upsert({
          user_id: userId,
          analytics_dashboard_mode: newMode,
        }, {
          onConflict: 'user_id',
        });
      
      logger.info('Dashboard mode preference saved', { mode: newMode, userId });
    } catch (error) {
      logger.error('Failed to save mode preference', { error, userId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            {mode === 'classic' ? 'Tabbed analytics dashboard' : 'Customizable widget dashboard'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={mode === 'classic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('classic')}
          >
            <Grid className="w-4 h-4 mr-2" />
            Classic
          </Button>
          <Button
            variant={mode === 'widget' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('widget')}
          >
            <Layout className="w-4 h-4 mr-2" />
            Widgets
          </Button>
        </div>
      </div>

      {/* Dashboard Renderer */}
      {mode === 'classic' ? (
        <EnhancedAnalyticsDashboard enableRealTime enableNewSchema />
      ) : (
        userId && <WidgetDashboard userId={userId} isAdmin />
      )}
    </div>
  );
}
