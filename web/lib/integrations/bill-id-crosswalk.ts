/**
 * Bill ID crosswalk: GovInfo package IDs ⟷ Congress.gov–style identifiers.
 *
 * GovInfo: BILLS-119hr1234-ih (congress + type + number + version)
 * Congress.gov: documentNumber "hr1234", congress 119
 * Normalized key: "119hr1234" for matching.
 *
 * @see scratch/govinfoMCP USAGE, IMPLEMENTATION
 */

export type CongressStyle = {
  congress: number;
  billType: string;
  number: string;
};

const GOVINFO_BILLS_RE = /^BILLS-(\d{2,3})(hr|s|hjres|sjres|hconres|sconres)(\d+)(?:-([a-z0-9]+))?$/i;

/**
 * Parse GovInfo package ID (e.g. BILLS-119hr1234-ih) into congress, type, number, version.
 */
export function parseGovInfoPackageId(
  packageId: string
): { congress: number; billType: string; number: string; version?: string } | null {
  const m = packageId?.trim().match(GOVINFO_BILLS_RE);
  if (!m) return null;
  return {
    congress: parseInt(m[1], 10),
    billType: m[2].toLowerCase(),
    number: m[3],
    version: m[4] ?? undefined
  };
}

/**
 * Normalize to a comparable key for matching (e.g. "119hr1234").
 * Use when comparing billId from votes (Congress/GovInfo/OpenStates) to poll billId (GovInfo).
 */
export function normalizeBillIdForMatch(id: string | null | undefined): string | null {
  if (id == null || typeof id !== 'string' || !id.trim()) return null;
  const s = id.trim();

  const parsed = parseGovInfoPackageId(s);
  if (parsed) {
    return `${parsed.congress}${parsed.billType}${parsed.number}`.toLowerCase();
  }

  const congressDoc = /^(\d{2,3})(hr|s|hjres|sjres|hconres|sconres)(\d+)$/i.exec(s);
  if (congressDoc) {
    return `${congressDoc[1]}${congressDoc[2]}${congressDoc[3]}`.toLowerCase();
  }

  const docOnly = /^(hr|s|hjres|sjres|hconres|sconres)(\d+)$/i.exec(s);
  if (docOnly) {
    return `${docOnly[1]}${docOnly[2]}`.toLowerCase();
  }

  return s.toLowerCase();
}

/**
 * Build normalized key when we have congress + documentNumber (e.g. Congress.gov vote).
 */
export function buildNormalizedKey(
  congress: number | null | undefined,
  billId: string | null | undefined
): string | null {
  const bid = billId?.trim();
  if (!bid) return null;
  const parsed = parseGovInfoPackageId(bid);
  if (parsed) return `${parsed.congress}${parsed.billType}${parsed.number}`.toLowerCase();
  const m = /^(hr|s|hjres|sjres|hconres|sconres)(\d+)$/i.exec(bid);
  if (m && congress != null) {
    return `${congress}${m[1]}${m[2]}`.toLowerCase();
  }
  return normalizeBillIdForMatch(bid);
}

/**
 * Check if two bill identifiers refer to the same bill (best-effort).
 * Pass congress for the vote side when you have it (e.g. Congress.gov documentNumber + congress).
 */
export function billIdsMatch(
  a: string | null | undefined,
  b: string | null | undefined,
  aCongress?: number | null
): boolean {
  const na = aCongress != null ? buildNormalizedKey(aCongress, a) : normalizeBillIdForMatch(a);
  const nb = normalizeBillIdForMatch(b);
  if (na == null || nb == null) return false;
  return na === nb;
}

const FEDERAL_TYPE_RE = /^(hr|s|hjres|sjres|hconres|sconres)\s*(\d+)$/i;

/**
 * Map congress year or session string to congress number (e.g. "2024" -> 118, "119" -> 119).
 */
export function sessionToCongress(session: string | null | undefined): number | null {
  if (session == null || typeof session !== 'string') return null;
  const s = session.trim();
  const n = parseInt(s, 10);
  if (Number.isNaN(n)) return null;
  if (n >= 80 && n <= 150) return n; // already congress number
  if (n >= 1933 && n <= 2030) {
    // year: 1933->73, 2024->118, 2025->119
    return 73 + Math.floor((n - 1933) / 2);
  }
  return null;
}

/**
 * Derive GovInfo package ID from federal bill identifier and congress.
 * Identifier format: "HR 1234", "S 567", "HJRES 1", etc.
 * Returns e.g. BILLS-119hr1234-ih, BILLS-119s567-is. Use for enrichment/backfill.
 */
export function identifierToGovInfoPackageId(
  identifier: string | null | undefined,
  congress: number
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
