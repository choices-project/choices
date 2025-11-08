import type { CanonicalRepresentative } from '../ingest/openstates/people.js';
import { enrichFederalRepresentative } from '../enrich/federal.js';
import { enrichStateRepresentative } from '../enrich/state.js';
import { evaluateDataQuality } from '../utils/data-quality.js';

export interface UnifiedRepresentative {
  canonical: CanonicalRepresentative;
  federal: Awaited<ReturnType<typeof enrichFederalRepresentative>> | null;
  state: Awaited<ReturnType<typeof enrichStateRepresentative>> | null;
  quality: ReturnType<typeof evaluateDataQuality>;
}

export async function buildUnifiedRepresentative(
  canonical: CanonicalRepresentative,
): Promise<UnifiedRepresentative> {
  const [federal, state] = await Promise.all([
    enrichFederalRepresentative(canonical),
    enrichStateRepresentative(canonical),
  ]);

  const quality = evaluateDataQuality({ canonical, federal });

  return {
    canonical,
    federal,
    state,
    quality,
  };
}

