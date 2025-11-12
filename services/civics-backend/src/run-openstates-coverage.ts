#!/usr/bin/env node
/**
 * Generate coverage metrics for OpenStates canonical ingestion or federal representatives.
 *
 * Usage:
 *   npm run qa:openstates -- --limit=500 --states=CA,NY --output=tmp/openstates-sample.json
 *   npm run qa:openstates -- --mode=federal --limit=500 --output=tmp/federal-sample.json
 *
 * When --mode=federal is provided, the script switches to the federal pipeline and
 * collects federal coverage stats (finance, congress.gov, social, contacts, etc.).
 */
import 'dotenv/config';

import { writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

import { collectActiveRepresentatives } from './ingest/openstates/index.js';
import type { CanonicalRepresentative } from './ingest/openstates/people.js';
import { fetchFederalRepresentatives } from './ingest/supabase/representatives.js';

type CliOptions = {
  mode: 'openstates' | 'federal';
  limit: number;
  states?: string[];
  output?: string;
};

const options = parseArgs(process.argv.slice(2));

let payload: any;

if (options.mode === 'federal') {
  const fetchOptions: Parameters<typeof fetchFederalRepresentatives>[0] = {
    limit: options.limit,
  };
  if (options.states) {
    fetchOptions.states = options.states;
  }

  const reps = await fetchFederalRepresentatives(fetchOptions);

  if (reps.length === 0) {
    console.log('No federal representatives collected for the provided filter.');
    process.exit(0);
  }

  const summary = buildFederalSummary(reps);
  const sample = pickFederalSample(reps, Math.min(10, reps.length));

  payload = {
    generatedAt: new Date().toISOString(),
    mode: 'federal',
    limitRequested: options.limit,
    statesRequested: options.states ?? 'all',
    totalRepresentatives: reps.length,
    summary,
    sample,
  };
} else {
  const collectOptions: Parameters<typeof collectActiveRepresentatives>[0] = {
    limit: options.limit,
  };
  if (options.states) {
    collectOptions.states = options.states;
  }

  const reps = await collectActiveRepresentatives(collectOptions);

  if (reps.length === 0) {
    console.log('No representatives collected for the provided filter.');
    process.exit(0);
  }

  const summary = buildSummary(reps);
  const sample = pickSample(reps, Math.min(10, reps.length));

  payload = {
    generatedAt: new Date().toISOString(),
    mode: 'openstates',
    limitRequested: options.limit,
    statesRequested: options.states ?? 'all',
    totalRepresentatives: reps.length,
    summary,
    sample,
  };
}

console.log(JSON.stringify(payload, null, 2));

if (options.output) {
  await writeFile(options.output, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`\nReport saved to ${options.output}`);
}

// --- helpers ----------------------------------------------------------------

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { mode: 'openstates', limit: 500 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg || !arg.startsWith('--')) continue;

    const [flag, valueFromEquals] = arg.includes('=')
      ? arg.slice(2).split('=')
      : [arg.slice(2), undefined];

    const nextArg = argv[i + 1];
    const value =
      valueFromEquals !== undefined
        ? valueFromEquals
        : nextArg && !nextArg.startsWith('--')
          ? nextArg
          : undefined;

    switch (flag) {
      case 'limit':
        if (value) opts.limit = Number(value);
        break;
      case 'mode':
        if (value && (value === 'openstates' || value === 'federal')) {
          opts.mode = value;
        }
        break;
      case 'states':
        if (value) {
          opts.states = value
            .split(',')
            .map((state) => state.trim().toUpperCase())
            .filter(Boolean);
        }
        break;
      case 'output':
        if (value) opts.output = value;
        break;
      default:
        break;
    }

    if (value && !arg.includes('=')) {
      i += 1;
    }
  }

  if (Number.isNaN(opts.limit) || opts.limit <= 0) {
    opts.limit = 500;
  }

  return opts;
}

function buildSummary(reps: CanonicalRepresentative[]) {
  const summary = {
    biographies: 0,
    aliases: {
      total: 0,
      withAliases: 0,
      averagePerRepresentative: 0,
    },
    extras: 0,
    offices: {
      withEmail: 0,
      withPhone: 0,
      total: 0,
      primaryClassifications: new Map<string, number>(),
    },
    contacts: {
      emailCount: 0,
      phoneCount: 0,
      linkCount: 0,
    },
    identifiers: {
      openstates: 0,
      bioguide: 0,
      fec: 0,
      wikipedia: 0,
      ballotpedia: 0,
      other: new Map<string, number>(),
    },
    socials: new Map<string, number>(),
  };

  reps.forEach((rep) => {
    if (rep.biography) summary.biographies += 1;

    summary.aliases.total += rep.aliases.length;
    if (rep.aliases.length > 0) {
      summary.aliases.withAliases += 1;
    }

    if (rep.extras && Object.keys(rep.extras).length > 0) {
      summary.extras += 1;
    }

    summary.contacts.emailCount += rep.emails.length;
    summary.contacts.phoneCount += rep.phones.length;
    summary.contacts.linkCount += rep.links.length;

    rep.offices.forEach((office) => {
      summary.offices.total += 1;
      if (office.email) summary.offices.withEmail += 1;
      if (office.phone) summary.offices.withPhone += 1;
      if (office.classification) {
        const key = office.classification.toLowerCase();
        summary.offices.primaryClassifications.set(
          key,
          (summary.offices.primaryClassifications.get(key) ?? 0) + 1,
        );
      }
    });

    if (rep.identifiers.openstates) summary.identifiers.openstates += 1;
    if (rep.identifiers.bioguide) summary.identifiers.bioguide += 1;
    if (rep.identifiers.fec) summary.identifiers.fec += 1;
    if (rep.identifiers.wikipedia) summary.identifiers.wikipedia += 1;
    if (rep.identifiers.ballotpedia) summary.identifiers.ballotpedia += 1;

    Object.entries(rep.identifiers.other).forEach(([scheme, value]) => {
      if (!value) return;
      const key = scheme.toLowerCase();
      summary.identifiers.other.set(key, (summary.identifiers.other.get(key) ?? 0) + 1);
    });

    rep.social.forEach((profile) => {
      const platform = profile.platform.toLowerCase();
      summary.socials.set(platform, (summary.socials.get(platform) ?? 0) + 1);
    });
  });

  summary.aliases.averagePerRepresentative = Number(
    (summary.aliases.total / reps.length).toFixed(2),
  );

  return {
    biographiesWithContent: summary.biographies,
    biographiesCoveragePercent: Number(((summary.biographies / reps.length) * 100).toFixed(2)),
    aliases: {
      withAliases: summary.aliases.withAliases,
      coveragePercent: Number(((summary.aliases.withAliases / reps.length) * 100).toFixed(2)),
      averagePerRepresentative: summary.aliases.averagePerRepresentative,
    },
    repsWithExtras: summary.extras,
    extrasCoveragePercent: Number(((summary.extras / reps.length) * 100).toFixed(2)),
    contacts: {
      totalEmails: summary.contacts.emailCount,
      totalPhones: summary.contacts.phoneCount,
      totalLinks: summary.contacts.linkCount,
      averageEmails: Number((summary.contacts.emailCount / reps.length).toFixed(2)),
      averagePhones: Number((summary.contacts.phoneCount / reps.length).toFixed(2)),
    },
    offices: {
      totalOffices: summary.offices.total,
      officesWithEmail: summary.offices.withEmail,
      officesWithPhone: summary.offices.withPhone,
      emailCoveragePercent: summary.offices.total
        ? Number(((summary.offices.withEmail / summary.offices.total) * 100).toFixed(2))
        : 0,
      phoneCoveragePercent: summary.offices.total
        ? Number(((summary.offices.withPhone / summary.offices.total) * 100).toFixed(2))
        : 0,
      topClassifications: Array.from(
        summary.offices.primaryClassifications.entries(),
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([classification, count]) => ({ classification, count })),
    },
    identifiers: {
      openstates: summary.identifiers.openstates,
      bioguide: summary.identifiers.bioguide,
      fec: summary.identifiers.fec,
      wikipedia: summary.identifiers.wikipedia,
      ballotpedia: summary.identifiers.ballotpedia,
      otherSchemes: Array.from(summary.identifiers.other.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([scheme, count]) => ({ scheme, count })),
    },
    socialPlatforms: Array.from(summary.socials.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([platform, count]) => ({ platform, count })),
  };
}

function pickSample(reps: CanonicalRepresentative[], count: number) {
  const pool = [...reps];
  const sample = [];
  while (sample.length < count && pool.length > 0) {
    const idx = randomBytes(2).readUInt16BE(0) % pool.length;
    const rep = pool.splice(idx, 1)[0];
    if (!rep) {
      continue;
    }
    sample.push({
      canonicalId: rep.canonicalKey,
      name: rep.name,
      state: rep.state,
      aliases: rep.aliases.map((alias) => alias.name),
      biography: rep.biography ? rep.biography.slice(0, 240) : null,
      emails: rep.emails,
      phones: rep.phones,
      offices: rep.offices.map((office) => ({
        classification: office.classification,
        address: office.address,
        phone: office.phone,
        email: office.email,
      })),
      identifiers: rep.identifiers,
      extras: rep.extras,
      social: rep.social,
    });
  }
  return sample;
}

function buildFederalSummary(reps: CanonicalRepresentative[]) {
  const summary = {
    contacts: {
      repsWithEmails: 0,
      repsWithPhones: 0,
      averageEmails: 0,
      averagePhones: 0,
    },
    socials: new Map<string, number>(),
    finance: {
      withFinance: 0,
      cashOnHandCoveragePercent: 0,
      averageCashOnHand: 0,
    },
    congressGovIds: 0,
    googleCivicIds: 0,
    extras: 0,
  };

  let totalEmails = 0;
  let totalPhones = 0;
  let totalCashOnHand = 0;
  let financeRows = 0;

  reps.forEach((rep) => {
    if (rep.emails.length > 0) {
      summary.contacts.repsWithEmails += 1;
    }
    if (rep.phones.length > 0) {
      summary.contacts.repsWithPhones += 1;
    }
    totalEmails += rep.emails.length;
    totalPhones += rep.phones.length;

    rep.social.forEach((profile) => {
      summary.socials.set(
        profile.platform,
        (summary.socials.get(profile.platform) ?? 0) + 1,
      );
    });

    if (rep.identifiers.other.google_civic) summary.googleCivicIds += 1;
    if (rep.identifiers.other.congress_gov) summary.congressGovIds += 1;
    if (rep.extras && Object.keys(rep.extras).length > 0) {
      summary.extras += 1;
    }

    // finance info not available from Supabase snapshot yet, leave placeholders
  });

  summary.contacts.averageEmails = Number((totalEmails / reps.length).toFixed(2));
  summary.contacts.averagePhones = Number((totalPhones / reps.length).toFixed(2));

  summary.finance.cashOnHandCoveragePercent = summary.finance.withFinance
    ? Number(((financeRows / summary.finance.withFinance) * 100).toFixed(2))
    : 0;
  summary.finance.averageCashOnHand = financeRows
    ? Number((totalCashOnHand / financeRows).toFixed(2))
    : 0;

  return {
    contacts: summary.contacts,
    socials: Array.from(summary.socials.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([platform, count]) => ({ platform, count })),
    finance: summary.finance,
    congressGovIds: summary.congressGovIds,
    googleCivicIds: summary.googleCivicIds,
    repsWithExtras: summary.extras,
  };
}

function pickFederalSample(reps: CanonicalRepresentative[], count: number) {
  const pool = [...reps];
  const sample = [];
  while (sample.length < count && pool.length > 0) {
    const idx = randomBytes(2).readUInt16BE(0) % pool.length;
    const rep = pool.splice(idx, 1)[0];
    if (!rep) continue;
    sample.push({
      canonicalId: rep.canonicalKey,
      name: rep.name,
      state: rep.state,
      contacts: {
        emails: rep.emails,
        phones: rep.phones,
        links: rep.links,
      },
      biography: rep.biography ? rep.biography.slice(0, 240) : null,
      identifiers: rep.identifiers,
      social: rep.social,
      congressGovId: rep.identifiers.other.congress_gov ?? null,
      googleCivicId: rep.identifiers.other.google_civic ?? null,
      extras: rep.extras,
    });
  }
  return sample;
}

