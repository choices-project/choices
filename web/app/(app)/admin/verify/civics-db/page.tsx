'use server'

import React from 'react'

async function fetchVerification(): Promise<{
  success: boolean
  data?: any
  error?: string
  metadata?: Record<string, unknown>
}> {
  const adminKey = process.env.ADMIN_MONITORING_KEY ?? ''
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/admin/verify/civics-db`, {
      method: 'GET',
      headers: {
        'x-admin-key': adminKey,
      },
      // Ensure this runs on server and doesn't revalidate too frequently
      cache: 'no-store',
    })
    const body = await res.json()
    return body
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function fetchStats(): Promise<any> {
  const adminKey = process.env.ADMIN_MONITORING_KEY ?? ''
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/admin/civics/stats`, {
    method: 'GET',
    headers: { 'x-admin-key': adminKey },
    cache: 'no-store'
  })
  return res.json()
}

async function fetchQa(): Promise<any> {
  const adminKey = process.env.ADMIN_MONITORING_KEY ?? ''
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/admin/civics/qa`, {
    method: 'GET',
    headers: { 'x-admin-key': adminKey },
    cache: 'no-store'
  })
  return res.json()
}

async function runBackfill(): Promise<any> {
  const adminKey = process.env.ADMIN_MONITORING_KEY ?? ''
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/cron/backfill-poll-insights`, {
    method: 'POST',
    headers: { 'x-cron-secret': process.env.CRON_SECRET ?? '', 'x-admin-key': adminKey },
    cache: 'no-store'
  })
  return res.json()
}

export default async function AdminVerifyCivicsDbPage() {
  const [result, stats, qa] = await Promise.all([fetchVerification(), fetchStats(), fetchQa()])
  const status = result?.data?.status ?? (result.success ? 'ok' : 'error')
  return (
    <main role="main" aria-labelledby="civics-db-title" className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 id="civics-db-title" className="text-2xl font-semibold">Admin: Verify Civics Database</h1>
        <p className="text-sm text-muted-foreground mt-1">Samples data from the Supabase civics tables to confirm schema and connectivity.</p>
      </div>

      <section aria-labelledby="status-summary" className="rounded border bg-background p-4 mb-6">
        <h2 id="status-summary" className="mb-3 text-sm font-semibold">Status Summary</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded border p-3">
            <div className="text-xs text-muted-foreground mb-1">Elections</div>
            <div className="text-sm">Count: {stats?.data?.elections?.count ?? 0}</div>
            <div className="text-sm">Next: {stats?.data?.elections?.nextElectionDay ?? 'n/a'}</div>
            <div className={`text-xs mt-1 ${stats?.data?.elections?.staleAlert ? 'text-amber-600' : 'text-muted-foreground'}`}>
              {stats?.data?.elections?.staleAlert ? 'Stale alert: review ingest freshness' : 'Fresh'}
            </div>
          </div>
          <div className="rounded border p-3">
            <div className="text-xs text-muted-foreground mb-1">Representatives</div>
            <div className="text-sm">Count: {stats?.data?.representatives?.count ?? 0}</div>
          </div>
          <div className="rounded border p-3">
            <div className="text-xs text-muted-foreground mb-1">QA</div>
            <div className="text-sm">Duplicates: {qa?.data?.duplicates?.rows?.length ?? 0}</div>
            <div className="text-sm">Missing divisions: {qa?.data?.missing_divisions?.rows?.length ?? 0}</div>
          </div>
        </div>
      </section>

      <section aria-labelledby="admin-actions" className="rounded border bg-background p-4 mb-6">
        <h2 id="admin-actions" className="mb-3 text-sm font-semibold">Actions</h2>
        <form action={async () => { 'use server'; await runBackfill(); }} className="flex flex-wrap gap-3">
          <button className="px-3 py-2 rounded border bg-blue-600 text-white hover:bg-blue-700 text-sm" type="submit">
            Re-run Poll Insights Backfill
          </button>
          <a
            href="/docs/API/cron-backfill-poll-insights"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded border text-sm"
          >
            Backfill Docs
          </a>
          <a
            href="/docs/API/address-lookup"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded border text-sm"
          >
            Address Lookup Docs
          </a>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Elections refresh requires backend ingest (see services/civics-backend). Use the job runner to sync elections.
        </p>
      </section>

      <section aria-labelledby="verification-details" className="rounded border bg-background p-4">
        <div className="mb-3">
          <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
            Status: {String(status)}
          </span>
        </div>

        {!result.success && (
          <div className="mb-4 text-sm text-red-600">
            Error: {result.error ?? 'Unknown error'}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2" aria-labelledby="verification-details">
          <h2 id="verification-details" className="sr-only">Verification details</h2>
          <div className="rounded border p-3">
            <h3 className="mb-2 text-sm font-semibold">civic_elections (sample)</h3>
            <pre className="whitespace-pre-wrap break-words text-xs">
              {JSON.stringify(result?.data?.details?.civic_elections ?? {}, null, 2)}
            </pre>
          </div>
          <div className="rounded border p-3">
            <h3 className="mb-2 text-sm font-semibold">representatives_core (sample)</h3>
            <pre className="whitespace-pre-wrap break-words text-xs">
              {JSON.stringify(result?.data?.details?.representatives_core ?? {}, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          Timestamp: {result?.data?.timestamp ?? 'n/a'}
        </div>
      </section>
    </main>
  )
}


