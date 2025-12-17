import { redirect } from 'next/navigation';

/**
 * Root Page
 * 
 * Redirects handled by middleware:
 * - Unauthenticated users: middleware shows /landing
 * - Authenticated users: middleware redirects to /feed
 * 
 * This page should rarely be reached directly.
 * If it is, redirect to landing as fallback.
 */
export default function RootPage() {
  // Fallback redirect if middleware doesn't catch it
  redirect('/landing');
}
