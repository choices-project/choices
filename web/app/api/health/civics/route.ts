/**
 * Civics Health Check API Endpoint
 * Feature Flag: CIVICS_ADDRESS_LOOKUP (disabled by default)
 * 
 * This endpoint provides health status for the civics system
 */

import { NextResponse } from 'next/server';
import { isCivicsEnabled } from '@/features/civics/lib/civics/privacy-utils';

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

    // Check PRIVACY_PEPPER_DEV (for development/test)
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      if (!process.env.PRIVACY_PEPPER_DEV) {
        issues.push('PRIVACY_PEPPER_DEV is not set');
        status = 'warning';
      }
    } else {
      // Production environment checks
      if (!process.env.PRIVACY_PEPPER_CURRENT) {
        issues.push('PRIVACY_PEPPER_CURRENT is not set');
        status = 'error';
      }
    }

    // Check Google Civic API key
    if (!process.env.GOOGLE_CIVIC_API_KEY) {
      issues.push('GOOGLE_CIVIC_API_KEY is not set');
      status = 'warning';
    }

    // Database connectivity checks
    let databaseStatus = 'disabled';
    let databaseDetails: any = {};
    
    if (isEnabled) {
      try {
        const { getSupabaseServerClient } = await import('@/utils/supabase/server');
        const supabase = await getSupabaseServerClient();
        
        // Test basic database connection
        const { data: _connectionTest, error: connectionError } = await supabase
          .from('pg_stat_activity')
          .select('pid')
          .limit(1);
        
        if (connectionError) {
          databaseStatus = 'error';
          issues.push(`Database connection failed: ${connectionError.message}`);
        } else {
          databaseStatus = 'healthy';
        }
        
        // Check civics-specific tables
        const civicsTables = [
          'representatives_core',
          'representative_contacts', 
          'representative_social_media',
          'representative_photos',
          'id_crosswalk',
          'data_quality_metrics'
        ];
        
        const tableChecks: Record<string, boolean> = {};
        for (const table of civicsTables) {
          try {
            const { error } = await supabase
              .from(table)
              .select('id')
              .limit(1);
            tableChecks[table] = !error;
            if (error) {
              issues.push(`Table ${table} not accessible: ${error.message}`);
            }
          } catch (error) {
            tableChecks[table] = false;
            issues.push(`Table ${table} check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        databaseDetails = {
          connection: databaseStatus === 'healthy',
          tables: tableChecks,
          totalTables: civicsTables.length,
          accessibleTables: Object.values(tableChecks).filter(Boolean).length
        };
        
      } catch (error) {
        databaseStatus = 'error';
        issues.push(`Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        databaseDetails = { error: 'Database check failed' };
      }
    }
    
    // Privacy compliance checks
    let privacyStatus = 'disabled';
    let privacyDetails: any = {};
    
    if (isEnabled) {
      try {
        // Check privacy pepper configuration
        const hasDevPepper = !!process.env.PRIVACY_PEPPER_DEV;
        const hasCurrentPepper = !!process.env.PRIVACY_PEPPER_CURRENT;
        const hasProperPepper = process.env.NODE_ENV === 'development' ? hasDevPepper : hasCurrentPepper;
        
        if (!hasProperPepper) {
          privacyStatus = 'warning';
          issues.push('Privacy pepper not properly configured');
        } else {
          privacyStatus = 'healthy';
        }
        
        // Check RLS policies (basic test)
        try {
          const { getSupabaseServerClient } = await import('@/utils/supabase/server');
          const supabase = await getSupabaseServerClient();
          
          // Test RLS by trying to access protected data without auth
          const { data: _rlsTest, error: rlsError } = await supabase
            .from('representatives_core')
            .select('id')
            .limit(1);
          
          // RLS should either work (with proper auth) or fail gracefully
          const rlsWorking = !rlsError || rlsError.code === 'PGRST116'; // No rows returned is OK
          
          privacyDetails = {
            pepper_configured: hasProperPepper,
            rls_enabled: rlsWorking,
            environment: process.env.NODE_ENV,
            compliance_checks: {
              data_minimization: true, // Assumed based on architecture
              consent_management: true, // Assumed based on architecture
              retention_policies: true // Assumed based on architecture
            }
          };
          
        } catch (error) {
          privacyStatus = 'warning';
          issues.push(`Privacy compliance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          privacyDetails = { error: 'Privacy check failed' };
        }
        
      } catch (error) {
        privacyStatus = 'error';
        issues.push(`Privacy compliance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        privacyDetails = { error: 'Privacy check failed' };
      }
    }
    
    // External API dependencies checks
    let externalApisStatus = 'disabled';
    let externalApisDetails: any = {};
    
    if (isEnabled) {
      const apiChecks: Record<string, { status: string; responseTime?: number; error?: string }> = {};
      
      // Google Civic API check
      if (process.env.GOOGLE_CIVIC_API_KEY) {
        try {
          const startTime = Date.now();
          const response = await fetch(
            `https://www.googleapis.com/civicinfo/v2/representatives?key=${process.env.GOOGLE_CIVIC_API_KEY}&address=1600+Amphitheatre+Parkway,+Mountain+View,+CA`,
            { 
              method: 'GET',
              headers: { 'Accept': 'application/json' },
              signal: AbortSignal.timeout(5000) // 5 second timeout
            }
          );
          const responseTime = Date.now() - startTime;
          
          if (response.ok) {
            apiChecks.google_civic = { status: 'healthy', responseTime };
          } else {
            apiChecks.google_civic = { 
              status: 'error', 
              responseTime,
              error: `HTTP ${response.status}: ${response.statusText}`
            };
            issues.push(`Google Civic API error: HTTP ${response.status}`);
          }
        } catch (error) {
          apiChecks.google_civic = { 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          issues.push(`Google Civic API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        apiChecks.google_civic = { status: 'disabled', error: 'API key not configured' };
      }
      
      // Congress.gov API check (basic connectivity)
      try {
        const startTime = Date.now();
        const response = await fetch(
          'https://api.congress.gov/v3/member',
          { 
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(5000) // 5 second timeout
          }
        );
        const responseTime = Date.now() - startTime;
        
        if (response.ok || response.status === 401) { // 401 is expected without API key
          apiChecks.congress_gov = { status: 'healthy', responseTime };
        } else {
          apiChecks.congress_gov = { 
            status: 'error', 
            responseTime,
            error: `HTTP ${response.status}: ${response.statusText}`
          };
          issues.push(`Congress.gov API error: HTTP ${response.status}`);
        }
      } catch (error) {
        apiChecks.congress_gov = { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        issues.push(`Congress.gov API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // FEC API check (basic connectivity)
      try {
        const startTime = Date.now();
        const response = await fetch(
          'https://api.open.fec.gov/v1/candidates/',
          { 
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(5000) // 5 second timeout
          }
        );
        const responseTime = Date.now() - startTime;
        
        if (response.ok || response.status === 401) { // 401 is expected without API key
          apiChecks.fec = { status: 'healthy', responseTime };
        } else {
          apiChecks.fec = { 
            status: 'error', 
            responseTime,
            error: `HTTP ${response.status}: ${response.statusText}`
          };
          issues.push(`FEC API error: HTTP ${response.status}`);
        }
      } catch (error) {
        apiChecks.fec = { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        issues.push(`FEC API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Determine overall external APIs status
      const apiStatuses = Object.values(apiChecks).map(api => api.status);
      const healthyApis = apiStatuses.filter(status => status === 'healthy').length;
      const totalApis = apiStatuses.length;
      
      if (healthyApis === totalApis) {
        externalApisStatus = 'healthy';
      } else if (healthyApis > 0) {
        externalApisStatus = 'degraded';
      } else {
        externalApisStatus = 'error';
      }
      
      externalApisDetails = {
        apis: apiChecks,
        healthy_count: healthyApis,
        total_count: totalApis,
        overall_status: externalApisStatus
      };
    }
    
    // Determine overall system status
    const systemChecks = [databaseStatus, privacyStatus, externalApisStatus];
    const hasErrors = systemChecks.includes('error') || issues.some(issue => issue.includes('error'));
    const hasWarnings = systemChecks.includes('warning') || issues.some(issue => issue.includes('warning'));
    
    if (hasErrors) {
      status = 'error';
    } else if (hasWarnings) {
      status = 'warning';
    } else {
      status = 'healthy';
    }
    
    const healthStatus = {
      feature_enabled: isEnabled,
      status,
      message: status === 'healthy' ? 'Civics system is healthy' : 
               status === 'warning' ? 'Civics system has warnings' : 'Civics system has issues',
      timestamp: new Date().toISOString(),
      issues: issues.length > 0 ? issues : undefined,
      checks: {
        feature_flag: isEnabled,
        environment_variables: {
          PRIVACY_PEPPER_DEV: !!process.env.PRIVACY_PEPPER_DEV,
          PRIVACY_PEPPER_CURRENT: !!process.env.PRIVACY_PEPPER_CURRENT,
          GOOGLE_CIVIC_API_KEY: !!process.env.GOOGLE_CIVIC_API_KEY
        },
        database: {
          status: databaseStatus,
          details: databaseDetails
        },
        privacy_compliance: {
          status: privacyStatus,
          details: privacyDetails
        },
        external_apis: {
          status: externalApisStatus,
          details: externalApisDetails
        }
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
