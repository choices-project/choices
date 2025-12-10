export type RaceContext = {
  jurisdiction: string;
  stateCode?: string;
  district?: string;
  office?: string;
};

export type KeyIssueSignal = {
  issue: string;
  mentions: number;
  latestAction?: string;
  source?: string;
};

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

export type ActivityRecord = {
  id: string;
  type: 'vote' | 'statement' | 'event';
  title: string;
  description: string;
  date: string;
  source: string;
};

export type ActiveCampaignData = {
  source: string;
  fetchedAt: string;
  cycle: number | null;
  candidates: CampaignCandidateSummary[];
  recentActivity: ActivityRecord[];
  constituentQuestions: number;
  candidateResponses: number;
};

export type OpenStatesLikeBill = {
  title?: string;
  subjects?: string[];
  actions?: Array<{ date?: string }>;
  updated_at?: string;
  latest_action?: string;
};

export type LocationLike = {
  address?: string;
  city?: string;
  stateCode?: string;
  zipCode?: string;
  coordinates?: { lat: number; lng: number };
};

export function extractDivisionMetadata(divisionId?: string, fallbackState?: string): RaceContext;

export function determineRaceImportance(
  electionName: string,
  jurisdiction: string,
): 'high' | 'medium' | 'low';

export function estimateDeadline(dateString: string, offsetDays: number): string;

export function buildLookupAddress(location: LocationLike | null | undefined): string | null;

export function deriveSubjectsFromTitle(title: string): string[];

export function getMostRecentActionDate(bill: OpenStatesLikeBill | null | undefined): string | undefined;

export function deriveKeyIssuesFromBills(
  bills: Array<OpenStatesLikeBill | null | undefined>,
  options?: { limit?: number; source?: string },
): KeyIssueSignal[];

export function determineOfficeCode(officeName?: string | null): 'H' | 'S' | 'P' | null;

export function normalizeDistrict(district?: string | null): string | undefined;

export function getCurrentFecCycle(referenceDate?: Date): number;

export function calculateCashOnHand(finance: { totalRaised?: number | null; totalSpent?: number | null } | null): number | null;

export function formatCurrency(value: number | null | undefined): string;

export function describeFinanceSummary(
  summary: { totalRaised?: number | null; totalSpent?: number | null; smallDonorPercentage?: number | null },
  cycle: number,
): string;

export function resolveLastFilingDate(
  finance: { lastUpdated?: string } | null | undefined,
  candidate: { last_file_date?: string | null; last_f2_date?: string | null } | null | undefined,
): string | null;

export function buildCampaignActivity(
  candidates: ReadonlyArray<CampaignCandidateSummary | null | undefined>,
  cycle: number,
  now?: Date,
): ActivityRecord[];

export function createCampaignDataFallback(raceId?: string | null, now?: Date): ActiveCampaignData;

