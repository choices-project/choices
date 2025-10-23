/**
 * Feature Flags API Endpoint
 * 
 * Returns the current state of all feature flags
 * Used for E2E testing and debugging
 * 
 * Created: January 23, 2025
 * Status: ✅ ACTIVE
 */

import { type NextRequest, NextResponse } from 'next/server';
import { featureFlagManager } from '@/lib/core/feature-flags';

export async function GET(request: NextRequest) {
  try {
    // Get all feature flags
    const allFlags = featureFlagManager.getAllFlags();
    const enabledFlags = featureFlagManager.getEnabledFlags();
    const disabledFlags = featureFlagManager.getDisabledFlags();
    
    // Get system info
    const systemInfo = featureFlagManager.getSystemInfo();
    
    return NextResponse.json({
      success: true,
      flags: allFlags,
      enabledFlags,
      disabledFlags,
      systemInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch feature flags',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

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
    console.error('Error updating feature flag:', error);
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
