/**
 * Admin Layout
 * 
 * Main layout for all admin pages with sidebar navigation and header.
 */

import { AdminLayout } from '@/components/admin/layout/AdminLayout';

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic';

export default function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
