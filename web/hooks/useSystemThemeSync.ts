/**
 * @fileoverview System Theme Sync Hook
 *
 * Syncs deviceStore's darkMode capability to appStore's systemTheme.
 * This ensures the app theme respects system preferences when set to 'system'.
 *
 * @author Choices Platform Team
 * @created 2025-01-XX
 */

'use client';

import { useEffect, useRef } from 'react';

import { useAppActions, useTheme } from '@/lib/stores/appStore';
import { useDarkMode } from '@/lib/stores/deviceStore';
import logger from '@/lib/utils/logger';

/**
 * Hook that syncs system dark mode preference to app store.
 * Updates appStore's systemTheme when deviceStore detects a change.
 * Also handles initial detection if deviceStore hasn't initialized yet.
 */
export function useSystemThemeSync() {
  const systemPrefersDark = useDarkMode();
  const currentTheme = useTheme();
  const { updateSystemTheme } = useAppActions();
  const hasInitialized = useRef(false);

  // Initial system theme detection (fallback if deviceStore hasn't initialized)
  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const initialSystemPrefersDark = darkModeQuery.matches;
        const systemTheme = initialSystemPrefersDark ? 'dark' : 'light';
        updateSystemTheme(systemTheme);
        hasInitialized.current = true;
        logger.debug('Initial system theme detected', { systemTheme, initialSystemPrefersDark });
      } catch (error) {
        logger.warn('Failed to detect initial system theme', error);
      }
    }
  }, [updateSystemTheme]);

  // Sync when deviceStore's darkMode capability changes
  useEffect(() => {
    if (typeof systemPrefersDark === 'boolean') {
      const systemTheme = systemPrefersDark ? 'dark' : 'light';
      updateSystemTheme(systemTheme);
      hasInitialized.current = true;
      logger.debug('System theme synced from deviceStore', { systemPrefersDark, systemTheme });
    }
  }, [systemPrefersDark, updateSystemTheme]);

  // Log when system preference changes
  useEffect(() => {
    if (currentTheme === 'system') {
      logger.debug('Theme is set to system, following system preference', {
        systemPrefersDark,
      });
    }
  }, [currentTheme, systemPrefersDark]);
}

