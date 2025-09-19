/**
 * E2E Feature Flags API
 * 
 * Provides feature flags for E2E testing
 * Allows tests to check and modify feature flags
 * 
 * Created: January 18, 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllFeatureFlags, setFeatureFlags } from '@/lib/core/feature-flags';

export async function GET() {
  try {
    const flags = await getAllFeatureFlags();
    
    return NextResponse.json({
      flags,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Error getting feature flags:', error);
    return NextResponse.json(
      { error: 'Failed to get feature flags' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flags } = body;
    
    if (!flags || typeof flags !== 'object') {
      return NextResponse.json(
        { error: 'Invalid flags data' },
        { status: 400 }
      );
    }
    
    await setFeatureFlags(flags);
    
    return NextResponse.json({
      success: true,
      flags: await getAllFeatureFlags(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error setting feature flags:', error);
    return NextResponse.json(
      { error: 'Failed to set feature flags' },
      { status: 500 }
    );
  }
}