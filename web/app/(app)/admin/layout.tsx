/**
 * Admin Layout
 * 
 * Main layout for all admin pages with server-side admin authentication guard.
 */

import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/admin-auth';
import { AdminLayout } from './layout/AdminLayout';

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic';

export default async function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side admin check - this is the authoritative gate
  const user = await getAdminUser();
  
  if (!user) {
    // Redirect to login with return URL
    redirect('/login?redirectTo=/admin');
  }
  
  // User is authenticated and is admin - render admin layout
  return <AdminLayout>{children}</AdminLayout>;
}
