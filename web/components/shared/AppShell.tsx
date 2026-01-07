'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

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
  const attributesSetRef = useRef(false);

  // Always use defaults for initial state to match server render
  // ThemeScript sets attributes on documentElement, but we don't read them here
  // to ensure server and client HTML match from the start
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(280);
  const [pinned, setPinned] = useState(false);

  // CRITICAL: Set attributes in useLayoutEffect to ensure they exist before React paints
  // This runs synchronously after render but before browser paints
  // We use a ref to ensure this only runs once per component instance
  useLayoutEffect(() => {
    if (typeof document === 'undefined' || attributesSetRef.current) {
      return;
    }
    
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const currentCollapsed = document.documentElement.getAttribute('data-sidebar-collapsed');
    const currentWidth = document.documentElement.getAttribute('data-sidebar-width');
    const currentPinned = document.documentElement.getAttribute('data-sidebar-pinned');
    
    // Always ensure attributes exist - even if ThemeScript set them, we ensure they're present
    // This is critical for client-side navigation where ThemeScript doesn't run
    const themeToSet = currentTheme || 'light';
    const collapsedToSet = currentCollapsed !== null ? currentCollapsed : 'false';
    const widthToSet = currentWidth || '280';
    const pinnedToSet = currentPinned !== null ? currentPinned : 'false';
    
    document.documentElement.setAttribute('data-theme', themeToSet);
    document.documentElement.setAttribute('data-sidebar-collapsed', collapsedToSet);
    document.documentElement.setAttribute('data-sidebar-width', widthToSet);
    document.documentElement.setAttribute('data-sidebar-pinned', pinnedToSet);
    
    if (themeToSet === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    
    // Force synchronous reflow to ensure attributes are committed
    void document.documentElement.offsetHeight;
    attributesSetRef.current = true;
    
    // #region agent log
    const logDataSync={location:'AppShell.tsx:useLayoutEffect-init',message:'AppShell ensured attributes exist in useLayoutEffect',data:{wasMissing:{theme:!currentTheme,collapsed:!currentCollapsed,width:!currentWidth,pinned:!currentPinned},set:{theme:themeToSet,collapsed:collapsedToSet,width:widthToSet,pinned:pinnedToSet}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H9'};
    console.log('[DEBUG]',JSON.stringify(logDataSync));
    // #endregion
  }, []);

  useEffect(() => {
    // #region agent log - Track AppShell mount timing
    const appShellMountTime = Date.now();
    const htmlAttrsAtMount={theme:typeof document!=='undefined'?document.documentElement.getAttribute('data-theme'):null,collapsed:typeof document!=='undefined'?document.documentElement.getAttribute('data-sidebar-collapsed'):null,width:typeof document!=='undefined'?document.documentElement.getAttribute('data-sidebar-width'):null,pinned:typeof document!=='undefined'?document.documentElement.getAttribute('data-sidebar-pinned'):null};
    const logData8={location:'AppShell.tsx:50',message:'AppShell useEffect mount started',data:{hasDocument:typeof document!=='undefined',htmlAttrsAtMount,timestamp:appShellMountTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'};
    console.log('[DEBUG]',JSON.stringify(logData8));
    // #endregion
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

  // CRITICAL: Track if this is the initial hydration to prevent attribute changes during hydration
  // React hydration happens synchronously, and changing attributes during hydration causes error #185
  const isHydratingRef = useRef(true);
  const hydrationCompleteRef = useRef(false);

  // Mark hydration as complete after first paint
  useEffect(() => {
    // Use requestIdleCallback to ensure this runs after React has finished hydrating
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        isHydratingRef.current = false;
        hydrationCompleteRef.current = true;
      }, { timeout: 100 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        isHydratingRef.current = false;
        hydrationCompleteRef.current = true;
      }, 100);
    }
  }, []);

  // CRITICAL: Only update attributes AFTER hydration completes
  // During hydration, ThemeScript has already set the correct attributes
  // Changing them during hydration causes React error #185
  useLayoutEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    // CRITICAL: Don't update attributes during initial hydration
    // ThemeScript has already set them correctly, and changing them causes mismatch
    if (isHydratingRef.current && !hydrationCompleteRef.current) {
      // #region agent log
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : 'SSR';
      const currentAttrs={theme:document.documentElement.getAttribute('data-theme'),collapsed:document.documentElement.getAttribute('data-sidebar-collapsed'),width:document.documentElement.getAttribute('data-sidebar-width'),pinned:document.documentElement.getAttribute('data-sidebar-pinned')};
      const logDataSkip={location:'AppShell.tsx:useLayoutEffect-skip',message:'AppShell skipping attribute update during hydration',data:{currentAttrs,wouldSet:{theme,collapsed,width,pinned},currentPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H10'};
      console.log('[DEBUG]',JSON.stringify(logDataSkip));
      // #endregion
      return;
    }

    // #region agent log
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : 'SSR';
    const beforeAttrs={theme:document.documentElement.getAttribute('data-theme'),collapsed:document.documentElement.getAttribute('data-sidebar-collapsed'),width:document.documentElement.getAttribute('data-sidebar-width'),pinned:document.documentElement.getAttribute('data-sidebar-pinned')};
    const logData11={location:'AppShell.tsx:useLayoutEffect',message:'AppShell setting documentElement attributes AFTER hydration',data:{beforeAttrs,settingTheme:theme,settingCollapsed:collapsed,settingWidth:width,settingPinned:pinned,currentPath,hydrationComplete:hydrationCompleteRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H10'};
    console.log('[DEBUG]',JSON.stringify(logData11));
    // #endregion

    // Only update if values actually differ to prevent unnecessary DOM mutations
    const currentThemeAttr = document.documentElement.getAttribute('data-theme');
    if (currentThemeAttr !== theme) {
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    }

    const currentCollapsedAttr = document.documentElement.getAttribute('data-sidebar-collapsed');
    if (currentCollapsedAttr !== String(collapsed)) {
      document.documentElement.setAttribute('data-sidebar-collapsed', String(collapsed));
    }

    const currentWidthAttr = document.documentElement.getAttribute('data-sidebar-width');
    if (currentWidthAttr !== String(width)) {
      document.documentElement.setAttribute('data-sidebar-width', String(width));
    }

    const currentPinnedAttr = document.documentElement.getAttribute('data-sidebar-pinned');
    if (currentPinnedAttr !== String(pinned)) {
      document.documentElement.setAttribute('data-sidebar-pinned', String(pinned));
    }
    
    // #region agent log
    const currentPath2 = typeof window !== 'undefined' ? window.location.pathname : 'SSR';
    const afterAttrs={theme:document.documentElement.getAttribute('data-theme'),collapsed:document.documentElement.getAttribute('data-sidebar-collapsed'),width:document.documentElement.getAttribute('data-sidebar-width'),pinned:document.documentElement.getAttribute('data-sidebar-pinned')};
    const logData12={location:'AppShell.tsx:useLayoutEffect-after',message:'AppShell after setting attributes',data:{afterAttrs,currentPath:currentPath2},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H10'};
    console.log('[DEBUG]',JSON.stringify(logData12));
    // #endregion
  }, [theme, collapsed, width, pinned]);

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
  // 
  // HYPOTHESIS: The hardcoded data-* attributes on this div might be causing hydration mismatches
  // if React compares them during hydration. We should remove them and only use them for styling
  // via CSS selectors that read from documentElement, not from this div's attributes.
  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-gray-900"
      data-testid="app-shell"
    >
      <header>{navigation}</header>

      {/* Always render container to maintain consistent DOM structure */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {siteMessages}
      </div>

      {/* CRITICAL: Use div instead of main to prevent nested <main> tags */}
      {/* SkipNavTarget in root layout already provides <div id="main-content"> */}
      {/* Don't duplicate id="main-content" here - duplicate IDs are invalid HTML and cause hydration mismatch */}
      <div className="min-h-[60vh]">
        {children}
      </div>

      {/* Always render footer container to maintain consistent DOM structure */}
      <footer className="mt-8">
        {feedback}
      </footer>
    </div>
  );
}


