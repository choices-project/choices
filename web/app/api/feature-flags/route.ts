/**
 * Feature Flags API Endpoint
 * 
 * Returns the current state of all feature flags
 * Used for E2E testing and debugging
 * 
 * Created: January 23, 2025
 * Updated: November 6, 2025 - Modernized
 * Status: ✅ ACTIVE
 */


import { withErrorHandling, successResponse, validationError, errorResponse } from '@/lib/api';
import { featureFlagManager } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const GET = withErrorHandling(async (_request: NextRequest) => {
  // Get all feature flags
  const allFlags = featureFlagManager.getAllFlags();
  const enabledFlags = featureFlagManager.getEnabledFlags();
  const disabledFlags = featureFlagManager.getDisabledFlags();
  
  // Get system info
  const systemInfo = featureFlagManager.getSystemInfo();
  
  return successResponse(
    {
      flags: allFlags,
      enabledFlags,
      disabledFlags,
      systemInfo
    },
    {
      enabledCount: enabledFlags.length,
      disabledCount: disabledFlags.length
    }
  );
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { flagId, enabled } = body ?? {};

  if (!flagId || typeof flagId !== 'string' || typeof enabled !== 'boolean') {
    return validationError({
      flagId: !flagId ? 'flagId is required' : '',
      enabled: typeof enabled !== 'boolean' ? 'enabled must be a boolean' : ''
    }, 'Invalid request body. Expected { flagId: string, enabled: boolean }');
  }

  const updated = enabled
    ? featureFlagManager.enable(flagId)
    : featureFlagManager.disable(flagId);

  if (!updated) {
    logger.warn('Failed to update feature flag', { flagId, enabled });
    return errorResponse(`Failed to update feature flag: ${flagId}`, 400);
  }

  return successResponse({
    flagId,
    enabled,
    flags: featureFlagManager.getAllFlags()
  });
});
