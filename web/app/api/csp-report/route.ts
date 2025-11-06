/**
 * CSP Violation Reporting Endpoint
 * 
 * Collects Content Security Policy violation reports for security monitoring.
 * Violations are logged and can be stored in the database for analysis.
 * 
 * Privacy: No PII is logged. Only violation details and user-agent.
 * Security: Helps identify XSS attempts, unauthorized scripts, and policy gaps.
 * 
 * Created: 2025
 * Updated: November 5, 2025 - Production implementation
 */

import type { NextRequest} from 'next/server';

import { withErrorHandling, successResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

type CSPViolation = {
  'document-uri': string;
  'violated-directive': string;
  'effective-directive': string;
  'original-policy': string;
  'blocked-uri': string;
  'source-file'?: string;
  'line-number'?: number;
  'column-number'?: number;
  'status-code'?: number;
};

type CSPReport = {
  'csp-report': CSPViolation;
};

export const POST = withErrorHandling(async (request: NextRequest) => {
  const report: CSPReport = await request.json();
  const violation = report['csp-report'];
  
  if (!violation) {
    return successResponse({ status: 'invalid' });
  }

    // Extract metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      violatedDirective: violation['violated-directive'],
      blockedUri: violation['blocked-uri'],
      documentUri: violation['document-uri'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number']
    };
    
    // Log CSP violation (no PII)
    logger.error('CSP Violation Detected', metadata);
    
    // Store in database for security analysis
    try {
      const supabase = await getSupabaseServerClient();
      
      // Store in admin_activity_log for security tracking
      await supabase.from('admin_activity_log').insert({
        action: 'csp_violation',
        admin_id: '00000000-0000-0000-0000-000000000000', // System action
        details: {
          severity: getSeverity(violation),
          violation,
          ...metadata
        },
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      // Don't fail the request if DB storage fails
      logger.warn('Failed to store CSP violation in database', { error: dbError });
    }
    
    // If Sentry is configured, send to Sentry
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Sentry integration - would be implemented when Sentry is added to project
      logger.debug('CSP violation would be sent to Sentry if configured', {
        severity: getSeverity(violation),
        directive: violation['violated-directive']
      });
    }
    
  return successResponse({ status: 'received' });
});

/**
 * Determine severity of CSP violation
 * Critical: script-src, object-src
 * High: default-src, connect-src
 * Medium: style-src, img-src
 * Low: font-src, media-src
 */
function getSeverity(violation: CSPViolation): 'critical' | 'high' | 'medium' | 'low' {
  const directive = violation['violated-directive'] || violation['effective-directive'];
  
  if (directive.includes('script-src') || directive.includes('object-src')) {
    return 'critical'; // Potential XSS
  }
  
  if (directive.includes('default-src') || directive.includes('connect-src')) {
    return 'high'; // Unauthorized connections
  }
  
  if (directive.includes('style-src') || directive.includes('img-src')) {
    return 'medium'; // Asset violations
  }
  
  return 'low';
}

// Handle preflight requests for CORS
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
