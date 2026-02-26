import { getSupabaseClient } from '../clients/supabase.js';
import type { CanonicalRepresentative } from '../ingest/openstates/people.js';
import {
  fetchCommitteeAssignments,
  type CommitteeAssignment,
} from '../enrich/committees.js';


interface CommitteeInsertRow {
  representative_id: number;
  committee_name: string;
  role: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

function buildInsertRows(
  representativeId: number,
  assignments: CommitteeAssignment[],
): CommitteeInsertRow[] {
  const timestamp = new Date().toISOString();
  const rows: CommitteeInsertRow[] = [];
  const seen = new Set<string>();

  for (const assignment of assignments) {
    const normalizedName = assignment.committeeName.trim();
    if (!normalizedName) continue;

    const key = `${normalizedName.toLowerCase()}|${assignment.role?.toLowerCase() ?? ''}|${assignment.startDate ?? ''}|${assignment.endDate ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({
      representative_id: representativeId,
      committee_name: normalizedName,
      role: assignment.role?.trim() ?? null,
      start_date: assignment.startDate,
      end_date: assignment.endDate,
      is_current: assignment.isCurrent,
      created_at: timestamp,
      updated_at: timestamp,
    });
  }

  return rows;
}

export async function syncRepresentativeCommittees(
  rep: CanonicalRepresentative,
  options: { assignments?: CommitteeAssignment[] } = {},
): Promise<void> {
  const representativeId = rep.supabaseRepresentativeId;
  if (!representativeId) return;

  const assignments =
    options.assignments ?? (await fetchCommitteeAssignments(rep));

  const client = getSupabaseClient();

  const { error: deleteError } = await client
    .from('representative_committees')
    .delete()
    .eq('representative_id', representativeId);

  if (deleteError) {
    throw new Error(
      `Failed to prune committee rows for representative ${representativeId}: ${deleteError.message}`,
    );
  }

  const rows = buildInsertRows(representativeId, assignments);
  if (rows.length === 0) {
    return;
  }

  const { error: insertError } = await client
    .from('representative_committees')
    .insert(rows);

  if (insertError) {
    throw new Error(
      `Failed to upsert committee rows for representative ${representativeId}: ${insertError.message}`,
    );
  }
}


