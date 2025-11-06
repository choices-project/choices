/**
 * E2E Feature Flags API
 * 
 * Provides feature flags for E2E testing
 * Allows tests to check and modify feature flags
 * 
 * Created: January 18, 2025
 */

import { type NextRequest } from 'next/server';

import { withErrorHandling, successResponse, validationError } from '@/lib/api';
import { getAllFeatureFlags, setFeatureFlags } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandling(async () => {
  const flags = await getAllFeatureFlags();
  
  return successResponse({
    flags,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { flags } = body;
  
  if (!flags || typeof flags !== 'object') {
    return validationError({ flags: 'Invalid flags data' });
  }
  
  await setFeatureFlags(flags);
  
  return successResponse({
    flags: await getAllFeatureFlags(),
    timestamp: new Date().toISOString()
  }, undefined, 201);
});