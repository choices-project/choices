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

import { getSupabaseBrowserClient } from '@/utils/supabase/client';

import { EnhancedAnalyticsDashboard } from '@/features/analytics';
import { WidgetDashboard } from '@/features/analytics/components/widgets/WidgetDashboard';

import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { Button } from '@/components/ui/button';

import { useUser, useUserLoading } from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';
import { useProfileActions, useProfileStats } from '@/lib/stores/profileStore';
import { logger } from '@/lib/utils/logger';


type DashboardMode = 'classic' | 'widget';

export default function AnalyticsPage() {
  const user = useUser();
  const isUserLoading = useUserLoading();
  const { isProfileLoaded } = useProfileStats();
  const { loadProfile } = useProfileActions();
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
    let isMounted = true; // Track if component is still mounted

    const loadPreferences = async () => {
      if (!user?.id) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const supabase = await getSupabaseBrowserClient();
        const { data: profile, error } = await (supabase as any)
          .from('user_profiles')
          .select('analytics_dashboard_mode')
          .eq('user_id', user.id)
          .single();

        // Only update state if component is still mounted
        if (isMounted) {
          if (!error && profile?.analytics_dashboard_mode) {
            setMode(profile.analytics_dashboard_mode as DashboardMode);
          }
          setIsLoading(false);
        }
      } catch (error) {
        logger.error('Error loading user preferences', { error });
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (!isUserLoading) {
      void loadPreferences();
    }

    // Cleanup: mark component as unmounted
    return () => {
      isMounted = false;
    };
  }, [isUserLoading, user]);

  useEffect(() => {
    if (user?.id && !isProfileLoaded) {
      void loadProfile();
    }
  }, [user?.id, isProfileLoaded, loadProfile]);

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

  if (isUserLoading || isLoading || (user?.id && !isProfileLoaded)) {
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
        <ErrorBoundary
          fallback={
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Analytics Dashboard Error</h3>
              <p className="text-red-600 dark:text-red-400 mt-2">
                An error occurred while loading the analytics dashboard. Please try refreshing the page.
              </p>
            </div>
          }
        >
          <EnhancedAnalyticsDashboard enableRealTime enableNewSchema skipAccessGuard />
        </ErrorBoundary>
      ) : (
        user?.id && (
          <ErrorBoundary
            fallback={
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Widget Dashboard Error</h3>
                <p className="text-red-600 dark:text-red-400 mt-2">
                  An error occurred while loading the widget dashboard. Please try refreshing the page.
                </p>
              </div>
            }
          >
            <WidgetDashboard userId={user.id} isAdmin={true} />
          </ErrorBoundary>
        )
      )}
    </div>
  );
}
