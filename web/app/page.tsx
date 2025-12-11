import { redirect } from 'next/navigation';

/**
 * Root Landing Page
 * Server-side redirect to feed page
 * This avoids client-side rendering issues and provides a simple entry point
 */
export default function RootPage() {
  redirect('/feed');
}