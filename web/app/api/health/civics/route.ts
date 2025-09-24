/**
 * Civics Health Check API Endpoint
 * Feature Flag: CIVICS_ADDRESS_LOOKUP (disabled by default)
 * 
 * This endpoint provides health status for the civics system
 */

import { NextResponse } from 'next/server';
import { isCivicsEnabled } from '@/lib/civics/privacy-utils';

export async function GET() {
  const issues: string[] = [];
  let status = 'healthy';

  try {
    const isEnabled = isCivicsEnabled();
    
    // Check feature flag
    if (!isEnabled) {
      return NextResponse.json({ 
        status: 'disabled', 
        message: 'Civics feature is disabled.',
        issues: ['Feature flag disabled']
      }, { status: 200 });
    }

    // Note: Using existing feature flag system instead of environment variable

    // Check PRIVACY_PEPPER
    if (!process.env.PRIVACY_PEPPER) {
      issues.push('PRIVACY_PEPPER is not set');
      status = 'error';
    }

    // Check Google Civic API key
    if (!process.env.GOOGLE_CIVIC_API_KEY) {
      issues.push('GOOGLE_CIVIC_API_KEY is not set');
      status = 'warning';
    }

    // TODO: Add actual health checks when feature is implemented
    // - Database connectivity
    // - Privacy compliance check
    // - API dependencies (Google Civic, etc.)
    
    const healthStatus = {
      feature_enabled: isEnabled,
      status,
      message: status === 'healthy' ? 'Civics system is healthy' : 'Civics system has issues',
      timestamp: new Date().toISOString(),
      issues: issues.length > 0 ? issues : undefined,
      checks: {
        feature_flag: isEnabled,
        environment_variables: {
          PRIVACY_PEPPER: !!process.env.PRIVACY_PEPPER,
          GOOGLE_CIVIC_API_KEY: !!process.env.GOOGLE_CIVIC_API_KEY
        },
        // TODO: Add more checks when implemented
        database: isEnabled ? 'not_implemented' : 'disabled',
        privacy_compliance: isEnabled ? 'not_implemented' : 'disabled',
        external_apis: isEnabled ? 'not_implemented' : 'disabled'
      }
    };

    const statusCode = status === 'error' ? 500 : status === 'warning' ? 200 : 200;
    
    return NextResponse.json(healthStatus, { status: statusCode });

  } catch (error) {
    console.error('Civics health check error:', error);
    return NextResponse.json(
      { 
        feature_enabled: false,
        status: 'error',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
        issues: ['Health check failed']
      }, 
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' }, 
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' }, 
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' }, 
    { status: 405 }
  );
}
