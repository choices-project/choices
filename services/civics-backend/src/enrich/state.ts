import type { CanonicalRepresentative } from '../ingest/openstates/people.js';

export interface StateEnrichment {
  issues: Array<{ issue: string; weight?: number }>;
  social: Record<string, string>;
  sources: Record<string, string[]>;
}

export async function enrichStateRepresentative(
  canonical: CanonicalRepresentative,
): Promise<StateEnrichment> {
  void canonical;
  return {
    issues: [],
    social: {},
    sources: {},
  };
}

