/** Max screenshot payload stored on the feedback row (data URLs can be large). */
const MAX_SCREENSHOT_CHARS = 750_000;

/**
 * Accept http(s) URLs and data:image/* URLs for the feedback.screenshot column.
 * Rejects invalid values instead of failing the whole submission.
 */
export function normalizeFeedbackScreenshot(
  raw: string | null | undefined,
): string | null {
  if (!raw || typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > MAX_SCREENSHOT_CHARS) {
    return null;
  }
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:image/')
  ) {
    return trimmed;
  }
  return null;
}
