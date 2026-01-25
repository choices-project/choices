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

import { useAppActions } from '@/lib/stores/appStore';
import { useDarkMode } from '@/lib/stores/deviceStore';

/**
 * Hook that syncs system dark mode preference to app store.
 * Updates appStore's systemTheme when deviceStore detects a change.
 * Also handles initial detection if deviceStore hasn't initialized yet.
 */
export function useSystemThemeSync() {
  const systemPrefersDark = useDarkMode();
  const { updateSystemTheme } = useAppActions();
  const hasInitialized = useRef(false);

  // Initial system theme detection and sync - run once
  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const initialSystemPrefersDark = darkModeQuery.matches;
        const systemTheme = initialSystemPrefersDark ? 'dark' : 'light';
        updateSystemTheme(systemTheme);
      } catch {
        // Ignore theme detection errors
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Sync when deviceStore's darkMode capability changes
  const prevDarkModeRef = useRef(systemPrefersDark);
  useEffect(() => {
    // Only update if value actually changed
    if (typeof systemPrefersDark === 'boolean' && systemPrefersDark !== prevDarkModeRef.current) {
      prevDarkModeRef.current = systemPrefersDark;
      const systemTheme = systemPrefersDark ? 'dark' : 'light';
      updateSystemTheme(systemTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemPrefersDark]); // Only depend on the value, not the function
}

