/**
 * Public Feature Flags API
 *
 * Returns feature flags as Record<string, boolean> without authentication.
 * Use for client-side flag checks when admin-only GET is not appropriate.
 *
 * Created: February 2026
 * Status: ACTIVE
 */

import { withErrorHandling, successResponse } from '@/lib/api';
import { featureFlagManager } from '@/lib/core/feature-flags';

import type { NextRequest } from 'next/server';

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const allFlags = featureFlagManager.getAllFlags();
  const flags: Record<string, boolean> = Object.fromEntries(
    Array.from(allFlags.entries()).map(([id, flag]) => [id, flag.enabled])
  );

  return successResponse({ flags });
});
