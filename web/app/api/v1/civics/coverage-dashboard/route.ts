import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, errorResponse, rateLimitError } from '@/lib/api';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Get client IP address from request headers
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIP = forwarded.split(',')[0];
    if (firstIP) {
      return firstIP.trim();
    }
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return request.ip ?? 'unknown';
}

type RepresentativeData = {
  level: string;
  source: string;
  jurisdiction: string;
  last_updated: string;
};

type CoverageData = {
  level: string;
  source: string;
  count: number;
  last_updated: string;
};

type FreshnessData = {
  total: number;
  fresh: number;
  stale: number;
};

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Rate limiting: 30 requests per 5 minutes per IP (admin-like endpoint)
  const clientIP = getClientIP(request);
  const rateLimitResult = await apiRateLimiter.checkLimit(clientIP, '/api/v1/civics/coverage-dashboard', {
    maxRequests: 30,
    windowMs: 5 * 60 * 1000, // 5 minutes
  });

  if (!rateLimitResult.allowed) {
    logger.warn('Rate limit exceeded for civics coverage-dashboard', { ip: clientIP });
    return rateLimitError('Rate limit exceeded', rateLimitResult.retryAfter);
  }

  // Get Supabase client (uses anon key, RLS allows anonymous reads)
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  // Log coverage dashboard request for audit trail
  logger.info('Coverage dashboard requested', { userAgent: request.headers.get('user-agent') ?? 'unknown' });

    // Get coverage by source
    // Type assertion needed because civics tables may not be in generated Database type
    const { data: coverageData, error: coverageError } = await (supabase as any)
      .from('civics_representatives')
      .select('level, source, jurisdiction, last_updated')
      .eq('valid_to', 'infinity');

    if (coverageError) {
      return errorResponse('Failed to load coverage data', 502, { reason: coverageError.message });
    }

    // Calculate coverage by source
    const coverageBySource = (coverageData as RepresentativeData[] ?? []).reduce((acc: Record<string, CoverageData>, rep: RepresentativeData) => {
      const key = `${rep.level}-${rep.source}`;
      if (!acc[key]) {
        acc[key] = { level: rep.level, source: rep.source, count: 0, last_updated: rep.last_updated };
      }
      acc[key].count++;
      return acc;
    }, {});

    // Calculate freshness by level
    const now = new Date();
    const freshnessByLevel = (coverageData as RepresentativeData[] ?? []).reduce((acc: Record<string, FreshnessData>, rep: RepresentativeData) => {
      if (!rep.level) return acc; // Skip if level is undefined

      if (!acc[rep.level]) {
        acc[rep.level] = { total: 0, fresh: 0, stale: 0 };
      }
      const levelStats = acc[rep.level];
      if (!levelStats) return acc;
      levelStats.total++;

      const lastUpdated = new Date(rep.last_updated);
      const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

      // Freshness thresholds
      const thresholds = { federal: 7, state: 14, local: 30 };
      const threshold = thresholds[rep.level as keyof typeof thresholds] ?? 30;

      if (daysSinceUpdate <= threshold) {
        levelStats.fresh++;
      } else {
        levelStats.stale++;
      }

      return acc;
    }, {});

    // Calculate FEC mapping rate
    // Type assertion needed because civics tables may not be in generated Database type
    const { error: fecError, count: fecCount } = await (supabase as any)
      .from('civics_fec_minimal')
      .select('person_id', { count: 'exact', head: true });
    if (fecError) {
      return errorResponse('Failed to load FEC mapping stats', 502, { reason: fecError.message });
    }

    const { error: federalError, count: federalCount } = await (supabase as any)
      .from('civics_representatives')
      .select('id', { count: 'exact', head: true })
      .eq('level', 'federal')
      .eq('valid_to', 'infinity');
    if (federalError) {
      return errorResponse('Failed to load federal representative counts', 502, { reason: federalError.message });
    }

    const fecMappingRate = (federalCount && federalCount > 0)
      ? (((fecCount ?? 0) / federalCount) * 100)
      : 0;

    // Calculate contact enrichment rate
    const { error: contactError, count: contactCount } = await (supabase as any)
      .from('civics_representatives')
      .select('id', { count: 'exact', head: true })
      .eq('level', 'federal')
      .eq('valid_to', 'infinity')
      .not('contact', 'is', null);
    if (contactError) {
      return errorResponse('Failed to load contact enrichment stats', 502, { reason: contactError.message });
    }

    const contactEnrichmentRate = (federalCount && federalCount > 0)
      ? (((contactCount ?? 0) / federalCount) * 100)
      : 0;

    const dashboard = {
      timestamp: now.toISOString(),
      coverage: {
        by_source: Object.values(coverageBySource),
        total_representatives: (coverageData as RepresentativeData[] | null)?.length ?? 0
      },
      freshness: {
        by_level: Object.entries(freshnessByLevel).map(([level, data]: [string, any]) => ({
          level,
          total: data.total,
          fresh: data.fresh,
          stale: data.stale,
          freshness_rate: Math.round((data.fresh / data.total) * 100)
        }))
      },
      enrichment: {
        fec_mapping_rate: Math.round(fecMappingRate * 100) / 100,
        contact_enrichment_rate: Math.round(contactEnrichmentRate * 100) / 100,
        fec_records: fecCount ?? 0,
        federal_representatives: federalCount ?? 0
      },
      slas: {
        federal_freshness_days: 7,
        state_freshness_days: 14,
        local_freshness_days: 30,
        fec_mapping_threshold: 90,
        contact_enrichment_threshold: 90
      },
      alerts: {
        freshness_breach: Object.values(freshnessByLevel).some((data: FreshnessData) =>
          data.stale > 0
        ),
        fec_mapping_low: fecMappingRate < 90,
        contact_enrichment_low: contactEnrichmentRate < 90
      }
    };

  const response = successResponse(dashboard);
  response.headers.set('ETag', `"dashboard-${Date.now()}"`);
  response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');

  return response;
});
