import { getSupabaseClient } from '../clients/supabase.js';
import type { CanonicalRepresentative } from '../ingest/openstates/people.js';

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

type DataSourceValidationStatus = 'synced' | 'pending' | 'error';

interface DataSourceRawData {
  tokens: string[];
  labels: string[];
  base_name: string;
}

interface DataSourceInsertRow {
  representative_id: number;
  source_name: string;
  source_type: string;
  confidence: ConfidenceLevel;
  validation_status: DataSourceValidationStatus | null;
  last_updated: string | null;
  updated_at: string;
  raw_data: DataSourceRawData | null;
}

const SOURCE_LOOKUP: Array<{
  matcher: (token: string) => boolean;
  name: (token: string) => string;
  type: string;
  confidence?: ConfidenceLevel;
}> = [
  {
    matcher: (token) => token === 'openstates_yaml',
    name: () => 'OpenStates People YAML',
    type: 'primary',
    confidence: 'high',
  },
  {
    matcher: (token) => token.startsWith('supabase:'),
    name: (token) => `Supabase ${token.split(':')[1] ?? 'unknown'}`,
    type: 'internal',
    confidence: 'high',
  },
  {
    matcher: (token) => token.startsWith('crosswalk:'),
    name: (token) => `Crosswalk ${token.split(':')[1] ?? 'unknown'}`,
    type: 'crosswalk',
    confidence: 'medium',
  },
  {
    matcher: (token) => token === 'fec',
    name: () => 'FEC API',
    type: 'finance',
    confidence: 'medium',
  },
  {
    matcher: (token) => token === 'google-civic',
    name: () => 'Google Civic API',
    type: 'lookup',
    confidence: 'medium',
  },
  {
    matcher: (token) => token === 'bioguide',
    name: () => 'Bioguide',
    type: 'identifier',
    confidence: 'high',
  },
  {
    matcher: (token) => token === 'ballotpedia',
    name: () => 'Ballotpedia',
    type: 'secondary',
    confidence: 'medium',
  },
  {
    matcher: (token) => token === 'wikipedia',
    name: () => 'Wikipedia',
    type: 'secondary',
    confidence: 'low',
  },
];

const CONFIDENCE_ORDER: Record<ConfidenceLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
  unknown: 0,
};

function mergeConfidence(a: ConfidenceLevel, b: ConfidenceLevel): ConfidenceLevel {
  return CONFIDENCE_ORDER[a] >= CONFIDENCE_ORDER[b] ? a : b;
}

function truncateSourceName(value: string, limit = 50): string {
  if (value.length <= limit) return value;
  if (limit <= 3) return value.slice(0, limit);
  return `${value.slice(0, limit - 3)}...`;
}

function lookupSource(token: string): { source_name: string; source_type: string; confidence: ConfidenceLevel } {
  const match = SOURCE_LOOKUP.find((entry) => entry.matcher(token));
  if (match) {
    return {
      source_name: match.name(token),
      source_type: match.type,
      confidence: match.confidence ?? 'unknown',
    };
  }

  if (token.includes(':')) {
    const [prefix] = token.split(':');
    const safePrefix = prefix ?? 'unknown';
    return {
      source_name: `${safePrefix.toUpperCase()} source`,
      source_type: safePrefix,
      confidence: 'unknown',
    };
  }

  return {
    source_name: token,
    source_type: 'unknown',
    confidence: 'unknown',
  };
}

function buildDataSourceRows(rep: CanonicalRepresentative): DataSourceInsertRow[] {
  const representativeId = rep.supabaseRepresentativeId;
  if (!representativeId) return [];

  const timestamp = new Date().toISOString();
  const seen = new Set<string>();
  const bucket = new Map<string, DataSourceInsertRow & { base_name: string; tokens: string[] }>();

  for (const token of rep.sources) {
    const key = token.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const lookup = lookupSource(key);
    const existing = bucket.get(lookup.source_type);

    if (existing) {
      const updatedTokens = [...existing.tokens, token];
      const currentRawData: DataSourceRawData = existing.raw_data ?? {
        tokens: [],
        labels: [],
        base_name: existing.base_name,
      };
      const existingLabels =
        currentRawData.labels.length > 0 ? currentRawData.labels : [existing.base_name];
      const updatedLabels = [...new Set([...existingLabels, lookup.source_name])];

      existing.confidence = mergeConfidence(existing.confidence, lookup.confidence);
      existing.tokens = updatedTokens;
      existing.raw_data = {
        tokens: updatedTokens,
        labels: updatedLabels,
        base_name: existing.base_name,
      };
      existing.last_updated = timestamp;
      existing.updated_at = timestamp;
      const extraCount = updatedTokens.length - 1;
      const label = extraCount > 0 ? `${existing.base_name} (+${extraCount})` : existing.base_name;
      existing.source_name = truncateSourceName(label);
    } else {
      bucket.set(lookup.source_type, {
        representative_id: representativeId,
        source_name: truncateSourceName(lookup.source_name),
        source_type: lookup.source_type,
        confidence: lookup.confidence,
        validation_status: 'synced',
        last_updated: timestamp,
        updated_at: timestamp,
        raw_data: {
          tokens: [token],
          labels: [lookup.source_name],
          base_name: lookup.source_name,
        },
        base_name: lookup.source_name,
        tokens: [token],
      });
    }
  }

  return Array.from(bucket.values()).map(({ base_name: _base, tokens: _tokens, ...row }) => row);
}

export async function syncRepresentativeDataSources(rep: CanonicalRepresentative): Promise<void> {
  const representativeId = rep.supabaseRepresentativeId;
  if (!representativeId) {
    return;
  }

  const rows = buildDataSourceRows(rep);
  const client = getSupabaseClient();

  const { error: deleteError } = await client
    .from('representative_data_sources')
    .delete()
    .eq('representative_id', representativeId);

  if (deleteError) {
    throw new Error(
      `Failed to prune data sources for representative ${representativeId}: ${deleteError.message}`,
    );
  }

  if (rows.length === 0) {
    return;
  }

  const { error: insertError } = await client.from('representative_data_sources').insert(rows);
  if (insertError) {
    throw new Error(
      `Failed to upsert data sources for representative ${representativeId}: ${insertError.message}`,
    );
  }
}

