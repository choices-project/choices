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

import { Layout, Grid } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { EnhancedAnalyticsDashboard } from '@/features/analytics';
import { WidgetDashboard } from '@/features/analytics/components/widgets/WidgetDashboard';
import { useUser, useUserLoading } from '@/lib/stores';
import { logger } from '@/lib/utils/logger';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';
import { useAppActions } from '@/lib/stores/appStore';

type DashboardMode = 'classic' | 'widget';

export default function AnalyticsPage() {
  const user = useUser();
  const isUserLoading = useUserLoading();
  const [mode, setMode] = useState<DashboardMode>('classic');
  const [isLoading, setIsLoading] = useState(true);
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();

  useEffect(() => {
    setCurrentRoute('/admin/analytics');
    setSidebarActiveSection('admin-analytics');
    setBreadcrumbs([
      { label: 'Admin', href: '/admin' },
      { label: 'Analytics', href: '/admin/analytics' },
    ]);

    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const supabase = await getSupabaseBrowserClient();
        const { data: profile, error } = await (supabase as any)
          .from('user_profiles')
          .select('analytics_dashboard_mode')
          .eq('user_id', user.id)
          .single();

        if (!error && profile?.analytics_dashboard_mode) {
          setMode(profile.analytics_dashboard_mode as DashboardMode);
        }
      } catch (error) {
        logger.error('Error loading user preferences', { error });
      } finally {
        setIsLoading(false);
      }
    };

    if (!isUserLoading) {
      void loadPreferences();
    }
  }, [isUserLoading, user]);

  const handleModeChange = async (newMode: DashboardMode) => {
    setMode(newMode);

    if (!user?.id) return;

    try {
      const supabase = await getSupabaseBrowserClient();
      await (supabase as any)
        .from('user_profiles')
        .update({
          analytics_dashboard_mode: newMode,
        })
        .eq('user_id', user.id);
      
      logger.info('Dashboard mode preference saved', { mode: newMode, userId: user.id });
    } catch (error) {
      logger.error('Failed to save mode preference', { error, userId: user.id });
    }
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
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
        user?.id && <WidgetDashboard userId={user.id} isAdmin />
      )}
    </div>
  );
}
