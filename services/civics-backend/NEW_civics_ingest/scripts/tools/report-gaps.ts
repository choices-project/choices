#!/usr/bin/env node
/**
 * Compute coverage gaps across campaign finance, Congress.gov, activity, committees.
 * Used by gap-fill orchestrator to prioritize fill operations.
 *
 * Run: npm run tools:report:gaps [--json] [--format=json|table]
 */
import { loadEnv } from '../../utils/load-env.js';
loadEnv();

import { getSupabaseClient } from '../../clients/supabase.js';

interface GapReport {
  finance: { total: number; sample: Array<{ id: number; name: string; state: string; district: string; fec_id: string }> };
  congress: { total: number; sample: Array<{ id: number; name: string; state: string; district: string }> };
  activity: { total: number; withOpenstates: number; missing: number };
  committees: { total: number; withOpenstates: number; missing: number };
}

async function fetchFinanceGaps(client: ReturnType<typeof getSupabaseClient>): Promise<GapReport['finance']> {
  const [{ data: financeIds }, { count: withFecId }, { data: rows }] = await Promise.all([
    client.from('representative_campaign_finance').select('representative_id'),
    client
      .from('representatives_core')
      .select('*', { count: 'exact', head: true })
      .eq('level', 'federal')
      .eq('status', 'active')
      .not('fec_id', 'is', null)
      .neq('fec_id', ''),
    client
      .from('representatives_core')
      .select('id,name,state,district,fec_id')
      .eq('level', 'federal')
      .eq('status', 'active')
      .not('fec_id', 'is', null)
      .neq('fec_id', '')
      .limit(2000),
  ]);

  const hasFinance = new Set((financeIds ?? []).map((r) => r.representative_id as number));
  const missing = (rows ?? []).filter((r) => !hasFinance.has(r.id));
  const total = Math.max(0, (withFecId ?? 0) - hasFinance.size);

  return {
    total,
    sample: missing.slice(0, 15).map((r) => ({
      id: r.id,
      name: r.name ?? '(unknown)',
      state: r.state ?? '',
      district: r.district ?? '',
      fec_id: r.fec_id ?? '',
    })),
  };
}

async function fetchCongressGaps(client: ReturnType<typeof getSupabaseClient>): Promise<GapReport['congress']> {
  const { data: rows, count } = await client
    .from('representatives_core')
    .select('id,name,state,district', { count: 'exact' })
    .eq('level', 'federal')
    .eq('status', 'active')
    .is('congress_gov_id', null)
    .is('govinfo_id', null)
    .limit(15);

  return {
    total: count ?? 0,
    sample: (rows ?? []).map((r) => ({
      id: r.id,
      name: r.name ?? '(unknown)',
      state: r.state ?? '',
      district: r.district ?? '',
    })),
  };
}

async function fetchActivityGaps(client: ReturnType<typeof getSupabaseClient>): Promise<GapReport['activity']> {
  const { count: withOpenstates } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .in('level', ['state', 'local'])
    .eq('status', 'active')
    .not('openstates_id', 'is', null);

  const { data: activityRepIds } = await client
    .from('representative_activity')
    .select('representative_id');
  const hasActivity = new Set((activityRepIds ?? []).map((r) => r.representative_id as number));

  const { data: stateLocal } = await client
    .from('representatives_core')
    .select('id')
    .in('level', ['state', 'local'])
    .eq('status', 'active')
    .not('openstates_id', 'is', null);

  const missing = (stateLocal ?? []).filter((r) => !hasActivity.has(r.id));
  return {
    total: stateLocal?.length ?? 0,
    withOpenstates: withOpenstates ?? 0,
    missing: missing.length,
  };
}

async function fetchCommitteeGaps(client: ReturnType<typeof getSupabaseClient>): Promise<GapReport['committees']> {
  const { count: withOpenstates } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .in('level', ['state', 'local'])
    .eq('status', 'active')
    .not('openstates_id', 'is', null);

  const { data: committeeRepIds } = await client
    .from('representative_committees')
    .select('representative_id')
    .eq('is_current', true);
  const hasCommittee = new Set((committeeRepIds ?? []).map((r) => r.representative_id as number));

  const { data: stateLocal } = await client
    .from('representatives_core')
    .select('id')
    .in('level', ['state', 'local'])
    .eq('status', 'active')
    .not('openstates_id', 'is', null);

  const missing = (stateLocal ?? []).filter((r) => !hasCommittee.has(r.id));
  return {
    total: stateLocal?.length ?? 0,
    withOpenstates: withOpenstates ?? 0,
    missing: missing.length,
  };
}

export async function computeGapReport(): Promise<GapReport> {
  const client = getSupabaseClient();
  const [finance, congress, activity, committees] = await Promise.all([
    fetchFinanceGaps(client),
    fetchCongressGaps(client),
    fetchActivityGaps(client),
    fetchCommitteeGaps(client),
  ]);
  return { finance, congress, activity, committees };
}

function main(): void {
  const hasJson = process.argv.includes('--json');
  const formatArg = process.argv.find((a) => a.startsWith('--format='))?.split('=')[1];
  const format = hasJson ? 'json' : (formatArg ?? 'table');

  computeGapReport()
    .then((report) => {
      if (format === 'json') {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      console.log('\n=== Gap Report ===\n');
      console.log(`Finance: ${report.finance.total} federal reps with FEC ID missing finance data`);
      if (report.finance.sample.length > 0) {
        console.table(report.finance.sample);
      }

      console.log(`\nCongress/GovInfo: ${report.congress.total} federal reps missing identifiers`);
      if (report.congress.sample.length > 0) {
        console.table(report.congress.sample);
      }

      console.log(
        `\nActivity: ${report.activity.missing}/${report.activity.withOpenstates} state/local reps with openstates_id missing activity`,
      );
      console.log(
        `Committees: ${report.committees.missing}/${report.committees.withOpenstates} state/local reps with openstates_id missing committees`,
      );
      console.log('');
    })
    .catch((err) => {
      console.error('Gap report failed:', (err as Error).message);
      process.exit(1);
    });
}

main();
