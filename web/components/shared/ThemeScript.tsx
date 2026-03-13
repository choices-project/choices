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

    try {
      // Read app state from localStorage (same key as Zustand persist)
      const stored = localStorage.getItem('app-store');
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
      }
    } catch (e) {
      // If localStorage read fails, use defaults (matches server)
      // Values already set above
    }

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
    }
  } catch (e) {
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

