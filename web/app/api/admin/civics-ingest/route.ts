/**
 * Civics Data Ingestion API Endpoint
 * 
 * This endpoint is for background jobs and admin use only.
 * It calls external APIs (Google Civic, OpenStates, etc.) to collect
 * and store civics data in our database.
 * 
 * IMPORTANT: This is separate from user-facing endpoints to maintain
 * security and data integrity principles.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/admin-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Create Supabase client with proper environment variable validation
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing required Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const adminCheck = await requireAdminOr401();
    if (adminCheck) return adminCheck;

    const { source, jurisdiction, forceRefresh = false } = await request.json();

    if (!source || !jurisdiction) {
      return NextResponse.json(
        { error: 'source and jurisdiction are required' },
        { status: 400 }
      );
    }

    // Validate source
    const validSources = ['google_civic', 'openstates', 'fec', 'manual'];
    if (!validSources.includes(source)) {
      return NextResponse.json(
        { error: `Invalid source. Must be one of: ${validSources.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if we should force refresh or use cached data
    if (!forceRefresh) {
      // Check for recent data (within last 24 hours)
      const supabase = createSupabaseClient();
      const { data: recentData } = await supabase
        .from('civics_representatives')
        .select('*')
        .eq('source', source)
        .gte('ingested_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);
      
      if (recentData && recentData.length > 0) {
        return NextResponse.json({
          success: true,
          source,
          jurisdiction,
          message: 'Using cached data (use forceRefresh=true to bypass cache)',
          recordsStored: 0,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Call external APIs based on source
    let externalData;
    switch (source) {
      case 'google_civic':
        externalData = await fetchFromGoogleCivic(jurisdiction);
        break;
      case 'openstates':
        externalData = await fetchFromOpenStates(jurisdiction);
        break;
      case 'fec':
        externalData = await fetchFromFEC(jurisdiction);
        break;
      case 'manual':
        // Manual data entry - validate the data structure
        externalData = await validateManualData(jurisdiction);
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported source' },
          { status: 400 }
        );
    }

    // Store the data in our database
    const storedData = await storeCivicsData(externalData, source);

    return NextResponse.json({
      success: true,
      source,
      jurisdiction,
      recordsStored: storedData.count,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Civics ingest error:', error);
    return NextResponse.json(
      { error: 'Internal server error during data ingestion' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Require admin authentication
    const adminCheck = await requireAdminOr401();
    if (adminCheck) return adminCheck;

    // Return ingest status and statistics
    const supabase = createSupabaseClient();
    const { data: stats, error } = await supabase
      .from('civics_representatives')
      .select('source, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    const sourceStats = stats.reduce((acc, record) => {
      const source = record.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      totalRecords: stats.length,
      sourceBreakdown: sourceStats,
      lastUpdated: stats[0]?.created_at || null
    });

  } catch (error) {
    console.error('Civics ingest status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ingest status' },
      { status: 500 }
    );
  }
}

// External API integration functions
async function fetchFromGoogleCivic(jurisdiction: any) {
  // TODO: Implement Google Civic Information API integration
  // This would call the Google Civic Information API
  // and return structured data for our database
  
  console.log('Fetching from Google Civic API for jurisdiction:', jurisdiction);
  
  // Stub implementation
  return {
    representatives: [],
    divisions: [],
    source: 'google_civic',
    fetchedAt: new Date().toISOString()
  };
}

async function fetchFromOpenStates(jurisdiction: any) {
  // TODO: Implement OpenStates API integration
  // This would call the OpenStates API for state-level data
  
  console.log('Fetching from OpenStates API for jurisdiction:', jurisdiction);
  
  // Stub implementation
  return {
    representatives: [],
    divisions: [],
    source: 'openstates',
    fetchedAt: new Date().toISOString()
  };
}

async function fetchFromFEC(jurisdiction: any) {
  // TODO: Implement FEC API integration
  // This would call the FEC API for campaign finance data
  
  console.log('Fetching from FEC API for jurisdiction:', jurisdiction);
  
  // Stub implementation
  return {
    candidates: [],
    committees: [],
    source: 'fec',
    fetchedAt: new Date().toISOString()
  };
}

async function validateManualData(jurisdiction: any) {
  // Validate manually entered data structure
  if (!jurisdiction.representatives || !Array.isArray(jurisdiction.representatives)) {
    throw new Error('Invalid manual data structure');
  }
  
  return {
    ...jurisdiction,
    source: 'manual',
    validatedAt: new Date().toISOString()
  };
}

async function storeCivicsData(data: any, source: string) {
  // Store the ingested data in our database
  // This ensures data integrity and allows for proper indexing
  
  const { representatives, divisions, ..._metadata } = data;
  
  let storedCount = 0;
  
  // Create Supabase client
  const supabase = createSupabaseClient();
  
  // Store representatives
  if (representatives && representatives.length > 0) {
    const { error: repError } = await supabase
      .from('civics_representatives')
      .upsert(
        representatives.map((rep: any) => ({
          ...rep,
          source,
          ingested_at: new Date().toISOString()
        })),
        { onConflict: 'external_id' }
      );
    
    if (repError) {
      console.error('Error storing representatives:', repError);
    } else {
      storedCount += representatives.length;
    }
  }
  
  // Store divisions
  if (divisions && divisions.length > 0) {
    const { error: divError } = await supabase
      .from('civics_divisions')
      .upsert(
        divisions.map((div: any) => ({
          ...div,
          source,
          ingested_at: new Date().toISOString()
        })),
        { onConflict: 'ocd_division_id' }
      );
    
    if (divError) {
      console.error('Error storing divisions:', divError);
    } else {
      storedCount += divisions.length;
    }
  }
  
  return { count: storedCount };
}
