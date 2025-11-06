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

import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse } from '@/lib/api';
import { featureFlagManager } from '@/lib/core/feature-flags';

export const GET = withErrorHandling(async (_request: NextRequest) => {
  // Get all feature flags
  const allFlags = featureFlagManager.getAllFlags();
  const enabledFlags = featureFlagManager.getEnabledFlags();
  const disabledFlags = featureFlagManager.getDisabledFlags();
  
  // Get system info
  const systemInfo = featureFlagManager.getSystemInfo();
  
  return successResponse({
    flags: allFlags,
    enabledFlags,
    disabledFlags,
    systemInfo
  });
});

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { flagId, enabled } = body;
    
    if (!flagId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request body. Expected { flagId: string, enabled: boolean }',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
    
    // Update the feature flag using the feature flag manager
    const success = enabled 
      ? featureFlagManager.enable(flagId)
      : featureFlagManager.disable(flagId);
    
    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to update feature flag: ${flagId}`,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Feature flag ${flagId} updated to ${enabled}`,
      flagId,
      enabled,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error updating feature flag:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update feature flag',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
