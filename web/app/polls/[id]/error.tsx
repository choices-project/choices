/**
 * Error Boundary for Individual Poll Page
 * 
 * Prevents net::ERR_ABORTED by providing a fallback UI for unhandled errors.
 */

'use client';

export default function Error() {
  return <div data-testid="poll-error">Something went wrong.</div>;
}
