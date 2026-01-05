/**
 * Theme Script - Prevents hydration mismatch by setting theme and sidebar state before React hydrates
 *
 * This component injects a script tag that executes immediately when the component mounts.
 * It reads the theme and sidebar state from localStorage and applies them immediately,
 * ensuring the server-rendered HTML matches the client's initial render.
 *
 * CRITICAL: This is a Client Component that uses useEffect to inject the script synchronously.
 * The script runs immediately on mount, before React hydrates the rest of the tree.
 *
 * Why this is needed:
 * - Theme and sidebar state are persisted in localStorage
 * - Server renders with defaults, client reads from localStorage
 * - Without this script, React sees mismatched HTML → hydration error #185
 * - This script ensures server and client HTML match from the start
 */
'use client';

import React from 'react';

export function ThemeScript() {
  // CRITICAL: Run synchronously during render, not in useEffect
  // This ensures attributes are set before React hydrates the rest of the tree
  // We use a ref to ensure this only runs once
  const hasRunRef = React.useRef(false);
  
  if (typeof window !== 'undefined' && !hasRunRef.current) {
    hasRunRef.current = true;
    
    // CRITICAL: Always set attributes, even if localStorage is empty
    // This ensures server and client HTML match from the start
    let theme = 'light';
    let sidebarCollapsed = false;
    let sidebarWidth = 280;
    let sidebarPinned = false;

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

    // Debug: Log that script executed (only in development or when explicitly enabled)
    if (window.location.hostname === 'localhost' || window.localStorage.getItem('debug-theme-script') === '1') {
      console.log('[ThemeScript] Executed', {
        theme,
        sidebarCollapsed,
        sidebarWidth,
        sidebarPinned,
        attributesSet: {
          'data-theme': document.documentElement.getAttribute('data-theme'),
          'data-sidebar-collapsed': document.documentElement.getAttribute('data-sidebar-collapsed'),
          'data-sidebar-width': document.documentElement.getAttribute('data-sidebar-width'),
          'data-sidebar-pinned': document.documentElement.getAttribute('data-sidebar-pinned'),
        }
      });
    }
  }

  return null; // This component doesn't render anything
}

