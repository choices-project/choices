'use client';

import { useEffect, useRef, useState } from 'react';

import {
  appStoreUtils,
  useResolvedTheme,
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
  const resolvedTheme = useResolvedTheme();
  const sidebarCollapsed = useSidebarCollapsed();
  const sidebarWidth = useSidebarWidth();
  const sidebarPinned = useSidebarPinned();
  
  // CRITICAL: Read initial values from ThemeScript-set attributes to prevent hydration mismatch
  // ThemeScript runs before React hydrates and sets data attributes on documentElement
  // This ensures server and client HTML match from the start
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document === 'undefined') return 'light';
    const scriptTheme = document.documentElement.getAttribute('data-theme');
    return (scriptTheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  });
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof document === 'undefined') return false;
    const scriptCollapsed = document.documentElement.getAttribute('data-sidebar-collapsed');
    return scriptCollapsed === 'true';
  });
  const [width, setWidth] = useState(() => {
    if (typeof document === 'undefined') return 280;
    const scriptWidth = document.documentElement.getAttribute('data-sidebar-width');
    return scriptWidth ? Number.parseInt(scriptWidth, 10) : 280;
  });
  const [pinned, setPinned] = useState(() => {
    if (typeof document === 'undefined') return false;
    const scriptPinned = document.documentElement.getAttribute('data-sidebar-pinned');
    return scriptPinned === 'true';
  });
  
  useEffect(() => {
    setIsMounted(true);
    // After mount, sync with store (which may have updated)
    setTheme(resolvedTheme);
    setCollapsed(sidebarCollapsed);
    setWidth(sidebarWidth);
    setPinned(sidebarPinned);
  }, [resolvedTheme, sidebarCollapsed, sidebarWidth, sidebarPinned]);
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
    if (typeof document === 'undefined' || !isMounted) {
      return;
    }

    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, isMounted]);

  // DIAGNOSTIC: Log when AppShell renders
  useEffect(() => {
    if (process.env.DEBUG_DASHBOARD === '1' || (typeof window !== 'undefined' && window.localStorage.getItem('e2e-dashboard-bypass') === '1')) {
      console.warn('[DIAGNOSTIC] AppShell: Rendering', {
        theme,
        sidebarCollapsed: collapsed,
        sidebarWidth: width,
        sidebarPinned: pinned,
        hasNavigation: !!navigation,
        hasSiteMessages: !!siteMessages,
        hasFeedback: !!feedback,
        hasChildren: !!children,
        currentUrl: typeof window !== 'undefined' ? window.location.href : 'SSR',
        bypassFlag: typeof window !== 'undefined' ? window.localStorage.getItem('e2e-dashboard-bypass') : 'SSR',
      });
    }
  }, [theme, collapsed, width, pinned, navigation, siteMessages, feedback, children]);

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-gray-900"
      data-testid="app-shell"
      data-theme={theme}
      data-sidebar-collapsed={String(collapsed)}
      data-sidebar-width={String(width)}
      data-sidebar-pinned={String(pinned)}
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


