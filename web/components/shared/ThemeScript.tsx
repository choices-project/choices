/**
 * Theme Script - Prevents hydration mismatch by setting theme before React hydrates
 * 
 * This script runs synchronously in the <head> before React hydrates.
 * It reads the theme from localStorage and applies it immediately, ensuring
 * the server-rendered HTML matches the client's initial render.
 * 
 * This is the RECOMMENDED Next.js approach for theme handling.
 */
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              // Read theme from localStorage (same key as Zustand persist)
              const stored = localStorage.getItem('app-store');
              if (stored) {
                const parsed = JSON.parse(stored);
                const theme = parsed?.state?.theme || 'system';
                const systemTheme = parsed?.state?.systemTheme || 'light';
                
                // Resolve theme (system -> actual theme)
                const resolvedTheme = theme === 'system' ? systemTheme : theme;
                
                // Apply theme immediately (before React hydrates)
                if (resolvedTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.style.colorScheme = 'light';
                }
              }
            } catch (e) {
              // If localStorage read fails, default to light theme
              // This matches the server's default
            }
          })();
        `,
      }}
    />
  );
}

