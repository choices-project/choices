#!/usr/bin/env node
/**
 * Audit canonical ID mappings against Supabase crosswalk entries.
 * Flags inconsistent names, duplicate FEC IDs, and sources pointing to mismatched records.
 */
import 'dotenv/config';

import { writeFile } from 'node:fs/promises';

import { getSupabaseClient } from '../clients/supabase.js';

interface RepresentativeRow {
  id: number;
  name: string;
  state: string | null;
  canonical_id: string | null;
  fec_id: string | null;
  bioguide_id: string | null;
  level: string | null;
}

interface CrosswalkRow {
  canonical_id: string;
  source: string;
  source_id: string | null;
  attrs: Record<string, unknown> | null;
}

type IssueType =
  | 'missing-canonical'
  | 'missing-crosswalk'
  | 'name-mismatch'
  | 'state-mismatch'
  | 'multi-fec'
  | 'crosswalk-mismatch';

interface Issue {
  canonicalId: string;
  type: IssueType;
  summary: string;
  details?: Record<string, unknown>;
}

interface AuditSummary {
  totalIssues: number;
  issuesByType: Record<IssueType, number>;
  topCanonicals: Array<{ canonicalId: string; issueCount: number }>;
}

function buildSummary(issues: Issue[]): AuditSummary {
  const issueCounts: Record<IssueType, number> = {
    'missing-canonical': 0,
    'missing-crosswalk': 0,
    'name-mismatch': 0,
    'state-mismatch': 0,
    'multi-fec': 0,
    'crosswalk-mismatch': 0,
  };

  const canonicalFrequency = new Map<string, number>();

  for (const issue of issues) {
    issueCounts[issue.type] += 1;
    const key = issue.canonicalId;
    canonicalFrequency.set(key, (canonicalFrequency.get(key) ?? 0) + 1);
  }

  const topCanonicals = Array.from(canonicalFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([canonicalId, count]) => ({ canonicalId, issueCount: count }));

  return {
    totalIssues: issues.length,
    issuesByType: issueCounts,
    topCanonicals,
  };
}

async function fetchRepresentatives(): Promise<RepresentativeRow[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('representatives_core')
    .select(
      'id,name,state,canonical_id,fec_id,bioguide_id,level',
    )
    .eq('is_active', true)
    .neq('level', 'local')
    .limit(2000);

  if (error) {
    throw new Error(`Failed to query representatives_core: ${error.message}`);
  }

  return (data ?? []) as RepresentativeRow[];
}

async function fetchCrosswalkEntries(
  canonicalIds: string[],
): Promise<Map<string, CrosswalkRow[]>> {
  if (canonicalIds.length === 0) {
    return new Map();
  }

  const client = getSupabaseClient();
  const map = new Map<string, CrosswalkRow[]>();

  const BATCH_SIZE = 100;
  for (let i = 0; i < canonicalIds.length; i += BATCH_SIZE) {
    const chunk = canonicalIds.slice(i, i + BATCH_SIZE);
    const { data, error } = await client
      .from('id_crosswalk')
      .select('canonical_id, source, source_id, attrs')
      .in('canonical_id', chunk);

    if (error) {
      throw new Error(`Failed to query id_crosswalk: ${error.message}`);
    }

    const rows = (data ?? []) as CrosswalkRow[];
    for (const entry of rows) {
      const list = map.get(entry.canonical_id) ?? [];
      list.push(entry);
      map.set(entry.canonical_id, list);
    }
  }

  return map;
}

function normalizedName(name: string | null | undefined): string {
  return (name ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function analyzeGroup(
  canonicalId: string,
  reps: RepresentativeRow[],
  crosswalk: CrosswalkRow[] | undefined,
): Issue[] {
  const issues: Issue[] = [];
  if (!canonicalId) {
    issues.push({
      canonicalId: '(none)',
      type: 'missing-canonical',
      summary: `Record(s) missing canonical_id: ${reps.map((r) => r.id).join(', ')}`,
    });
    return issues;
  }

  const nameSet = new Set(reps.map((r) => normalizedName(r.name)).filter(Boolean));
  if (nameSet.size > 1) {
    issues.push({
      canonicalId,
      type: 'name-mismatch',
      summary: 'Multiple distinct names share this canonical ID',
      details: { names: reps.map((r) => r.name) },
    });
  }

  const stateSet = new Set(reps.map((r) => r.state).filter(Boolean));
  if (stateSet.size > 1) {
    issues.push({
      canonicalId,
      type: 'state-mismatch',
      summary: 'Canonical ID used across multiple states',
      details: { states: Array.from(stateSet) },
    });
  }

  const fecIds = new Set(reps.map((r) => r.fec_id).filter(Boolean));
  if (fecIds.size > 1) {
    issues.push({
      canonicalId,
      type: 'multi-fec',
      summary: 'Multiple distinct FEC IDs attached to canonical ID',
      details: { fecIds: Array.from(fecIds) },
    });
  }

  if (!crosswalk || crosswalk.length === 0) {
    issues.push({
      canonicalId,
      type: 'missing-crosswalk',
      summary: 'No id_crosswalk entries found for canonical ID',
    });
    return issues;
  }

  for (const entry of crosswalk) {
    if (entry.source === 'fec' && entry.source_id && fecIds.size > 0) {
      if (!fecIds.has(entry.source_id)) {
        issues.push({
          canonicalId,
          type: 'crosswalk-mismatch',
          summary: `Crosswalk FEC ID ${entry.source_id} not present in representatives_core`,
          details: { entry },
        });
      }
    }
    if (entry.source === 'open-states') {
      const hasOpenStatesRep = reps.some((r) => r.level === 'state');
      if (!hasOpenStatesRep) {
        issues.push({
          canonicalId,
          type: 'crosswalk-mismatch',
          summary: 'Crosswalk contains OpenStates mapping but no state-level representative found',
          details: { entry },
        });
      }
    }
  }

  return issues;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let jsonOutput: string | null = null;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg) continue;
    if (arg === '--json') {
      const next = args[i + 1];
      if (!next) {
        throw new Error('--json flag requires a file path argument');
      }
      jsonOutput = next;
      i += 1;
    } else if (arg.startsWith('--json=')) {
      jsonOutput = arg.split('=')[1] ?? null;
    }
  }

  return { jsonOutput };
}

async function writeJsonReport(path: string, issues: Issue[]) {
  const summary = buildSummary(issues);
  const payload = {
    generatedAt: new Date().toISOString(),
    summary,
    issues,
  };
  await writeFile(path, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`📄 Crosswalk audit report written to ${path}`);
}

async function main() {
  try {
    const { jsonOutput } = parseArgs();
    const reps = await fetchRepresentatives();

    const groups = reps.reduce<Map<string, RepresentativeRow[]>>((map, rep) => {
      const key = rep.canonical_id ?? `(missing:${rep.id})`;
      const list = map.get(key) ?? [];
      list.push(rep);
      map.set(key, list);
      return map;
    }, new Map());

    const canonicalIds = Array.from(groups.keys()).filter((id) =>
      id.startsWith('canonical-') || id.startsWith('person_') || id.startsWith('bioguide:') || id.startsWith('fec:'),
    );

    const crosswalkMap = await fetchCrosswalkEntries(canonicalIds);

    const issues: Issue[] = [];
    for (const [canonicalId, repsForId] of groups.entries()) {
      const crosswalk = crosswalkMap.get(canonicalId);
      issues.push(...analyzeGroup(canonicalId, repsForId, crosswalk));
    }

    const summary = buildSummary(issues);

    if (issues.length === 0) {
      console.log('✅ No crosswalk inconsistencies detected.');
      return;
    }

    if (jsonOutput) {
      await writeJsonReport(jsonOutput, issues);
    }

    console.log(`⚠️ Found ${summary.totalIssues} crosswalk issues.`);
    console.log('Issues by type:');
    for (const [type, count] of Object.entries(summary.issuesByType)) {
      console.log(`  • ${type}: ${count}`);
    }

    if (summary.topCanonicals.length > 0) {
      console.log('\nTop canonical IDs by issue count:');
      for (const entry of summary.topCanonicals) {
        console.log(`  • ${entry.canonicalId}: ${entry.issueCount}`);
      }
    }

    console.log('\nDetailed issues:');
    for (const issue of issues) {
      console.log(
        `• [${issue.type}] ${issue.canonicalId} – ${issue.summary}`,
      );
      if (issue.details) {
        console.log(`  Details: ${JSON.stringify(issue.details, null, 2)}`);
      }
    }
  } catch (error) {
    console.error('Crosswalk audit failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

