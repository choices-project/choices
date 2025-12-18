'use client';

import { useEffect, useRef } from 'react';

import {
  appStoreUtils,
  useAppTheme,
  useSidebarCollapsed,
  useSidebarPinned,
  useSidebarWidth,
} from '@/lib/stores/appStore';
import { useDeviceStore } from '@/lib/stores/deviceStore';

import { useSystemThemeSync } from '@/hooks/useSystemThemeSync';

import type { ReactNode } from 'react';

type AppShellProps = {
  navigation: ReactNode;
  siteMessages?: ReactNode;
  feedback?: ReactNode;
  children: ReactNode;
};

/**
 * Layout shell that bridges the app store with global navigation chrome.
 * Applies persisted theme + sidebar state data attributes so navigation
 * surfaces can rely on the modernized selectors without direct store access.
 */
export function AppShell({ navigation, siteMessages, feedback, children }: AppShellProps) {
  const theme = useAppTheme();
  const sidebarCollapsed = useSidebarCollapsed();
  const sidebarWidth = useSidebarWidth();
  const sidebarPinned = useSidebarPinned();
  // Get initialize directly from store for stable reference
  const initializeDevice = useDeviceStore((state) => state.initialize);
  const initRef = useRef(false);

  // Initialize app store
  useEffect(() => {
    appStoreUtils.initialize();
  }, []);

  // Initialize device store once
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    initializeDevice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run once

  // Sync system theme preference
  useSystemThemeSync();

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div
      className="min-h-screen bg-slate-50"
      data-testid="app-shell"
      data-theme={theme}
      data-sidebar-collapsed={String(sidebarCollapsed)}
      data-sidebar-width={String(sidebarWidth)}
      data-sidebar-pinned={String(sidebarPinned)}
    >
      <header>{navigation}</header>

      {siteMessages ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">{siteMessages}</div>
      ) : null}

      <main id="main-content" className="min-h-[60vh]">
        {children}
      </main>

      {feedback ? <footer className="mt-8">{feedback}</footer> : null}
    </div>
  );
}


