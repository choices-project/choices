// app/api/v1/civics/coverage-dashboard/route.ts
// Coverage and freshness dashboard for observability
import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    // Log coverage dashboard request for audit trail
    console.log(`Coverage dashboard requested from: ${request.headers.get('user-agent') || 'unknown'}`);
    
    // Get coverage by source
    const { data: coverageData, error: coverageError } = await supabase
      .from('civics_representatives')
      .select('level, source, jurisdiction, last_updated')
      .eq('valid_to', 'infinity');

    if (coverageError) {
      throw coverageError;
    }

    // Calculate coverage by source
    const coverageBySource = (coverageData as RepresentativeData[] || []).reduce((acc: Record<string, CoverageData>, rep: RepresentativeData) => {
      const key = `${rep.level}-${rep.source}`;
      if (!acc[key]) {
        acc[key] = { level: rep.level, source: rep.source, count: 0, last_updated: rep.last_updated };
      }
      acc[key].count++;
      return acc;
    }, {});

    // Calculate freshness by level
    const now = new Date();
    const freshnessByLevel = (coverageData as RepresentativeData[] || []).reduce((acc: Record<string, FreshnessData>, rep: RepresentativeData) => {
      if (!acc[rep.level]) {
        acc[rep.level] = { total: 0, fresh: 0, stale: 0 };
      }
      acc[rep.level].total++;
      
      const lastUpdated = new Date(rep.last_updated);
      const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      
      // Freshness thresholds
      const thresholds = { federal: 7, state: 14, local: 30 };
      const threshold = thresholds[rep.level as keyof typeof thresholds] || 30;
      
      if (daysSinceUpdate <= threshold) {
        acc[rep.level].fresh++;
      } else {
        acc[rep.level].stale++;
      }
      
      return acc;
    }, {});

    // Calculate FEC mapping rate
    const { error: fecError, count: fecCount } = await supabase
      .from('civics_fec_minimal')
      .select('person_id', { count: 'exact', head: true });
    if (fecError) {
      throw fecError;
    }

    const { error: federalError, count: federalCount } = await supabase
      .from('civics_representatives')
      .select('id', { count: 'exact', head: true })
      .eq('level', 'federal')
      .eq('valid_to', 'infinity');
    if (federalError) {
      throw federalError;
    }

    const fecMappingRate = (federalCount && federalCount > 0)
      ? (((fecCount || 0) / federalCount) * 100)
      : 0;

    // Calculate contact enrichment rate
    const { error: contactError, count: contactCount } = await supabase
      .from('civics_representatives')
      .select('id', { count: 'exact', head: true })
      .eq('level', 'federal')
      .eq('valid_to', 'infinity')
      .not('contact', 'is', null);
    if (contactError) {
      throw contactError;
    }

    const contactEnrichmentRate = (federalCount && federalCount > 0)
      ? (((contactCount || 0) / federalCount) * 100)
      : 0;

    const dashboard = {
      timestamp: now.toISOString(),
      coverage: {
        by_source: Object.values(coverageBySource),
        total_representatives: (coverageData as RepresentativeData[] | null)?.length || 0
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
        fec_records: fecCount || 0,
        federal_representatives: federalCount || 0
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

    return NextResponse.json(dashboard, {
      headers: {
        'ETag': `"dashboard-${Date.now()}"`,
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error fetching coverage dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
