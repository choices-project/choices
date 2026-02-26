/**
 * Representative activity persist: OpenStates bill activity only.
 *
 * Canonical representative_activity = type 'bill', from OpenStates. No "Election:…"
 * or other non-bill rows. Audit via: npm run tools:smoke-test or manual query.
 *
 * We fetch bills with include=actions,votes,sponsorships. For each bill we store:
 * - description: subjects, latest action, Sponsor (primary/cosponsor), Voted (when available).
 * - metadata: sponsorship_role, my_votes (array of { motion, option }), plus existing fields.
 */
import { getSupabaseClient } from '../clients/supabase.js';
import { deriveJurisdictionFilter } from '../enrich/state.js';
import type { CanonicalRepresentative } from '../ingest/openstates/people.js';
import {
  fetchRecentBillsForPerson,
  type OpenStatesBill,
  type OpenStatesBillVoteEvent,
  type OpenStatesBillSponsorship,
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

function mySponsorshipRole(
  bill: OpenStatesBill,
  openstatesId: string,
): 'primary' | 'cosponsor' | null {
  const list = bill.sponsorships;
  if (!Array.isArray(list)) return null;
  const me = list.find(
    (s: OpenStatesBillSponsorship) =>
      s.person?.id != null && String(s.person.id).toLowerCase() === openstatesId.toLowerCase(),
  );
  if (!me) return null;
  return me.primary === true ? 'primary' : 'cosponsor';
}

function myVotesOnBill(
  bill: OpenStatesBill,
  openstatesId: string,
): Array<{ motion: string; option: string }> {
  const out: Array<{ motion: string; option: string }> = [];
  const events = bill.votes;
  if (!Array.isArray(events)) return out;
  for (const ev of events as OpenStatesBillVoteEvent[]) {
    const motion = ev.motion_text ?? 'Vote';
    const list = ev.votes;
    if (!Array.isArray(list)) continue;
    const myEntry = list.find(
      (v) =>
        v.voter?.id != null &&
        String(v.voter.id).toLowerCase() === openstatesId.toLowerCase(),
    );
    if (myEntry?.option) {
      out.push({ motion, option: myEntry.option });
    }
  }
  return out;
}

function buildActivityDescription(
  bill: OpenStatesBill,
  openstatesId: string | undefined,
): string | null {
  const latestAction = bill.latest_action_description ?? bill.latest_action ?? null;
  const subjects = Array.isArray(bill.subjects) ? bill.subjects.filter(Boolean) : [];

  const parts: string[] = [];
  if (subjects.length > 0) {
    parts.push(`Subjects: ${subjects.slice(0, 5).join(', ')}`);
  }
  if (latestAction) {
    parts.push(`Latest action: ${latestAction}`);
  }
  if (openstatesId) {
    const role = mySponsorshipRole(bill, openstatesId);
    if (role) {
      parts.push(`Sponsor: ${role === 'primary' ? 'Primary sponsor' : 'Cosponsor'}`);
    }
    const votes = myVotesOnBill(bill, openstatesId);
    if (votes.length > 0) {
      const voteStr = votes.map((v) => `${v.motion}: ${v.option}`).join('; ');
      parts.push(`Voted: ${voteStr}`);
    }
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

const FEDERAL_TYPE_RE = /^(hr|s|hjres|sjres|hconres|sconres)\s*(\d+)$/i;

function sessionToCongress(session: string | null | undefined): number | null {
  if (session == null || typeof session !== 'string') return null;
  const s = session.trim();
  const n = parseInt(s, 10);
  if (Number.isNaN(n)) return null;
  if (n >= 80 && n <= 150) return n;
  if (n >= 1933 && n <= 2030) return 73 + Math.floor((n - 1933) / 2);
  return null;
}

function identifierToGovInfoPackageId(
  identifier: string | null | undefined,
  congress: number,
): string | null {
  if (identifier == null || typeof identifier !== 'string') return null;
  const norm = identifier.replace(/\s+/g, ' ').trim();
  const m = norm.match(FEDERAL_TYPE_RE);
  if (!m) return null;
  const type = m[1].toLowerCase();
  const num = m[2];
  const house = ['hr', 'hjres', 'hconres'].includes(type);
  const suffix = house ? 'ih' : 'is';
  return `BILLS-${congress}${type}${num}-${suffix}`;
}

function buildActivityMetadata(
  bill: OpenStatesBill,
  openstatesId: string | undefined,
): Record<string, unknown> {
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
  if (openstatesId) {
    const role = mySponsorshipRole(bill, openstatesId);
    if (role) metadata.sponsorship_role = role;
    const votes = myVotesOnBill(bill, openstatesId);
    if (votes.length > 0) metadata.my_votes = votes;
  }

  const session = bill.legislative_session?.identifier ?? null;
  const congress = sessionToCongress(session);
  const govinfoId =
    bill.identifier && congress != null
      ? identifierToGovInfoPackageId(bill.identifier, congress)
      : null;
  if (govinfoId) metadata.govinfo_bill_id = govinfoId;

  return metadata;
}

function buildActivityRows(
  representativeId: number,
  bills: OpenStatesBill[],
  openstatesId: string | undefined,
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
      description: buildActivityDescription(bill, openstatesId),
      date: selectActivityDate(bill),
      source: ACTIVITY_SOURCE,
      source_url: buildBillUrl(bill),
      url: buildBillUrl(bill),
      metadata: buildActivityMetadata(bill, openstatesId),
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

  let bills = options.bills;
  if (!bills) {
    const jurisdiction = deriveJurisdictionFilter(rep);
    const fetchOpts: { limit: number; jurisdiction?: string; query?: string } = { limit: MAX_BILLS };
    if (jurisdiction) fetchOpts.jurisdiction = jurisdiction;
    // Use fallback query if no openstatesId but have name
    if (!rep.openstatesId && rep.name) {
      fetchOpts.query = rep.name;
    }
    // fetchRecentBillsForPerson now handles null openstatesId with fallback
    bills = await fetchRecentBillsForPerson(rep.openstatesId || null, fetchOpts);
  }

  if (bills.length === 0) {
    const client = getSupabaseClient();
    await client
      .from('representative_activity')
      .delete()
      .eq('representative_id', representativeId)
      .eq('source', ACTIVITY_SOURCE);
    return;
  }

  const rows = buildActivityRows(representativeId, bills, rep.openstatesId || undefined);

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

  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await client
      .from('representative_activity')
      .insert(batch);

    if (insertError) {
      throw new Error(
        `Failed to upsert activity rows for representative ${representativeId}: ${insertError.message}`,
      );
    }
  }
}


