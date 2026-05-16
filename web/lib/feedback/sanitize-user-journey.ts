type JsonRecord = Record<string, unknown>;

const MAX_ERRORS = 15;
const MAX_NETWORK_REQUESTS = 40;
const MAX_ACTIONS = 30;
const MAX_CONSOLE_LOGS = 40;

const isAbortMessage = (message: unknown): boolean => {
  if (typeof message !== 'string') return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes('signal is aborted') ||
    normalized.includes('aborterror') ||
    normalized.includes('the user aborted a request')
  );
};

/**
 * Trim noisy telemetry before persisting feedback (aborted fetches, oversized arrays).
 */
export function sanitizeUserJourneyForPersistence(
  userJourney: JsonRecord | null | undefined,
): JsonRecord {
  if (!userJourney || typeof userJourney !== 'object') {
    return {};
  }

  const next: JsonRecord = { ...userJourney };

  if (Array.isArray(next.errors)) {
    next.errors = next.errors
      .filter((entry) => {
        if (!entry || typeof entry !== 'object') return false;
        const message = (entry as JsonRecord).message;
        return !isAbortMessage(message);
      })
      .slice(-MAX_ERRORS);
  }

  if (Array.isArray(next.actionSequence)) {
    next.actionSequence = next.actionSequence.slice(-MAX_ACTIONS);
  }

  const performance = next.performanceMetrics;
  if (performance && typeof performance === 'object') {
    const metrics = { ...(performance as JsonRecord) };
    if (Array.isArray(metrics.networkRequests)) {
      const seen = new Set<string>();
      metrics.networkRequests = metrics.networkRequests
        .filter((entry) => {
          if (!entry || typeof entry !== 'object') return false;
          const url = String((entry as JsonRecord).url ?? '');
          const key = `${(entry as JsonRecord).method ?? 'GET'}:${url}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(-MAX_NETWORK_REQUESTS);
    }
    next.performanceMetrics = metrics;
  }

  if (Array.isArray(next.consoleLogs)) {
    next.consoleLogs = next.consoleLogs.slice(-MAX_CONSOLE_LOGS);
  }

  return next;
}
