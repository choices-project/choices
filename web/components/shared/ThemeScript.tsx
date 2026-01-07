/**
 * Theme Script - Prevents hydration mismatch by setting theme and sidebar state before React hydrates
 *
 * This component uses Next.js Script with beforeInteractive strategy to inject a script
 * that executes immediately when the HTML is parsed, before React even starts hydrating.
 * It reads the theme and sidebar state from localStorage and applies them immediately,
 * ensuring the server-rendered HTML matches the client's initial render.
 *
 * CRITICAL: This is a Server Component that uses Next.js Script component.
 * The script runs synchronously during HTML parsing, before React hydrates.
 *
 * Why this is needed:
 * - Theme and sidebar state are persisted in localStorage
 * - Server renders with defaults, client reads from localStorage
 * - Without this script, React sees mismatched HTML → hydration error #185
 * - This script ensures server and client HTML match from the start
 */
import Script from 'next/script';

export function ThemeScript() {
  // CRITICAL: This script runs immediately when HTML is parsed, before React hydrates
  // It must be a Server Component (no 'use client') to use Script with beforeInteractive
  const scriptContent = `
(function() {
  // #region agent log
  const logData={location:'ThemeScript.tsx:24',message:'ThemeScript execution started',data:{timestamp:Date.now(),hasDocument:typeof document!=='undefined',hasDocumentElement:typeof document!=='undefined'&&!!document.documentElement},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
  console.log('[DEBUG]',JSON.stringify(logData));
  // #endregion
  try {
    // CRITICAL: Use defaults that match root layout
    // Root layout sets these defaults, so server and client HTML match initially
    // Only update if localStorage has different values (after React hydrates)
    let theme = 'light';
    let sidebarCollapsed = false;
    let sidebarWidth = 280;
    let sidebarPinned = false;
    
    // Check current attributes (set by root layout)
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const currentCollapsed = document.documentElement.getAttribute('data-sidebar-collapsed');
    const currentWidth = document.documentElement.getAttribute('data-sidebar-width');
    const currentPinned = document.documentElement.getAttribute('data-sidebar-pinned');
    
    // #region agent log - Track attribute state BEFORE any changes
    const logDataBefore={location:'ThemeScript.tsx:checkAttrs',message:'ThemeScript checking attributes BEFORE changes',data:{currentTheme,currentCollapsed,currentWidth,currentPinned,isNavigation:typeof window!=='undefined'&&window.performance&&window.performance.navigation?window.performance.navigation.type!==0:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'};
    console.log('[DEBUG]',JSON.stringify(logDataBefore));
    // #endregion

    // #region agent log
    const beforeLocalStorage=Date.now();
    const logData1={location:'ThemeScript.tsx:33',message:'Before localStorage read',data:{hasLocalStorage:typeof localStorage!=='undefined',defaultTheme:theme,defaultCollapsed:sidebarCollapsed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
    console.log('[DEBUG]',JSON.stringify(logData1));
    // #endregion

    try {
      // Read app state from localStorage (same key as Zustand persist)
      const stored = localStorage.getItem('app-store');
      // #region agent log
      const logData2={location:'ThemeScript.tsx:38',message:'localStorage read result',data:{hasStored:!!stored,storedLength:stored?stored.length:0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
      console.log('[DEBUG]',JSON.stringify(logData2));
      // #endregion
      if (stored) {
        const parsed = JSON.parse(stored);
        const state = parsed?.state || {};

        // Handle theme
        const themePreference = state.theme || 'system';
        const systemTheme = state.systemTheme || 'light';
        theme = themePreference === 'system' ? systemTheme : themePreference;

        // Handle sidebar state
        sidebarCollapsed = state.sidebarCollapsed || false;
        sidebarWidth = state.sidebarWidth || 280;
        sidebarPinned = state.sidebarPinned || false;
        // #region agent log
        const logData3={location:'ThemeScript.tsx:49',message:'After parsing localStorage',data:{theme,sidebarCollapsed,sidebarWidth,sidebarPinned},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
        console.log('[DEBUG]',JSON.stringify(logData3));
        // #endregion
      }
    } catch (e) {
      // #region agent log
      const logData4={location:'ThemeScript.tsx:52',message:'localStorage read error',data:{error:e?.message||String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'};
      console.log('[DEBUG]',JSON.stringify(logData4));
      // #endregion
      // If localStorage read fails, use defaults (matches server)
      // Values already set above
    }

    // #region agent log
    const beforeSetAttrs=Date.now();
    const beforeAttrs={theme:document.documentElement.getAttribute('data-theme'),collapsed:document.documentElement.getAttribute('data-sidebar-collapsed'),width:document.documentElement.getAttribute('data-sidebar-width'),pinned:document.documentElement.getAttribute('data-sidebar-pinned')};
    const logData5={location:'ThemeScript.tsx:58',message:'Before setting attributes',data:{beforeAttrs,valuesToSet:{theme,sidebarCollapsed,sidebarWidth,sidebarPinned}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
    console.log('[DEBUG]',JSON.stringify(logData5));
    // #endregion

    // CRITICAL: Always ensure attributes are set, even if they match defaults
    // On client-side navigation, ThemeScript doesn't run again, so attributes might be missing
    // We must set them synchronously to ensure React sees them during hydration
    // Only delay updates if values differ from what's already set
    const currentThemeValue = currentTheme ?? 'light';
    const currentCollapsedValue = currentCollapsed ?? 'false';
    const currentWidthValue = currentWidth ?? '280';
    const currentPinnedValue = currentPinned ?? 'false';
    
    const needsUpdate = 
      currentThemeValue !== theme ||
      currentCollapsedValue !== String(sidebarCollapsed) ||
      currentWidthValue !== String(sidebarWidth) ||
      currentPinnedValue !== String(sidebarPinned);
    
    // CRITICAL: Always set attributes synchronously BEFORE React hydrates
    // This prevents hydration mismatch by ensuring HTML matches localStorage from the start
    // ThemeScript runs with beforeInteractive, so it executes before React hydrates
    // We must set attributes immediately, not delay them, to prevent React error #185
    const attributesMissing = !currentTheme || !currentCollapsed || !currentWidth || !currentPinned;
    
    if (attributesMissing || needsUpdate) {
      // Attributes are missing OR need updating - set them immediately (synchronously)
      // This ensures React sees correct values during hydration, preventing mismatch
      // #region agent log - Track BEFORE setting
      const logDataBeforeSet={location:'ThemeScript.tsx:beforeSyncSet',message:'ThemeScript about to set attributes synchronously',data:{theme,sidebarCollapsed,sidebarWidth,sidebarPinned,currentTheme,currentCollapsed,currentWidth,currentPinned,attributesMissing,needsUpdate},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'};
      console.log('[DEBUG]',JSON.stringify(logDataBeforeSet));
      // #endregion
      
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.style.colorScheme = 'light';
      }
      document.documentElement.setAttribute('data-sidebar-collapsed', String(sidebarCollapsed));
      document.documentElement.setAttribute('data-sidebar-width', String(sidebarWidth));
      document.documentElement.setAttribute('data-sidebar-pinned', String(sidebarPinned));
      
      // Force synchronous reflow to ensure attributes are committed before React hydrates
      void document.documentElement.offsetHeight;
      
      // #region agent log - Track AFTER setting
      const afterAttrs={theme:document.documentElement.getAttribute('data-theme'),collapsed:document.documentElement.getAttribute('data-sidebar-collapsed'),width:document.documentElement.getAttribute('data-sidebar-width'),pinned:document.documentElement.getAttribute('data-sidebar-pinned')};
      const logDataSync={location:'ThemeScript.tsx:syncSet',message:'ThemeScript synchronously set attributes',data:{theme,sidebarCollapsed,sidebarWidth,sidebarPinned,wasMissing:attributesMissing,wasUpdated:needsUpdate,afterAttrs},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'};
      console.log('[DEBUG]',JSON.stringify(logDataSync));
      // #endregion
    } else {
      // #region agent log
      const logDataNoUpdate={location:'ThemeScript.tsx:noUpdate',message:'ThemeScript attributes match defaults, no update needed',data:{currentTheme,currentCollapsed,currentWidth,currentPinned,theme,sidebarCollapsed,sidebarWidth,sidebarPinned},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'};
      console.log('[DEBUG]',JSON.stringify(logDataNoUpdate));
      // #endregion
    }

    // #region agent log
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : 'SSR';
    const afterAttrs={theme:document.documentElement.getAttribute('data-theme'),collapsed:document.documentElement.getAttribute('data-sidebar-collapsed'),width:document.documentElement.getAttribute('data-sidebar-width'),pinned:document.documentElement.getAttribute('data-sidebar-pinned')};
    const logData6={location:'ThemeScript.tsx:115',message:'After setting attributes',data:{afterAttrs,timeSinceStart:Date.now()-beforeSetAttrs,currentPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
    console.log('[DEBUG]',JSON.stringify(logData6));
    // #endregion

    // Debug: Log that script executed (only in development or when explicitly enabled)
    if (window.location.hostname === 'localhost' || window.localStorage.getItem('debug-theme-script') === '1') {
      console.log('[ThemeScript] Executed', {
        theme: theme,
        sidebarCollapsed: sidebarCollapsed,
        sidebarWidth: sidebarWidth,
        sidebarPinned: sidebarPinned,
        attributesSet: {
          'data-theme': document.documentElement.getAttribute('data-theme'),
          'data-sidebar-collapsed': document.documentElement.getAttribute('data-sidebar-collapsed'),
          'data-sidebar-width': document.documentElement.getAttribute('data-sidebar-width'),
          'data-sidebar-pinned': document.documentElement.getAttribute('data-sidebar-pinned'),
        }
      });
    }
  } catch (e) {
    // #region agent log
    const logData7={location:'ThemeScript.tsx:87',message:'ThemeScript execution error',data:{error:e?.message||String(e),stack:e?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'};
    console.log('[DEBUG]',JSON.stringify(logData7));
    // #endregion
    // Silently fail - defaults will be used
  }
})();
`;

  // CRITICAL: Script with beforeInteractive executes immediately when HTML is parsed
  // This must execute before React hydrates to prevent hydration mismatches
  return (
    <Script
      id="theme-script"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: scriptContent }}
    />
  );
}

