import { getSupabaseClient } from '../clients/supabase.js';
import type { CanonicalRepresentative } from '../ingest/openstates/people.js';

export interface CommitteeAssignment {
  committeeName: string;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  source: string;
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

export async function fetchCommitteeAssignments(
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
      source: 'openstates:roles',
    });
  }

  return assignments;
}


