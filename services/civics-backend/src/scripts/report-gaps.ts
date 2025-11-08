#!/usr/bin/env node
import 'dotenv/config';

import { getSupabaseClient } from '../clients/supabase.js';

async function fetchFinanceIdSet(client: ReturnType<typeof getSupabaseClient>) {
  const { data, error } = await client
    .from('representative_campaign_finance')
    .select('representative_id');

  if (error) {
    throw new Error(`Failed to fetch finance IDs: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => row.representative_id as number));
}

async function computeFecGaps() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('representatives_core')
    .select('id,name,state,district,fec_id,is_active')
    .eq('level', 'federal')
    .eq('is_active', true)
    .not('fec_id', 'is', null)
    .not('fec_id', 'eq', '')
    .order('state', { ascending: true })
    .order('name', { ascending: true })
    .limit(1000);

  if (error) {
    throw new Error(`Failed to fetch FEC gaps: ${error.message}`);
  }

  const financeIds = await fetchFinanceIdSet(client);

  const rows = (data ?? []) as Array<{
    id: number;
    name: string;
    state: string | null;
    district: string | null;
    fec_id: string | null;
  }>;

  const missing = rows.filter((row) => !financeIds.has(row.id));

  missing.sort((a, b) => {
    const stateCompare = (a.state ?? '').localeCompare(b.state ?? '');
    if (stateCompare !== 0) return stateCompare;
    return a.name.localeCompare(b.name);
  });

  const sample = missing.slice(0, 25).map((row) => ({
    id: row.id,
    name: row.name ?? '(unknown)',
    state: row.state ?? '',
    district: row.district ?? '',
    fec_id: row.fec_id ?? '',
  }));

  return {
    total: missing.length,
    sample,
  };
}

async function fetchFecNoDataRows() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('representative_campaign_finance')
    .select(
      'representative_id,sources,updated_at,cycle,representatives_core!inner(id,name,state,district,fec_id)',
    )
    .contains('sources', ['fec:no-data'])
    .eq('representatives_core.level', 'federal')
    .order('updated_at', { ascending: true })
    .limit(15);

  if (error) {
    throw new Error(`Failed to fetch FEC no-data rows: ${error.message}`);
  }

  const rows = (data ?? []) as Array<{
    representative_id: number;
    updated_at: string | null;
    cycle: number | null;
    representatives_core?:
      | {
          id: number;
          name: string;
          state: string | null;
          district: string | null;
          fec_id: string | null;
        }
      | Array<{
          id: number;
          name: string;
          state: string | null;
          district: string | null;
          fec_id: string | null;
        }>;
  }>;

  return rows.map((row) => {
    const core = row.representatives_core;
    const normalizedCore = Array.isArray(core) ? core[0] ?? null : core ?? null;

    return {
      id: normalizedCore?.id ?? row.representative_id,
      name: normalizedCore?.name ?? '(unknown)',
      state: normalizedCore?.state ?? '',
      district: normalizedCore?.district ?? '',
      fec_id: normalizedCore?.fec_id ?? '',
      updated_at: row.updated_at ?? '',
      cycle: row.cycle ?? null,
    };
  });
}

async function fetchCongressIdGaps() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('representatives_core')
    .select('id,name,state,district')
    .eq('level', 'federal')
    .is('congress_gov_id', null)
    .is('govinfo_id', null)
    .order('state', { ascending: true })
    .order('name', { ascending: true })
    .limit(25);

  if (error) {
    throw new Error(`Failed to fetch Congress.gov gaps: ${error.message}`);
  }

  return (data ?? []) as Array<{
    id: number;
    name: string;
    state: string | null;
    district: string | null;
  }>;
}

async function fetchStateContactGaps() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('representatives_core')
    .select('id,name,state,district')
    .eq('level', 'state')
    .or('primary_phone.is.null,primary_phone.eq.')
    .order('state', { ascending: true })
    .order('name', { ascending: true })
    .limit(25);

  if (error) {
    throw new Error(`Failed to fetch state contact gaps: ${error.message}`);
  }

  return (data ?? []) as Array<{
    id: number;
    name: string;
    state: string | null;
    district: string | null;
  }>;
}

async function main(): Promise<void> {
  const client = getSupabaseClient();

  const { count: fecNoDataCount, error: fecNoDataError } = await client
    .from('representative_campaign_finance')
    .select('representative_id,representatives_core!inner(level)', { head: true, count: 'exact' })
    .contains('sources', ['fec:no-data'])
    .eq('representatives_core.level', 'federal');
  if (fecNoDataError) {
    throw new Error(`Failed to count FEC no-data rows: ${fecNoDataError.message}`);
  }

  const { count: congressCount, error: congressCountError } = await client
    .from('representatives_core')
    .select('id', { head: true, count: 'exact' })
    .eq('level', 'federal')
    .is('congress_gov_id', null)
    .is('govinfo_id', null);
  if (congressCountError) {
    throw new Error(`Failed to count Congress.gov gaps: ${congressCountError.message}`);
  }

  const { count: statePhoneCount, error: statePhoneError } = await client
    .from('representatives_core')
    .select('id', { head: true, count: 'exact' })
    .eq('level', 'state')
    .or('primary_phone.is.null,primary_phone.eq.');
  if (statePhoneError) {
    throw new Error(`Failed to count state contact gaps: ${statePhoneError.message}`);
  }

  const [{ total: fecTotal, sample: fecSample }, congressSample, stateContactSample] =
    await Promise.all([
      computeFecGaps(),
    fetchCongressIdGaps(),
    fetchStateContactGaps(),
    ]);

  const fecNoDataSample = await fetchFecNoDataRows();

  console.log('=== Federal Finance Gaps ===');
  console.log(`Total federal representatives with FEC IDs missing finance rows: ${fecTotal ?? 0}`);
  if (fecSample.length > 0) {
    console.table(
      fecSample.map((row) => ({
        id: row.id,
        name: row.name,
        state: row.state ?? '',
        district: row.district ?? '',
        fec_id: row.fec_id ?? '',
      })),
    );
  } else {
    console.log('No outstanding FEC finance gaps found.');
  }

  console.log('\n=== Recorded FEC no-data Rows ===');
  console.log(`Representatives with recorded no-data responses from FEC: ${fecNoDataCount ?? 0}`);
  if (fecNoDataSample.length > 0) {
    console.table(
      fecNoDataSample.map((row) => ({
        id: row.id,
        name: row.name,
        state: row.state,
        district: row.district,
        fec_id: row.fec_id,
        cycle: row.cycle,
        updated_at: row.updated_at,
      })),
    );
  } else {
    console.log('No recorded no-data rows yet.');
  }

  console.log('\n=== Congress.gov / GovInfo Gaps ===');
  console.log(`Total federal representatives missing congress.gov or govinfo identifiers: ${congressCount ?? 0}`);
  if (congressSample.length > 0) {
    console.table(
      congressSample.map((row) => ({
        id: row.id,
        name: row.name,
        state: row.state ?? '',
        district: row.district ?? '',
      })),
    );
  } else {
    console.log('All federal representatives have congress.gov / govinfo identifiers.');
  }

  console.log('\n=== State Contact Gaps ===');
  console.log(`Total state representatives missing primary phone: ${statePhoneCount ?? 0}`);
  if (stateContactSample.length > 0) {
    console.table(
      stateContactSample.map((row) => ({
        id: row.id,
        name: row.name,
        state: row.state ?? '',
        district: row.district ?? '',
      })),
    );
  } else {
    console.log('All state representatives have primary phone numbers.');
  }
}

main().catch((error) => {
  console.error('Gap report failed:', error);
  process.exit(1);
});

