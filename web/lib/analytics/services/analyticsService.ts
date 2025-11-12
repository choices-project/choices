import type {
  DemographicsData,
  PollHeatmapEntry,
  PollHeatmapFilters,
  TemporalAnalyticsData,
  TrendDataPoint,
  TrustTierComparisonData,
} from '@/features/analytics/types/analytics';
import type { AnalyticsDashboard, AnalyticsEvent } from '@/lib/stores/analyticsStore';

type ServiceSuccess<T> = { success: true; data: T };
type ServiceFailure = { success: false; error: string };
export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

type SendAnalyticsPayload = {
  events: AnalyticsEvent[];
  sessionId: string;
  timestamp: string;
};

type GenerateReportParams = {
  startDate: string;
  endDate: string;
};

const EVENTS_ENDPOINT =
  '/api/analytics/unified/events?methods=comprehensive&ai-provider=rule-based';
const REPORT_ENDPOINT =
  '/api/analytics/unified/report?methods=comprehensive&ai-provider=rule-based';

const buildHttpError = (baseMessage: string, response: Response) =>
  response.statusText ? `${baseMessage}: ${response.statusText}` : baseMessage;

const buildUnknownError = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export async function sendAnalyticsEvents(
  payload: SendAnalyticsPayload,
): Promise<ServiceResult<void>> {
  try {
    const response = await fetch(EVENTS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { success: false, error: buildHttpError('Failed to send analytics data', response) };
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: buildUnknownError(error, 'Failed to send analytics data'),
    };
  }
}

export async function generateAnalyticsReport(
  params: GenerateReportParams,
): Promise<ServiceResult<AnalyticsDashboard>> {
  try {
    const response = await fetch(REPORT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      return {
        success: false,
        error: 'Failed to generate analytics report',
      };
    }

    const dashboard = (await response.json()) as AnalyticsDashboard;
    return { success: true, data: dashboard };
  } catch (error) {
    return {
      success: false,
      error: buildUnknownError(error, 'Failed to generate analytics report'),
    };
  }
}

export async function fetchAnalyticsDemographics(): Promise<ServiceResult<DemographicsData>> {
  try {
    const response = await fetch('/api/analytics/demographics');
    if (!response.ok) {
      return {
        success: false,
        error: buildHttpError('Failed to fetch demographics data', response),
      };
    }

    const result = (await response.json()) as DemographicsData;
    if (!result.ok) {
      return {
        success: false,
        error: 'Invalid demographics API response',
      };
    }

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: buildUnknownError(error, 'Failed to load demographics data'),
    };
  }
}

export async function fetchAnalyticsTrends(
  range: string,
): Promise<ServiceResult<TrendDataPoint[]>> {
  try {
    const params = new URLSearchParams({ range });
    const response = await fetch(`/api/analytics/trends?${params.toString()}`);

    if (!response.ok) {
      return {
        success: false,
        error: buildHttpError('Failed to fetch trends data', response),
      };
    }

    const result = (await response.json()) as { ok?: boolean; trends?: TrendDataPoint[] };
    if (!result.ok || !Array.isArray(result.trends)) {
      return {
        success: false,
        error: 'Invalid trends API response',
      };
    }

    return { success: true, data: result.trends ?? [] };
  } catch (error) {
    return {
      success: false,
      error: buildUnknownError(error, 'Failed to load trends data'),
    };
  }
}

export async function fetchAnalyticsTemporal(
  range: string,
): Promise<ServiceResult<TemporalAnalyticsData>> {
  try {
    const params = new URLSearchParams({ range });
    const response = await fetch(`/api/analytics/temporal?${params.toString()}`);

    if (!response.ok) {
      return {
        success: false,
        error: buildHttpError('Failed to fetch temporal analytics', response),
      };
    }

    const result = (await response.json()) as TemporalAnalyticsData;
    if (!result.ok) {
      return {
        success: false,
        error: 'Invalid temporal analytics response',
      };
    }

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: buildUnknownError(error, 'Failed to load temporal analytics'),
    };
  }
}

export async function fetchAnalyticsPollHeatmap(
  filters: PollHeatmapFilters,
): Promise<ServiceResult<PollHeatmapEntry[]>> {
  try {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'All Categories') {
      params.append('category', filters.category);
    }
    params.append('limit', String(filters.limit));

    const response = await fetch(`/api/analytics/poll-heatmap?${params.toString()}`);
    if (!response.ok) {
      return {
        success: false,
        error: buildHttpError('Failed to fetch poll heatmap', response),
      };
    }

    const result = (await response.json()) as { ok?: boolean; polls?: PollHeatmapEntry[] };
    if (!result.ok || !Array.isArray(result.polls)) {
      return {
        success: false,
        error: 'Invalid poll heatmap response',
      };
    }

    return { success: true, data: result.polls ?? [] };
  } catch (error) {
    return {
      success: false,
      error: buildUnknownError(error, 'Failed to load poll heatmap'),
    };
  }
}

export async function fetchAnalyticsTrustTiers(): Promise<ServiceResult<TrustTierComparisonData>> {
  try {
    const response = await fetch('/api/analytics/trust-tiers');
    if (!response.ok) {
      return {
        success: false,
        error: buildHttpError('Failed to fetch trust tier analytics', response),
      };
    }

    const result = (await response.json()) as TrustTierComparisonData;
    if (!result.ok) {
      return {
        success: false,
        error: 'Invalid trust tier analytics response',
      };
    }

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: buildUnknownError(error, 'Failed to load trust tier analytics'),
    };
  }
}

