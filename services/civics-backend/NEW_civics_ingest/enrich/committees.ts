import { getSupabaseClient } from '../clients/supabase.js';
import type { CanonicalRepresentative } from '../ingest/openstates/people.js';
import {
  fetchCommittees,
  type OpenStatesCommittee,
} from '../clients/openstates.js';
import { deriveJurisdictionFilter } from './state.js';

/** Cache of committees by jurisdiction. Reduces API calls from ~8000 to ~50. */
export type CommitteesByJurisdictionCache = Map<string, OpenStatesCommittee[]>;

export interface CommitteeAssignment {
  committeeName: string;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  source: string;
  openstatesCommitteeId?: string | null;
}

const COMMITTEE_ROLE_TYPES = new Set([
  'committee',
  'subcommittee',
  'taskforce',
  'task force',
  'caucus',
  'workinggroup',
  'working group',
  'board',
]);

const LEGISLATIVE_ROLE_TYPES = new Set([
  'lower',
  'upper',
  'legislature',
  'executive',
  'municipal',
  'mayor',
  'governor',
]);

const CURRENT_DATE = new Date();

function isCurrent(endDate: string | null | undefined): boolean {
  if (!endDate) return true;
  const parsed = new Date(endDate);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed >= CURRENT_DATE;
}

function normaliseRoleType(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (COMMITTEE_ROLE_TYPES.has(normalized)) {
    return normalized;
  }
  if (normalized.includes('committee')) return 'committee';
  if (normalized.includes('task')) return 'taskforce';
  if (normalized.includes('caucus')) return 'caucus';
  if (normalized.includes('board')) return 'board';
  return null;
}

/**
 * Fetch committee assignments from YAML data (baseline)
 */
async function fetchCommitteeAssignmentsFromYAML(
  canonical: CanonicalRepresentative,
): Promise<CommitteeAssignment[]> {
  if (!canonical.supabaseRepresentativeId) {
    return [];
  }

  const client = getSupabaseClient();

  const { data, error } = await client
    .from('openstates_people_roles')
    .select(
      `
        title,
        member_role,
        role_type,
        start_date,
        end_date,
        openstates_people_data!inner(openstates_id)
      `,
    )
    .eq('openstates_people_data.openstates_id', canonical.openstatesId ?? '')
    .limit(200);

  if (error) {
    console.warn(
      `Unable to fetch committee roles for ${canonical.openstatesId}:`,
      error.message,
    );
    return [];
  }

  const roles = Array.isArray(data) ? data : [];

  const assignments: CommitteeAssignment[] = [];
  const seen = new Set<string>();

  for (const role of roles) {
    const rawRoleType = (role as { role_type?: string | null }).role_type ?? null;
    if (rawRoleType && LEGISLATIVE_ROLE_TYPES.has(rawRoleType.toLowerCase())) {
      continue;
    }

    const classification = normaliseRoleType(rawRoleType);

    if (!classification) {
      continue;
    }

    const title = (role as { title?: string | null }).title;
    const memberRole = (role as { member_role?: string | null }).member_role;
    const committeeName = title?.trim() || memberRole?.trim();

    if (!committeeName) {
      continue;
    }

    const startDate = (role as { start_date?: string | null }).start_date ?? null;
    const endDate = (role as { end_date?: string | null }).end_date ?? null;

    const key = `${committeeName.toLowerCase()}|${memberRole?.toLowerCase() ?? ''}|${startDate ?? ''}|${endDate ?? ''}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    assignments.push({
      committeeName,
      role: memberRole ?? null,
      startDate,
      endDate,
      isCurrent: isCurrent(endDate),
      source: 'openstates:yaml',
    });
  }

  return assignments;
}

/**
 * Resolve committee assignments from pre-fetched committees (no API call).
 */
function resolveAssignmentsFromCommittees(
  openstatesId: string,
  committees: OpenStatesCommittee[],
): CommitteeAssignment[] {
  const assignments: CommitteeAssignment[] = [];
  const seen = new Set<string>();

  for (const committee of committees) {
    const memberships = committee.memberships || [];
    for (const membership of memberships) {
      if (membership.person?.id !== openstatesId) {
        continue;
      }

      const committeeName = committee.name?.trim();
      if (!committeeName) continue;

      const role = membership.role?.trim() || null;
      const startDate = membership.start_date || null;
      const endDate = membership.end_date || null;

      const key = `${committeeName.toLowerCase()}|${role?.toLowerCase() ?? ''}|${startDate ?? ''}|${endDate ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);

      assignments.push({
        committeeName,
        role,
        startDate,
        endDate,
        isCurrent: isCurrent(endDate),
        source: 'openstates:api',
        openstatesCommitteeId: committee.id || null,
      });
    }
  }

  return assignments;
}

/**
 * Fetch committee assignments from OpenStates API (current data).
 * When cache is provided, uses cached committees per jurisdiction (no API call).
 */
async function fetchCommitteeAssignmentsFromAPI(
  canonical: CanonicalRepresentative,
  cache?: CommitteesByJurisdictionCache,
): Promise<CommitteeAssignment[]> {
  if (!canonical.openstatesId) {
    return [];
  }

  const jurisdiction = deriveJurisdictionFilter(canonical);
  if (!jurisdiction) {
    return [];
  }

  let committees: OpenStatesCommittee[];

  if (cache?.has(jurisdiction)) {
    committees = cache.get(jurisdiction)!;
  } else {
    try {
      committees = await fetchCommittees({ jurisdiction });
      cache?.set(jurisdiction, committees);
    } catch (error) {
      console.warn(
        `Unable to fetch committee assignments from API for ${canonical.openstatesId}:`,
        (error as Error).message,
      );
      return [];
    }
  }

  if (committees.length === 0) {
    return [];
  }

  return resolveAssignmentsFromCommittees(canonical.openstatesId, committees);
}

/**
 * Fetch committee assignments, merging YAML (baseline) with API (current) data.
 * API data takes precedence for current assignments, YAML provides historical context.
 *
 * @param cache Optional jurisdiction -> committees cache. When provided, committees
 *   are looked up from cache instead of making API calls (reduces ~8000 calls to ~50).
 */
export async function fetchCommitteeAssignments(
  canonical: CanonicalRepresentative,
  options: { useAPI?: boolean; committeesCache?: CommitteesByJurisdictionCache } = {},
): Promise<CommitteeAssignment[]> {
  const { useAPI = true, committeesCache } = options;

  // Always fetch YAML baseline (historical data)
  const yamlAssignments = await fetchCommitteeAssignmentsFromYAML(canonical);

  // If API is enabled and we have an openstatesId, fetch current data
  if (useAPI && canonical.openstatesId) {
    try {
      const apiAssignments = await fetchCommitteeAssignmentsFromAPI(
        canonical,
        committeesCache,
      );

      // Merge: API assignments take precedence for current committees
      // YAML provides historical context for committees not in API
      const merged = new Map<string, CommitteeAssignment>();

      // Add all YAML assignments first (historical baseline)
      for (const assignment of yamlAssignments) {
        const key = `${assignment.committeeName.toLowerCase()}|${assignment.role?.toLowerCase() ?? ''}`;
        merged.set(key, assignment);
      }

      // Override with API assignments (current data)
      for (const assignment of apiAssignments) {
        const key = `${assignment.committeeName.toLowerCase()}|${assignment.role?.toLowerCase() ?? ''}`;
        merged.set(key, assignment);
      }

      return Array.from(merged.values());
    } catch (error) {
      console.warn(
        `Failed to fetch API committee data for ${canonical.openstatesId}, using YAML only:`,
        (error as Error).message,
      );
      // Fall back to YAML only
      return yamlAssignments;
    }
  }

  // Return YAML only if API is disabled or unavailable
  return yamlAssignments;
}

/**
 * Pre-fetch committees for all jurisdictions present in the representative list.
 * Returns a cache that can be passed to fetchCommitteeAssignments to avoid N+1 API calls.
 * Reduces API calls from ~8000 (one per rep) to ~50 (one per jurisdiction).
 */
export async function buildCommitteesCache(
  reps: CanonicalRepresentative[],
): Promise<CommitteesByJurisdictionCache> {
  const cache = new Map<string, OpenStatesCommittee[]>();
  const jurisdictions = new Set<string>();

  for (const rep of reps) {
    const jurisdiction = deriveJurisdictionFilter(rep);
    if (jurisdiction && rep.openstatesId) {
      jurisdictions.add(jurisdiction);
    }
  }

  for (const jurisdiction of jurisdictions) {
    const committees = await fetchCommittees({ jurisdiction });
    cache.set(jurisdiction, committees);
  }

  return cache;
}


