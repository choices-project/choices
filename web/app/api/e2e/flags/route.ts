/**
 * E2E Feature Flags API
 * 
 * Guarded API route for setting feature flags during E2E testing.
 * Only accessible when ALLOW_E2E_FLAG_WRITE=true environment variable is set.
 * 
 * Created: 2024-12-19
 * Updated: 2024-12-19
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFeatureFlags, setFeatureFlags } from '@/lib/core/feature-flags';

// Guard: Only allow in E2E testing environment
const isE2EAllowed = process.env.ALLOW_E2E_FLAG_WRITE === 'true';

export async function GET() {
  if (!isE2EAllowed) {
    return NextResponse.json(
      { error: 'E2E flag modification not allowed in this environment' },
      { status: 403 }
    );
  }

  try {
    const flags = await getFeatureFlags();
    return NextResponse.json({ flags });
  } catch (error) {
    console.error('Error getting feature flags:', error);
    return NextResponse.json(
      { error: 'Failed to get feature flags' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isE2EAllowed) {
    return NextResponse.json(
      { error: 'E2E flag modification not allowed in this environment' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { flags, project } = body;

    if (!flags || typeof flags !== 'object') {
      return NextResponse.json(
        { error: 'Invalid flags object provided' },
        { status: 400 }
      );
    }

    // Set the feature flags
    await setFeatureFlags(flags);

    console.log(`E2E: Feature flags updated for project: ${project || 'unknown'}`, flags);

    return NextResponse.json({ 
      success: true, 
      flags,
      project: project || 'unknown'
    });
  } catch (error) {
    console.error('Error setting feature flags:', error);
    return NextResponse.json(
      { error: 'Failed to set feature flags' },
      { status: 500 }
    );
  }
}
