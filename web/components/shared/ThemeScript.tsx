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
  fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
  // #endregion
  try {
    // CRITICAL: Always set attributes, even if localStorage is empty
    // This ensures server and client HTML match from the start
    let theme = 'light';
    let sidebarCollapsed = false;
    let sidebarWidth = 280;
    let sidebarPinned = false;

    // #region agent log
    const beforeLocalStorage=Date.now();
    const logData1={location:'ThemeScript.tsx:33',message:'Before localStorage read',data:{hasLocalStorage:typeof localStorage!=='undefined',defaultTheme:theme,defaultCollapsed:sidebarCollapsed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
    console.log('[DEBUG]',JSON.stringify(logData1));
    fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData1)}).catch(()=>{});
    // #endregion

    try {
      // Read app state from localStorage (same key as Zustand persist)
      const stored = localStorage.getItem('app-store');
      // #region agent log
      const logData2={location:'ThemeScript.tsx:38',message:'localStorage read result',data:{hasStored:!!stored,storedLength:stored?stored.length:0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
      console.log('[DEBUG]',JSON.stringify(logData2));
      fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData2)}).catch(()=>{});
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
        fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData3)}).catch(()=>{});
        // #endregion
      }
    } catch (e) {
      // #region agent log
      const logData4={location:'ThemeScript.tsx:52',message:'localStorage read error',data:{error:e?.message||String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'};
      console.log('[DEBUG]',JSON.stringify(logData4));
      fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData4)}).catch(()=>{});
      // #endregion
      // If localStorage read fails, use defaults (matches server)
      // Values already set above
    }

    // #region agent log
    const beforeSetAttrs=Date.now();
    const beforeAttrs={theme:document.documentElement.getAttribute('data-theme'),collapsed:document.documentElement.getAttribute('data-sidebar-collapsed'),width:document.documentElement.getAttribute('data-sidebar-width'),pinned:document.documentElement.getAttribute('data-sidebar-pinned')};
    const logData5={location:'ThemeScript.tsx:58',message:'Before setting attributes',data:{beforeAttrs,valuesToSet:{theme,sidebarCollapsed,sidebarWidth,sidebarPinned}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
    console.log('[DEBUG]',JSON.stringify(logData5));
    fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData5)}).catch(()=>{});
    // #endregion

    // ALWAYS set attributes (ensures consistency)
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

    // #region agent log
    const afterAttrs={theme:document.documentElement.getAttribute('data-theme'),collapsed:document.documentElement.getAttribute('data-sidebar-collapsed'),width:document.documentElement.getAttribute('data-sidebar-width'),pinned:document.documentElement.getAttribute('data-sidebar-pinned')};
    const logData6={location:'ThemeScript.tsx:73',message:'After setting attributes',data:{afterAttrs,timeSinceStart:Date.now()-beforeSetAttrs},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
    console.log('[DEBUG]',JSON.stringify(logData6));
    fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData6)}).catch(()=>{});
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
    fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData7)}).catch(()=>{});
    // #endregion
    // Silently fail - defaults will be used
  }
})();
`;

  return (
    <Script
      id="theme-script"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: scriptContent }}
    />
  );
}

