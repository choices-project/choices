/**
 * Root Landing Page
 * Redirect is handled in middleware to avoid layout rendering issues
 * This page should never be reached, but exists as a fallback
 */
export default function RootPage() {
  // This should never render - middleware handles the redirect
  // But if it does, redirect client-side as fallback
  if (typeof window !== 'undefined') {
    window.location.href = '/feed';
    return null;
  }
  return null;
}