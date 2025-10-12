/**
 * Civics Coverage Dashboard API
 * 
 * Provides observability into the civics data system including:
 * - Data coverage by source and level
 * - Data freshness metrics
 * - FEC mapping rates
 * - System health indicators
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

import { createApiLogger } from '@/lib/utils/api-logger';
import { CivicsCache } from '@/lib/utils/civics-cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(_request: NextRequest) {
  const logger = createApiLogger('/api/civics/coverage-dashboard', 'GET');
  
  try {
    logger.info('Coverage dashboard requested');

    // Check cache first (coverage data changes slowly)
    const cachedData = CivicsCache.get('coverage-dashboard');
    if (cachedData) {
      logger.info('Returning cached coverage data');
      return NextResponse.json({
        success: true,
        data: cachedData,
        metadata: {
          source: 'cache',
          last_updated: new Date().toISOString(),
          data_quality_score: 95
        }
      });
    }

    // Get coverage by source
    const { data: coverageData, error: coverageError } = await supabase
      .from('civics_representatives')
      .select('level, source, jurisdiction, last_updated, data_quality_score')
      .eq('valid_to', 'infinity');

    if (coverageError) {
      throw coverageError;
    }

    // Calculate coverage by source
    const coverageBySource = (coverageData || []).reduce((acc: Record<string, any>, rep: any) => {
      const key = `${rep.level}-${rep.source}`;
      if (!acc[key]) {
        acc[key] = { 
          level: rep.level, 
          source: rep.source, 
          count: 0, 
          last_updated: rep.last_updated,
          avg_quality_score: 0,
          quality_scores: []
        };
      }
      acc[key].count++;
      acc[key].quality_scores.push(rep.data_quality_score || 0);
      acc[key].avg_quality_score = acc[key].quality_scores.reduce((a: number, b: number) => a + b, 0) / acc[key].quality_scores.length;
      return acc;
    }, {});

    // Calculate freshness by level
    const now = new Date();
    const freshnessByLevel = (coverageData || []).reduce((acc: Record<string, any>, rep: any) => {
      if (!acc[rep.level]) {
        acc[rep.level] = { total: 0, fresh: 0, stale: 0, very_stale: 0 };
      }
      acc[rep.level].total++;
      
      const lastUpdated = new Date(rep.last_updated);
      const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      
      // Freshness thresholds
      const thresholds = { federal: 7, state: 14, local: 30 };
      const threshold = thresholds[rep.level as keyof typeof thresholds] || 30;
      
      if (daysSinceUpdate <= threshold) {
        acc[rep.level].fresh++;
      } else if (daysSinceUpdate <= threshold * 2) {
        acc[rep.level].stale++;
      } else {
        acc[rep.level].very_stale++;
      }
      
      return acc;
    }, {});

    // Calculate FEC mapping rate
    const { error: _fecError, count: fecCount } = await supabase
      .from('civics_fec_minimal')
      .select('person_id', { count: 'exact', head: true });
    
    const { error: _federalError, count: federalCount } = await supabase
      .from('civics_representatives')
      .select('id', { count: 'exact', head: true })
      .eq('level', 'federal')
      .eq('valid_to', 'infinity');

    const fecMappingRate = federalCount && fecCount ? (fecCount / federalCount) * 100 : 0;

    // Calculate data quality metrics
    const qualityMetrics = (coverageData || []).reduce((acc: any, rep: any) => {
      const score = rep.data_quality_score || 0;
      if (!acc.total) acc.total = 0;
      if (!acc.high_quality) acc.high_quality = 0;
      if (!acc.medium_quality) acc.medium_quality = 0;
      if (!acc.low_quality) acc.low_quality = 0;
      
      acc.total++;
      if (score >= 80) acc.high_quality++;
      else if (score >= 60) acc.medium_quality++;
      else acc.low_quality++;
      
      return acc;
    }, {});

    // Calculate system health
    const systemHealth = {
      overall_health: 'good',
      data_freshness: 'good',
      coverage_completeness: 'good',
      quality_score: 'good'
    };

    // Determine overall health
    const stalePercentage = Object.values(freshnessByLevel).reduce((acc: number, level: any) => {
      return acc + (level.stale + level.very_stale) / level.total * 100;
    }, 0) / Object.keys(freshnessByLevel).length;

    if (stalePercentage > 30) systemHealth.data_freshness = 'warning';
    if (stalePercentage > 50) systemHealth.data_freshness = 'critical';

    const lowQualityPercentage = qualityMetrics.low_quality / qualityMetrics.total * 100;
    if (lowQualityPercentage > 20) systemHealth.quality_score = 'warning';
    if (lowQualityPercentage > 40) systemHealth.quality_score = 'critical';

    if (systemHealth.data_freshness === 'critical' || systemHealth.quality_score === 'critical') {
      systemHealth.overall_health = 'critical';
    } else if (systemHealth.data_freshness === 'warning' || systemHealth.quality_score === 'warning') {
      systemHealth.overall_health = 'warning';
    }

    const dashboardData = {
      summary: {
        total_representatives: coverageData?.length || 0,
        coverage_by_level: Object.keys(freshnessByLevel).reduce((acc: any, level: string) => {
          acc[level] = freshnessByLevel[level].total;
          return acc;
        }, {}),
        system_health: systemHealth,
        last_updated: new Date().toISOString()
      },
      coverage_by_source: Object.values(coverageBySource),
      freshness_by_level: freshnessByLevel,
      fec_mapping: {
        fec_count: fecCount || 0,
        federal_count: federalCount || 0,
        mapping_rate: Math.round(fecMappingRate * 100) / 100
      },
      data_quality: {
        total_records: qualityMetrics.total || 0,
        high_quality: qualityMetrics.high_quality || 0,
        medium_quality: qualityMetrics.medium_quality || 0,
        low_quality: qualityMetrics.low_quality || 0,
        average_quality_score: qualityMetrics.total ? 
          Math.round((qualityMetrics.high_quality * 90 + qualityMetrics.medium_quality * 70 + qualityMetrics.low_quality * 40) / qualityMetrics.total) : 0
      },
      recommendations: generateRecommendations(systemHealth, freshnessByLevel, qualityMetrics)
    };

    // Cache the dashboard data for 30 minutes
    CivicsCache.set('coverage-dashboard', dashboardData, 30 * 60 * 1000);

    logger.success('Coverage dashboard generated successfully', 200, { 
      totalRepresentatives: coverageData?.length || 0,
      systemHealth: systemHealth.overall_health
    });

    return NextResponse.json({
      success: true,
      data: dashboardData,
      metadata: {
        source: 'database',
        last_updated: new Date().toISOString(),
        data_quality_score: 95
      }
    });

  } catch (error) {
    logger.error('Coverage dashboard error', error as Error);
    return NextResponse.json({
      success: false,
      error: 'Coverage dashboard generation failed',
      metadata: {
        source: 'error',
        last_updated: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * Generate recommendations based on system health
 */
function generateRecommendations(systemHealth: any, _freshnessByLevel: any, _qualityMetrics: any): string[] {
  const recommendations: string[] = [];

  if (systemHealth.data_freshness === 'warning' || systemHealth.data_freshness === 'critical') {
    recommendations.push('Consider running data refresh for stale records');
  }

  if (systemHealth.quality_score === 'warning' || systemHealth.quality_score === 'critical') {
    recommendations.push('Review and improve data quality for low-scoring records');
  }

  if (systemHealth.overall_health === 'good') {
    recommendations.push('System is performing well - continue regular maintenance');
  }

  return recommendations;
}
