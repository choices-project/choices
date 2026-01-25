import { getSupabaseClient } from '../clients/supabase.js';
import type { DataQualityScore } from '../utils/data-quality.js';

type FinanceStatus = 'updated' | 'no-data';

const roundToTwo = (value: number): number =>
  Math.round(value * 100) / 100;

const DEFAULT_SOURCE_RELIABILITY = 0.75;
const UPDATED_SOURCE_RELIABILITY = 0.9;
const NO_DATA_SOURCE_RELIABILITY = 0.6;

function deriveSourceReliability(status: FinanceStatus): number {
  if (status === 'updated') {
    return UPDATED_SOURCE_RELIABILITY;
  }
  return NO_DATA_SOURCE_RELIABILITY;
}

function mergeValidationMethod(
  existing: string | null | undefined,
  addition: string,
): string {
  if (!existing || existing.trim().length === 0) {
    return addition;
  }
  if (existing.includes(addition)) {
    return existing;
  }
  return `${existing},${addition}`;
}

export async function upsertFinanceDataQuality(params: {
  representativeId: number;
  score: DataQualityScore;
  status: FinanceStatus;
}): Promise<void> {
  const { representativeId, score, status } = params;
  if (!representativeId) return;

  const client = getSupabaseClient();
  const timestamp = new Date().toISOString();

  const existingResponse = await client
    .from('representative_data_quality')
    .select(
      'data_completeness,overall_confidence,primary_source_score,secondary_source_score,source_reliability,validation_method',
    )
    .eq('representative_id', representativeId)
    .maybeSingle();

  if (existingResponse.error && existingResponse.error.code !== 'PGRST116') {
    throw new Error(
      `Failed to read representative_data_quality for ${representativeId}: ${existingResponse.error.message}`,
    );
  }

  const existing = existingResponse.data ?? null;

  const completeness = roundToTwo(
    Math.max(existing?.data_completeness ?? 0, score.completeness),
  );
  const overallConfidence = roundToTwo(
    Math.max(existing?.overall_confidence ?? 0, score.overall),
  );
  const primaryScore = roundToTwo(
    Math.max(existing?.primary_source_score ?? 0, score.freshness),
  );
  const secondaryScore = roundToTwo(existing?.secondary_source_score ?? 0);
  const sourceReliability = roundToTwo(
    Math.max(
      existing?.source_reliability ?? DEFAULT_SOURCE_RELIABILITY,
      deriveSourceReliability(status),
    ),
  );
  const validationMethod = mergeValidationMethod(
    existing?.validation_method,
    'finance_enrichment',
  );

  const { error: upsertError } = await client
    .from('representative_data_quality')
    .upsert(
      {
        representative_id: representativeId,
        data_completeness: completeness,
        overall_confidence: overallConfidence,
        primary_source_score: primaryScore,
        secondary_source_score: secondaryScore,
        source_reliability: sourceReliability,
        validation_method: validationMethod,
        last_validated: timestamp,
        updated_at: timestamp,
      },
      { onConflict: 'representative_id' },
    );

  if (upsertError) {
    throw new Error(
      `Failed to upsert representative_data_quality for ${representativeId}: ${upsertError.message}`,
    );
  }
}


