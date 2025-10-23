'use client';

import React from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import FeatureFlags from '@/features/admin/components/FeatureFlags';

export default function AdminFeatureFlagsPage() {
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FeatureFlags />
      </div>
    </AdminLayout>
  );
}
