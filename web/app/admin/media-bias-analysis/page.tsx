'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { MediaBiasAnalysisPage } from '@/components/admin/media-bias-analysis/MediaBiasAnalysisPage';

const queryClient = new QueryClient();

export default function MediaBiasAnalysisAdminPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminLayout>
        <MediaBiasAnalysisPage />
      </AdminLayout>
    </QueryClientProvider>
  );
}
