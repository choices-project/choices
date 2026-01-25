import { deriveKeyIssuesFromBills } from '@choices/civics-shared';
import type { OpenStatesLikeBill } from '@choices/civics-shared';

import type { CanonicalRepresentative } from '../ingest/openstates/people.js';
import { fetchRecentBillsForPerson, type FetchBillsOptions } from '../clients/openstates.js';

export interface StateIssueSignal {
  issue: string;
  weight?: number;
  mentions?: number;
  latestAction?: string;
  source?: string;
}

export interface StateEnrichment {
  issues: StateIssueSignal[];
  social: Record<string, string>;
  contacts: {
    emails: string[];
    phones: string[];
    links: string[];
  };
  biography: string | null;
  aliases: CanonicalRepresentative['aliases'];
  identifiers: CanonicalRepresentative['identifiers'];
  offices: CanonicalRepresentative['offices'];
  extras: Record<string, unknown> | null;
  sources: Record<string, string[]>;
}

export async function enrichStateRepresentative(
  canonical: CanonicalRepresentative,
): Promise<StateEnrichment> {
  const issues = await deriveIssueSignals(canonical);
  const social = buildSocialLookup(canonical);
  const contacts = buildContactSnapshot(canonical);

  const sources: Record<string, string[]> = {};
  if (issues.length > 0) {
    sources.openstates = [`openstates:bills:${canonical.openstatesId}`];
  }

  return {
    issues,
    social,
    contacts,
    biography: canonical.biography ?? null,
    aliases: canonical.aliases,
    identifiers: canonical.identifiers,
    offices: canonical.offices,
    extras: canonical.extras,
    sources,
  };
}

async function deriveIssueSignals(
  canonical: CanonicalRepresentative,
): Promise<StateIssueSignal[]> {
  if (!canonical.openstatesId) {
    return [];
  }

  const fetchOptions: FetchBillsOptions = {
    limit: 30,
  };

  const jurisdiction = deriveJurisdictionFilter(canonical);
  if (jurisdiction) {
    fetchOptions.jurisdiction = jurisdiction;
  }
  if (canonical.name) {
    fetchOptions.query = canonical.name;
  }

  const bills = await fetchRecentBillsForPerson(canonical.openstatesId || null, fetchOptions);

  if (bills.length === 0) {
    return [];
  }

  const normalizedBills = bills.map<OpenStatesLikeBill>((bill) => {
    const normalized: OpenStatesLikeBill = {};

    if (bill.title) {
      normalized.title = bill.title;
    }

    if (Array.isArray(bill.subjects)) {
      const subjects = bill.subjects.filter((subject): subject is string => Boolean(subject));
      if (subjects.length > 0) {
        normalized.subjects = subjects;
      }
    }

    if (bill.updated_at) {
      normalized.updated_at = bill.updated_at;
    }

    if (Array.isArray(bill.actions)) {
      normalized.actions = bill.actions.map((action) => {
        const entry: { date?: string } = {};
        if (action?.date != null) {
          entry.date = action.date;
        }
        return entry;
      });
    }

    if (bill.latest_action != null) {
      normalized.latest_action = bill.latest_action;
    }

    return normalized;
  });

  const signals = deriveKeyIssuesFromBills(normalizedBills, {
    limit: 8,
    source: 'openstates',
  });

  return signals.map((signal) => {
    const result: StateIssueSignal = {
      issue: signal.issue,
      mentions: signal.mentions,
    };

    if (signal.latestAction) {
      result.latestAction = signal.latestAction;
    }

    if (signal.source) {
      result.source = signal.source;
    }

    if (typeof signal.mentions === 'number') {
      result.weight = Math.min(1, signal.mentions / 5);
    }

    return result;
  });
}

function buildSocialLookup(
  canonical: CanonicalRepresentative,
): Record<string, string> {
  const social: Record<string, string> = {};
  for (const profile of canonical.social) {
    const key = profile.platform.toLowerCase();
    if (profile.url) {
      social[key] = profile.url;
    } else if (profile.handle) {
      social[key] = profile.handle;
    }
  }
  return social;
}

function buildContactSnapshot(
  canonical: CanonicalRepresentative,
): {
  emails: string[];
  phones: string[];
  links: string[];
} {
  return {
    emails: [...canonical.emails],
    phones: [...canonical.phones],
    links: [...canonical.links],
  };
}

/**
 * Derive OpenStates bills API jurisdiction filter from a canonical representative.
 * Used when fetching bills for activity sync and state enrichment. Export for reuse.
 */
export function deriveJurisdictionFilter(canonical: CanonicalRepresentative): string | undefined {
  const primaryRole = canonical.currentRoles[0];
  const jurisdiction = primaryRole?.jurisdiction ?? null;
  if (jurisdiction) {
    return jurisdiction;
  }

  if (canonical.state) {
    return `ocd-jurisdiction/country:us/state:${canonical.state.toLowerCase()}`;
  }

  return undefined;
}


