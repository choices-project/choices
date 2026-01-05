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

  // CRITICAL: Use stable defaults that match server render
  // During SSR, document is undefined, so we use defaults
  // On client, ThemeScript should set attributes before React hydrates
  // But we use defaults here to ensure server and client initial render match
  const [isMounted, setIsMounted] = useState(false);

  // Always use defaults for initial state to match server render
  // ThemeScript sets attributes on documentElement, but we don't read them here
  // to ensure server and client HTML match from the start
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(280);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    // #region agent log
    const logData8={location:'AppShell.tsx:50',message:'AppShell useEffect mount started',data:{hasDocument:typeof document!=='undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
    console.log('[DEBUG]',JSON.stringify(logData8));
    fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData8)}).catch(()=>{});
    // #endregion
    setIsMounted(true);
    // After mount, read from script-set attributes (ThemeScript should have set them)
    // This ensures we use the actual persisted values, not defaults
    if (typeof document !== 'undefined') {
      const scriptTheme = document.documentElement.getAttribute('data-theme');
      const scriptCollapsed = document.documentElement.getAttribute('data-sidebar-collapsed');
      const scriptWidth = document.documentElement.getAttribute('data-sidebar-width');
      const scriptPinned = document.documentElement.getAttribute('data-sidebar-pinned');
      // #region agent log
      const logData9={location:'AppShell.tsx:58',message:'AppShell read script attributes',data:{scriptTheme,scriptCollapsed,scriptWidth,scriptPinned,storeTheme:resolvedTheme,storeCollapsed:sidebarCollapsed,storeWidth:sidebarWidth,storePinned:sidebarPinned},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
      console.log('[DEBUG]',JSON.stringify(logData9));
      fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData9)}).catch(()=>{});
      // #endregion

      if (scriptTheme) setTheme(scriptTheme === 'dark' ? 'dark' : 'light');
      if (scriptCollapsed) setCollapsed(scriptCollapsed === 'true');
      if (scriptWidth) setWidth(Number.parseInt(scriptWidth, 10));
      if (scriptPinned) setPinned(scriptPinned === 'true');
    }

    // Also sync with store (for future updates)
    setTheme(resolvedTheme);
    setCollapsed(sidebarCollapsed);
    setWidth(sidebarWidth);
    setPinned(sidebarPinned);
    // #region agent log
    const logData10={location:'AppShell.tsx:71',message:'AppShell state set',data:{finalTheme:resolvedTheme,finalCollapsed:sidebarCollapsed,finalWidth:sidebarWidth,finalPinned:sidebarPinned},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
    console.log('[DEBUG]',JSON.stringify(logData10));
    fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData10)}).catch(()=>{});
    // #endregion
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
    // #region agent log
    const beforeAttrs={theme:document.documentElement.getAttribute('data-theme'),collapsed:document.documentElement.getAttribute('data-sidebar-collapsed')};
    const logData11={location:'AppShell.tsx:92',message:'AppShell setting documentElement attributes',data:{beforeAttrs,settingTheme:theme,isMounted},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
    console.log('[DEBUG]',JSON.stringify(logData11));
    fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData11)}).catch(()=>{});
    // #endregion

    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // #region agent log
    const afterAttrs={theme:document.documentElement.getAttribute('data-theme'),collapsed:document.documentElement.getAttribute('data-sidebar-collapsed')};
    const logData12={location:'AppShell.tsx:103',message:'AppShell after setting attributes',data:{afterAttrs},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
    console.log('[DEBUG]',JSON.stringify(logData12));
    fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData12)}).catch(()=>{});
    // #endregion
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

  // CRITICAL: Always use stable defaults for data attributes to prevent hydration mismatch
  // Don't use suppressHydrationWarning - ensure server and client initial render match exactly
  // ThemeScript sets attributes on documentElement, but we use stable defaults here
  // to ensure the initial HTML matches between server and client
  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-gray-900"
      data-testid="app-shell"
      data-theme="light"
      data-sidebar-collapsed="false"
      data-sidebar-width="280"
      data-sidebar-pinned="false"
    >
      <header>{navigation}</header>

      {/* Always render container to maintain consistent DOM structure */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {siteMessages}
      </div>

      <main id="main-content" className="min-h-[60vh]">
        {children}
      </main>

      {/* Always render footer container to maintain consistent DOM structure */}
      <footer className="mt-8">
        {feedback}
      </footer>
    </div>
  );
}


