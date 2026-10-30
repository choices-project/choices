import type {
  Channel,
  CompanyId,
  Contribution,
  Level,
  Official,
  Organization,
} from '@/lib/accountability/types';

export type CompanyFilter = 'all' | CompanyId;
export type MoneyFilter = 'all' | 'direct';
export type SortKey = 'amount' | 'name' | 'state';

export type RecipientFilters = {
  query: string;
  state: string;
  level: 'all' | Level;
  company: CompanyFilter;
  money: MoneyFilter;
  votedOnly: boolean;
  sort: SortKey;
};

export const DEFAULT_FILTERS: RecipientFilters = {
  query: '',
  state: 'all',
  level: 'all',
  company: 'all',
  money: 'all',
  votedOnly: false,
  sort: 'amount',
};

export type Ranked<T> = { item: T; amount: number; contributions: Contribution[] };

/** Company PAC, company treasury, company-funded committees, executives and in-house lobbyists. */
export const DIRECT_CHANNELS: ReadonlySet<Channel> = new Set([
  'pac',
  'corporate',
  'company_committee',
  'executive',
  'lobbyist',
]);

export function contributionMatches(c: Contribution, f: Pick<RecipientFilters, 'company' | 'money'>): boolean {
  if (f.company !== 'all' && c.company !== f.company) return false;
  if (f.money === 'direct' && !DIRECT_CHANNELS.has(c.channel)) return false;
  return true;
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function textMatches(query: string, ...fields: Array<string | undefined>): boolean {
  const q = normalize(query.trim());
  if (!q) return true;
  return fields.some((f) => (f ? normalize(f).includes(q) : false));
}

function rank<T extends Official | Organization>(
  items: T[],
  f: RecipientFilters,
  extraMatch: (item: T) => boolean,
  searchFields: (item: T) => Array<string | undefined>,
): Ranked<T>[] {
  const out: Ranked<T>[] = [];
  for (const item of items) {
    if (f.state !== 'all' && item.state !== f.state) continue;
    if (f.level !== 'all' && item.level !== f.level) continue;
    if (!extraMatch(item)) continue;
    if (!textMatches(f.query, ...searchFields(item))) continue;
    const contributions = item.contributions.filter((c) => contributionMatches(c, f));
    if (contributions.length === 0) continue;
    let amount = 0;
    for (const c of contributions) amount += c.amount;
    out.push({ item, amount: Math.round(amount * 100) / 100, contributions });
  }
  return out.sort((a, b) => {
    if (f.sort === 'name') return a.item.name.localeCompare(b.item.name);
    if (f.sort === 'state') {
      const s = (a.item.state ?? '').localeCompare(b.item.state ?? '');
      if (s !== 0) return s;
    }
    return b.amount - a.amount || a.item.name.localeCompare(b.item.name);
  });
}

export function filterOfficials(officials: Official[], f: RecipientFilters): Ranked<Official>[] {
  return rank(
    officials,
    f,
    (o) => !f.votedOnly || Boolean(o.votes && Object.keys(o.votes).length > 0),
    (o) => [o.name, o.office, ...o.contributions.map((c) => c.via)],
  );
}

export function filterOrganizations(orgs: Organization[], f: RecipientFilters): Ranked<Organization>[] {
  return rank(orgs, f, () => true, (o) => [o.name, o.note]);
}

export function sumAmounts<T>(rows: Ranked<T>[]): number {
  let total = 0;
  for (const r of rows) total += r.amount;
  return Math.round(total * 100) / 100;
}

/** Only render outbound links to https URLs; the dataset is generated, but treat it as untrusted. */
export function safeHref(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Allow only digit phone numbers for tel: links. */
export function safeTel(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return undefined;
  return `tel:+${digits.startsWith('1') && digits.length === 11 ? digits : digits.length === 10 ? `1${digits}` : digits}`;
}
