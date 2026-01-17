import React, { Suspense } from 'react';

import { AdminMonitoringShell } from './AdminMonitoringShell';
import MonitoringLoading from './loading';
import { MonitoringContentClient } from './MonitoringContentClient';

type MonitoringData = {
  success: boolean;
  data: {
    metrics?: {
      totalViolations?: number;
      violationsLastHour?: number;
      violationsLast24Hours?: number;
      topViolatingIPs?: Array<{ ip: string; count: number }>;
      violationsByEndpoint?: Record<string, number>;
    };
    recentViolations?: Array<{
      timestamp: number;
      ip: string;
      endpoint: string;
      count: number;
    }>;
  } | null;
};

async function fetchMonitoring(): Promise<MonitoringData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/security/monitoring`, {
    cache: 'no-store'
  });
  if (!res.ok) {
    return { success: false, data: null };
  }
  return res.json() as Promise<MonitoringData>;
}

async function fetchExtendedHealth() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/health/extended`, {
      cache: 'no-store'
    });
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch {
    return null;
  }
}

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

type MonitoringContentProps = {
  initialMonitoringData?: any;
  initialHealthData?: any;
};

function MonitoringContent({ initialMonitoringData, initialHealthData }: MonitoringContentProps) {
  // Use client component for React Query refresh capabilities
  // Pass initial SSR data for better performance
  return (
    <MonitoringContentClient
      initialMonitoringData={initialMonitoringData}
      initialHealthData={initialHealthData}
    />
  );
}

export default async function MonitoringPage(_props: PageProps) {
  // Fetch initial data for SSR and pass to client component
  // Client component will handle refresh with React Query and searchParams via useSearchParams()
  const [payload, healthData] = await Promise.all([
    fetchMonitoring().catch(() => ({ success: false, data: null })),
    fetchExtendedHealth().catch(() => null)
  ]);

  return (
    <AdminMonitoringShell>
      <Suspense fallback={<MonitoringLoading />}>
        <MonitoringContent
          initialMonitoringData={payload}
          initialHealthData={healthData}
        />
      </Suspense>
    </AdminMonitoringShell>
  );
}


