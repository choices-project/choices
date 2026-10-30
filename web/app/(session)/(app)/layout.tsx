'use client';

import React from 'react';

import { AppShell } from '@/components/shared/AppShell';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export default function AppSegmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <ErrorBoundary>{children}</ErrorBoundary>
    </AppShell>
  );
}
