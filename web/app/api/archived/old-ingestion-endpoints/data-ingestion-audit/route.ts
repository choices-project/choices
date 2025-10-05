/**
 * Data Ingestion Audit API
 * 
 * This endpoint audits the current data ingestion system by:
 * 1. Analyzing existing data sources and quality
 * 2. Testing canonical ID population
 * 3. Verifying cross-source resolution capabilities
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting Data Ingestion Audit...');
    
    const auditResults = {
      dataSources: await analyzeDataSources(),
      canonicalIdSystem: await testCanonicalIdSystem(),
      dataQuality: await verifyDataQuality(),
      crossSourceResolution: await testCrossSourceResolution()
    };

    return NextResponse.json({
      ok: true,
      audit: auditResults,
      timestamp: new Date().toISOString(),
      message: 'Data ingestion audit completed successfully'
    });

  } catch (error) {
    console.error('❌ Data ingestion audit failed:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Data ingestion audit failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function analyzeDataSources() {
  console.log('📊 Analyzing Data Sources...');
  
  const { data: sourceStats, error } = await supabase
    .from('civics_representatives')
    .select('source, level, jurisdiction')
    .not('source', 'is', null);

  if (error) {
    throw new Error(`Failed to analyze sources: ${error.message}`);
  }

  // Group by source
  const sourceGroups = sourceStats.reduce((acc, rep) => {
    const key = `${rep.source}-${rep.level}`;
    if (!acc[key]) {
      acc[key] = { source: rep.source, level: rep.level, count: 0, jurisdictions: new Set() };
    }
    acc[key].count++;
    acc[key].jurisdictions.add(rep.jurisdiction);
    return acc;
  }, {} as Record<string, any>);

  const totalRepresentatives = sourceStats.length;
  const sourceBreakdown = Object.values(sourceGroups).map((group: any) => ({
    source: group.source,
    level: group.level,
    count: group.count,
    jurisdictions: Array.from(group.jurisdictions)
  }));

  return {
    totalRepresentatives,
    sourceBreakdown,
    summary: `Found ${totalRepresentatives} representatives across ${sourceBreakdown.length} source-level combinations`
  };
}

async function testCanonicalIdSystem() {
  console.log('🔗 Testing Canonical ID System...');
  
  // Check if crosswalk table has any entries
  const { data: crosswalkEntries, error } = await supabase
    .from('id_crosswalk')
    .select('canonical_id, source, entity_type')
    .limit(10);

  if (error) {
    throw new Error(`Failed to check crosswalk table: ${error.message}`);
  }

  if (!crosswalkEntries || crosswalkEntries.length === 0) {
    return {
      status: 'empty',
      message: 'No canonical IDs found in crosswalk table - system not populated yet',
      entries: 0,
      crossReferenced: 0
    };
  }

  // Group by canonical ID to see cross-references
  const canonicalIdGroups = crosswalkEntries.reduce((acc, entry) => {
    if (entry.canonical_id) {
      if (!acc[entry.canonical_id]) {
        acc[entry.canonical_id] = [];
      }
      acc[entry.canonical_id]!.push(entry.source);
    }
    return acc;
  }, {} as Record<string, string[]>);

  const uniqueCanonicalIds = Object.keys(canonicalIdGroups).length;
  const crossReferenced = Object.values(canonicalIdGroups).filter(sources => sources.length > 1).length;

  return {
    status: 'populated',
    entries: crosswalkEntries.length,
    uniqueCanonicalIds,
    crossReferenced,
    message: `Found ${crosswalkEntries.length} canonical ID entries with ${crossReferenced} cross-referenced entities`
  };
}

async function verifyDataQuality() {
  console.log('🔍 Verifying Data Quality...');
  
  // Check for representatives with missing critical fields
  const { data: incompleteData, error } = await supabase
    .from('civics_representatives')
    .select('id, name, source, external_id, office, party')
    .or('external_id.is.null,office.is.null,party.is.null')
    .limit(10);

  if (error) {
    throw new Error(`Failed to check data quality: ${error.message}`);
  }

  const incompleteCount = incompleteData?.length || 0;
  const incompleteDetails = incompleteData?.map(rep => {
    const missing = [];
    if (!rep.external_id) missing.push('external_id');
    if (!rep.office) missing.push('office');
    if (!rep.party) missing.push('party');
    return {
      name: rep.name,
      source: rep.source,
      missing: missing
    };
  }) || [];

  return {
    incompleteCount,
    incompleteDetails,
    qualityScore: incompleteCount === 0 ? 'excellent' : incompleteCount < 5 ? 'good' : 'needs_improvement',
    message: incompleteCount === 0 
      ? 'All representatives have complete critical data'
      : `Found ${incompleteCount} representatives with missing data`
  };
}

async function testCrossSourceResolution() {
  console.log('🔄 Testing Cross-Source Resolution...');
  
  // Look for representatives that might exist in multiple sources
  const { data: representatives, error } = await supabase
    .from('civics_representatives')
    .select('name, source, external_id, office, level')
    .not('external_id', 'is', null)
    .limit(50);

  if (error) {
    throw new Error(`Failed to test cross-source resolution: ${error.message}`);
  }

  // Group by name to find potential matches
  const nameGroups = representatives.reduce((acc, rep) => {
    const normalizedName = rep.name.toLowerCase().replace(/[^\w\s]/g, '').trim();
    if (!acc[normalizedName]) {
      acc[normalizedName] = [];
    }
    acc[normalizedName].push(rep);
    return acc;
  }, {} as Record<string, any[]>);

  const potentialMatches = Object.entries(nameGroups)
    .filter(([_, reps]) => reps.length > 1)
    .slice(0, 5);

  return {
    potentialMatches: potentialMatches.length,
    examples: potentialMatches.map(([name, reps]) => ({
      name,
      sources: reps.map((rep: any) => ({
        source: rep.source,
        level: rep.level,
        external_id: rep.external_id
      }))
    })),
    message: potentialMatches.length > 0 
      ? `Found ${potentialMatches.length} potential cross-source matches`
      : 'No obvious cross-source matches found in sample'
  };
}

