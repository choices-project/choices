declare module '@choices/civics-shared' {
  export type CampaignCandidateSummary = {
    candidateId: string;
    name: string;
    party?: string | null;
    status?: string | null;
    incumbentStatus?: string | null;
    totalRaised?: number | null;
    totalSpent?: number | null;
    cashOnHand?: number | null;
    smallDonorPercentage?: number | null;
    lastFilingDate?: string | null;
    finance?: unknown;
  };

  export type ActiveCampaignData = {
    source: string;
    fetchedAt: string;
    cycle: number;
    candidates?: CampaignCandidateSummary[];
    recentActivity?: unknown;
    constituentQuestions?: number;
    candidateResponses?: number;
  };

  export type RaceContext = {
    jurisdiction: string;
    stateCode?: string;
    district?: string;
    office?: string;
  };

  export function extractDivisionMetadata(
    divisionId: string | undefined,
    fallbackState?: string,
  ): {
    stateCode?: string;
    district?: string;
    jurisdiction: string;
  };

  export function determineRaceImportance(
    electionName: string,
    jurisdiction: string,
  ): 'high' | 'medium' | 'low';

  export function estimateDeadline(electionDate: string, offsetDays: number): string;

  export function buildLookupAddress(location: unknown): string | null;

  export function deriveKeyIssuesFromBills(
    bills: unknown[],
    options: { source: string; limit?: number },
  ): Array<{ issue: string; mentions: number; source?: string; latestAction?: string }>;

  export function determineOfficeCode(office: string | undefined): string | undefined;

  export function normalizeDistrict(district: string | undefined): string | undefined;

  export function getCurrentFecCycle(): number;

  export function calculateCashOnHand(finance: unknown): number | null;

  export function resolveLastFilingDate(finance: unknown, candidate: unknown): string | null;

  export function buildCampaignActivity(
    candidates: CampaignCandidateSummary[],
    cycle: number,
  ): unknown;

  export function createCampaignDataFallback(raceId: string): ActiveCampaignData;
}


