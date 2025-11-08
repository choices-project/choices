const FEC_API_BASE = 'https://api.open.fec.gov/v1';

export interface FecTotals {
  candidate_id?: string;
  total_receipts?: number | null;
  total_disbursements?: number | null;
  cash_on_hand_end_period?: number | null;
  individual_unitemized_contributions?: number | null;
  individual_contributions?: number | null;
}

export interface FecContributor {
  employer?: string | null;
  total?: number | null;
  state?: string | null;
}

function getApiKey(): string {
  const key = process.env.FEC_API_KEY;
  if (!key) {
    throw new Error(
      'FEC_API_KEY is required to fetch campaign finance data. Add it to your environment before running the ingest.',
    );
  }
  return key;
}

export async function fetchCandidateTotals(candidateId: string, cycle: number): Promise<FecTotals | null> {
  const url = new URL(`${FEC_API_BASE}/candidate/${candidateId}/totals/`);
  url.searchParams.set('cycle', String(cycle));
  url.searchParams.set('per_page', '1');
  url.searchParams.set('api_key', getApiKey());

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `FEC totals request failed (${response.status}): ${await response.text()}`,
    );
  }

  const json = (await response.json()) as { results?: FecTotals[] };
  return json?.results?.[0] ?? null;
}

export async function fetchCandidateTopContributors(
  candidateId: string,
  cycle: number,
  limit = 5,
): Promise<FecContributor[]> {
  const url = new URL(`${FEC_API_BASE}/schedules/schedule_a/by_employer/`);
  url.searchParams.set('candidate_id', candidateId);
  url.searchParams.set('two_year_transaction_period', String(cycle));
  url.searchParams.set('per_page', String(limit));
  url.searchParams.set('sort', '-total');
  url.searchParams.set('api_key', getApiKey());

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `FEC top contributors request failed (${response.status}): ${await response.text()}`,
    );
  }

  const json = (await response.json()) as { results?: FecContributor[] };
  return json?.results ?? [];
}

