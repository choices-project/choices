import React from 'react';

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
  const adminKey = process.env.ADMIN_MONITORING_KEY ?? 'dev-admin-key';
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/security/monitoring`, {
    headers: { 'x-admin-key': adminKey },
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

async function clearLimit(ip: string, endpoint: string) {
  'use server';
  const adminKey = process.env.ADMIN_MONITORING_KEY ?? 'dev-admin-key';
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/security/monitoring/clear`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-key': adminKey
    },
    body: JSON.stringify({ ip, endpoint })
  });
}

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function MonitoringPage({ searchParams }: PageProps) {
  const range = (searchParams?.range as string) ?? '24h'; // '1h' | '24h' | '7d'
  const endpointFilter = (searchParams?.endpoint as string) ?? '';

  const [payload, healthData] = await Promise.all([
    fetchMonitoring(),
    fetchExtendedHealth()
  ]);
  const data = payload?.data;

  const now = Date.now();
  const cutoff = range === '1h' ? now - 60 * 60 * 1000 : range === '7d' ? now - 7 * 24 * 60 * 60 * 1000 : now - 24 * 60 * 60 * 1000;
  const recent = (data?.recentViolations ?? []).filter((v) => v.timestamp > cutoff && (!endpointFilter || v.endpoint === endpointFilter));

  // Build simple time buckets for a tiny bar chart (per 10-minute bucket for 1h, hourly for 24h/7d)
  const bucketMs = range === '1h' ? 10 * 60 * 1000 : 60 * 60 * 1000;
  const bucketCount = range === '1h' ? 6 : (range === '7d' ? 7 * 24 : 24);
  const buckets = Array.from({ length: bucketCount }, (_, i) => now - (bucketCount - 1 - i) * bucketMs);
  const bucketValues = buckets.map((start, _idx) => {
    const end = start + bucketMs;
    return recent.filter((v) => v.timestamp >= start && v.timestamp < end).length;
  });
  const maxVal = Math.max(1, ...bucketValues);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Security & System Monitoring</h1>

      {/* System Health Section */}
      {healthData && (
        <section className="rounded-lg border p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="rounded-lg border p-3 bg-white">
              <div className="text-xs text-gray-500">Overall Status</div>
              <div className={`text-2xl font-bold ${
                healthData.status === 'healthy' ? 'text-green-600' :
                healthData.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {healthData.status?.toUpperCase() ?? 'UNKNOWN'}
              </div>
            </div>
            <div className="rounded-lg border p-3 bg-white">
              <div className="text-xs text-gray-500">Database</div>
              <div className={`text-2xl font-bold ${
                healthData.checks?.database?.status === 'healthy' ? 'text-green-600' : 'text-red-600'
              }`}>
                {healthData.checks?.database?.status?.toUpperCase() ?? 'UNKNOWN'}
              </div>
              {healthData.checks?.database?.responseTime && (
                <div className="text-xs text-gray-500 mt-1">
                  {healthData.checks.database.responseTime}ms
                </div>
              )}
            </div>
            <div className="rounded-lg border p-3 bg-white">
              <div className="text-xs text-gray-500">Supabase</div>
              <div className={`text-2xl font-bold ${
                healthData.checks?.supabase?.status === 'healthy' ? 'text-green-600' : 'text-red-600'
              }`}>
                {healthData.checks?.supabase?.status?.toUpperCase() ?? 'UNKNOWN'}
              </div>
            </div>
            <div className="rounded-lg border p-3 bg-white">
              <div className="text-xs text-gray-500">Memory Usage</div>
              <div className="text-2xl font-bold">
                {healthData.system?.memory?.used ?? 0}MB
              </div>
              <div className="text-xs text-gray-500 mt-1">
                of {healthData.system?.memory?.total ?? 0}MB
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Rate Limiting Metrics Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Total Violations</div>
          <div className="text-3xl font-bold">{data?.metrics?.totalViolations ?? 0}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Violations (Last Hour)</div>
          <div className="text-3xl font-bold">{data?.metrics?.violationsLastHour ?? 0}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Violations (Last 24h)</div>
          <div className="text-3xl font-bold">{data?.metrics?.violationsLast24Hours ?? 0}</div>
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">Top IPs</h2>
        <ul className="divide-y">
          {(data?.metrics?.topViolatingIPs ?? []).map((item) => (
            <li key={`${item.ip}`} className="py-2 flex items-center justify-between">
              <span className="font-mono">{item.ip}</span>
              <span className="text-sm text-gray-600">{item.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">Violations Trend</h2>
        <div className="flex items-end gap-1 h-20">
          {bucketValues.map((v, i) => (
            <div key={i} className="bg-blue-500" style={{ width: '6px', height: `${(v / maxVal) * 100}%` }} />
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Showing {range === '1h' ? '10-minute' : 'hourly'} buckets for {range}
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <form className="flex flex-wrap items-end gap-3 mb-4" action="" method="get">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Timeframe</label>
            <select name="range" defaultValue={range} className="border rounded px-2 py-1 text-sm">
              <option value="1h">Last hour</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7d</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Endpoint</label>
            <input name="endpoint" defaultValue={endpointFilter} placeholder="/api/feeds" className="border rounded px-2 py-1 text-sm min-w-[200px]" />
          </div>
          <div>
            <button type="submit" className="px-3 py-1 rounded border text-xs hover:bg-gray-50">Apply</button>
          </div>
        </form>
        <h2 className="text-lg font-semibold mb-2">Violations by Endpoint</h2>
        <ul className="divide-y">
          {Object.entries(data?.metrics?.violationsByEndpoint ?? {})
            .filter(([endpoint]) => !endpointFilter || endpoint === endpointFilter)
            .map(([endpoint, count]: [string, number]) => (
            <li key={endpoint} className="py-2 flex items-center justify-between">
              <span className="font-mono">{endpoint}</span>
              <span className="text-sm text-gray-600">{count}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* System Performance Metrics */}
      {healthData?.system && (
        <section className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4">System Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Memory Usage</div>
              <div className="text-lg font-semibold">
                {healthData.system.memory?.used ?? 0} MB / {healthData.system.memory?.total ?? 0} MB
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ 
                    width: `${((healthData.system.memory?.used ?? 0) / (healthData.system.memory?.total ?? 1)) * 100}%` 
                  }} 
                />
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Uptime</div>
              <div className="text-lg font-semibold">
                {healthData.uptime ? `${Math.floor(healthData.uptime / 60)}m ${Math.floor(healthData.uptime % 60)}s` : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Environment</div>
              <div className="text-lg font-semibold">{healthData.environment ?? 'unknown'}</div>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-3">Recent Violations (last 24h)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="py-2 pr-4">Time</th>
                <th className="py-2 pr-4">IP</th>
                <th className="py-2 pr-4">Endpoint</th>
                <th className="py-2 pr-4">Count</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {recent.slice(0, 50).map((v, idx: number) => (
                <tr key={idx} className="border-t">
                  <td className="py-2 pr-4">{new Date(v.timestamp).toLocaleString()}</td>
                  <td className="py-2 pr-4 font-mono">{v.ip}</td>
                  <td className="py-2 pr-4 font-mono">{v.endpoint}</td>
                  <td className="py-2 pr-4">{v.count}</td>
                  <td className="py-2 pr-4">
                    <form action={async () => { 'use server'; await clearLimit(v.ip, v.endpoint); }}>
                      <button type="submit" className="px-3 py-1 rounded border text-xs hover:bg-gray-50">Clear</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


