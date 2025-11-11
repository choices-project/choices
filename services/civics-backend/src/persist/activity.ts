import { getSupabaseClient } from '../clients/supabase.js';
import type { CanonicalRepresentative } from '../ingest/openstates/people.js';
import {
  fetchRecentBillsForPerson,
  type OpenStatesBill,
} from '../clients/openstates.js';

const ACTIVITY_SOURCE = 'openstates';
const MAX_BILLS = Number(process.env.OPENSTATES_ACTIVITY_LIMIT ?? '8');

interface ActivityInsertRow {
  representative_id: number;
  type: string;
  title: string;
  description: string | null;
  date: string | null;
  source: string | null;
  source_url: string | null;
  url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

function buildBillUrl(bill: OpenStatesBill): string | null {
  if (bill.openstates_url && typeof bill.openstates_url === 'string') {
    return bill.openstates_url;
  }

  if (bill.id) {
    const slug = bill.id.replace(/^ocd-bill\//i, '');
    return `https://openstates.org/bills/${slug}`;
  }

  return null;
}

function buildActivityTitle(bill: OpenStatesBill): string {
  const identifier = bill.identifier ?? null;
  if (identifier) {
    return `${identifier}: ${bill.title}`.trim();
  }
  return bill.title;
}

function buildActivityDescription(bill: OpenStatesBill): string | null {
  const latestAction = bill.latest_action_description ?? bill.latest_action ?? null;
  const subjects = Array.isArray(bill.subjects) ? bill.subjects.filter(Boolean) : [];

  const parts: string[] = [];
  if (subjects.length > 0) {
    parts.push(`Subjects: ${subjects.slice(0, 5).join(', ')}`);
  }
  if (latestAction) {
    parts.push(`Latest action: ${latestAction}`);
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(' • ');
}

function selectActivityDate(bill: OpenStatesBill): string | null {
  const candidates = [
    bill.latest_action_date,
    bill.first_action_date,
    bill.updated_at,
    bill.actions?.[0]?.date,
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return null;
}

function buildActivityMetadata(bill: OpenStatesBill): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    openstates_bill_id: bill.id,
  };

  if (bill.identifier) metadata.identifier = bill.identifier;
  if (bill.classification) metadata.classification = bill.classification;
  if (bill.subjects) metadata.subjects = bill.subjects;
  if (bill.jurisdiction?.name) metadata.jurisdiction = bill.jurisdiction.name;
  if (bill.legislative_session?.identifier) {
    metadata.session = bill.legislative_session.identifier;
  }
  if (bill.from_organization?.name) {
    metadata.sponsor_body = bill.from_organization.name;
  }
  if (bill.latest_action_description) {
    metadata.latest_action_description = bill.latest_action_description;
  }
  if (bill.latest_action_date) {
    metadata.latest_action_date = bill.latest_action_date;
  }

  return metadata;
}

function buildActivityRows(
  representativeId: number,
  bills: OpenStatesBill[],
): ActivityInsertRow[] {
  const timestamp = new Date().toISOString();
  const rows: ActivityInsertRow[] = [];
  const seen = new Set<string>();

  for (const bill of bills) {
    const title = buildActivityTitle(bill);
    const key = `${title.toLowerCase()}|${bill.id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({
      representative_id: representativeId,
      type: 'bill',
      title,
      description: buildActivityDescription(bill),
      date: selectActivityDate(bill),
      source: ACTIVITY_SOURCE,
      source_url: buildBillUrl(bill),
      url: buildBillUrl(bill),
      metadata: buildActivityMetadata(bill),
      created_at: timestamp,
      updated_at: timestamp,
    });

    if (rows.length >= MAX_BILLS) {
      break;
    }
  }

  return rows;
}

export async function syncRepresentativeActivity(
  rep: CanonicalRepresentative,
  options: { bills?: OpenStatesBill[] } = {},
): Promise<void> {
  const representativeId = rep.supabaseRepresentativeId;
  if (!representativeId) return;

  const bills =
    options.bills ??
    (await fetchRecentBillsForPerson(rep.openstatesId, { limit: MAX_BILLS }));

  if (bills.length === 0) {
    const client = getSupabaseClient();
    await client
      .from('representative_activity')
      .delete()
      .eq('representative_id', representativeId)
      .eq('source', ACTIVITY_SOURCE);
    return;
  }

  const rows = buildActivityRows(representativeId, bills);

  const client = getSupabaseClient();

  const { error: deleteError } = await client
    .from('representative_activity')
    .delete()
    .eq('representative_id', representativeId)
    .eq('source', ACTIVITY_SOURCE);

  if (deleteError) {
    throw new Error(
      `Failed to prune activity rows for representative ${representativeId}: ${deleteError.message}`,
    );
  }

  if (rows.length === 0) {
    return;
  }

  const { error: insertError } = await client
    .from('representative_activity')
    .insert(rows);

  if (insertError) {
    throw new Error(
      `Failed to upsert activity rows for representative ${representativeId}: ${insertError.message}`,
    );
  }
}


