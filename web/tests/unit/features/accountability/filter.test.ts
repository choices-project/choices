import {
  DEFAULT_FILTERS,
  filterOfficials,
  safeHref,
  safeTel,
  sumAmounts,
} from '@/features/accountability/lib/filter';

import dataset from '@/lib/accountability/surveillance-money.json';

import type { Official, SurveillanceMoneyDataset } from '@/lib/accountability/types';

const totals = { axon: 0, flock: 0, total: 0, byChannel: {} };

const officials: Official[] = [
  {
    id: 'a',
    name: 'José Álvarez',
    level: 'state',
    state: 'AZ',
    office: 'Arizona House',
    totals,
    contributions: [
      { company: 'axon', channel: 'company_committee', source: 'az-seethemoney', amount: 1000 },
      { company: 'axon', channel: 'employees', source: 'fec', amount: 500, donorCount: 2, contributionCount: 3 },
    ],
    votes: { 'az-sb1543-2025-h': 'yes' },
  },
  {
    id: 'b',
    name: 'Pat Doe',
    level: 'federal',
    state: 'GA',
    office: 'U.S. House — GA-05',
    totals,
    contributions: [{ company: 'flock', channel: 'executive', source: 'fec', amount: 2000, donor: 'Exec One' }],
  },
];

describe('accountability filters', () => {
  it('ranks by filtered amount and sums', () => {
    const rows = filterOfficials(officials, DEFAULT_FILTERS);
    expect(rows.map((r) => r.item.id)).toEqual(['b', 'a']);
    expect(sumAmounts(rows)).toBe(3500);
  });

  it('excludes rank-and-file employee money in direct mode', () => {
    const rows = filterOfficials(officials, { ...DEFAULT_FILTERS, money: 'direct' });
    expect(rows.find((r) => r.item.id === 'a')?.amount).toBe(1000);
  });

  it('drops recipients with no money from the selected company', () => {
    const rows = filterOfficials(officials, { ...DEFAULT_FILTERS, company: 'flock' });
    expect(rows.map((r) => r.item.id)).toEqual(['b']);
  });

  it('matches names without accents and filters by state and votes', () => {
    expect(filterOfficials(officials, { ...DEFAULT_FILTERS, query: 'jose alv' })).toHaveLength(1);
    expect(filterOfficials(officials, { ...DEFAULT_FILTERS, state: 'GA' })[0]?.item.id).toBe('b');
    expect(filterOfficials(officials, { ...DEFAULT_FILTERS, votedOnly: true }).map((r) => r.item.id)).toEqual(['a']);
  });

  it('only allows https links', () => {
    expect(safeHref('https://www.fec.gov/data/')).toBe('https://www.fec.gov/data/');
    expect(safeHref('javascript:alert(1)')).toBeUndefined();
    expect(safeHref('http://example.com')).toBeUndefined();
    expect(safeHref(undefined)).toBeUndefined();
  });

  it('only builds tel links from real phone numbers', () => {
    expect(safeTel('(202) 224-4543')).toBe('tel:+12022244543');
    expect(safeTel('javascript:alert(1)')).toBeUndefined();
    expect(safeTel('12')).toBeUndefined();
  });
});

describe('surveillance-money dataset', () => {
  const data = dataset as unknown as SurveillanceMoneyDataset;
  const voteIds = new Set(data.votes.map((v) => v.id));

  it('links every source and roll call over https', () => {
    for (const r of [...data.officials, ...data.organizations]) {
      for (const c of r.contributions) {
        expect(safeHref(c.url)).toBeDefined();
      }
    }
    for (const v of data.votes) expect(safeHref(v.url)).toBeDefined();
  });

  it('never names rank-and-file employees', () => {
    for (const r of [...data.officials, ...data.organizations]) {
      for (const c of r.contributions) {
        if (c.channel === 'employees') {
          expect(c.donor).toBeUndefined();
          expect(c.donorRole).toBeUndefined();
        }
      }
    }
  });

  it('only references known roll calls', () => {
    for (const o of data.officials) {
      for (const id of Object.keys(o.votes ?? {})) expect(voteIds.has(id)).toBe(true);
    }
  });

  it('joins https office contact onto most current officials', () => {
    const withContact = data.officials.filter((o) => o.contact);
    expect(withContact.length).toBeGreaterThan(100);
    for (const o of withContact) {
      const c = o.contact ?? {};
      for (const url of [c.website, c.twitter, c.facebook, c.instagram, c.contactForm, c.ballotpedia]) {
        if (url) expect(safeHref(url)).toBeDefined();
      }
      if (c.phone) expect(safeTel(c.phone)).toBeDefined();
    }
  });
});
