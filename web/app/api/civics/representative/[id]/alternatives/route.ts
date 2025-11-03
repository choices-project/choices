import { type NextRequest, NextResponse } from 'next/server'

import type { CandidatePlatformRow } from '@/types/candidate'
import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

/**
 * GET /api/civics/representative/:id/alternatives
 * Get alternative candidates for a representative's office
 * 
 * Accepts either:
 * - Representative database ID (integer) to look up office details
 * - Query parameters: ?office=...&state=...&level=...&district=...
 * 
 * This integrates user-declared candidate platforms with the alternative candidates display
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()
    const searchParams = request.nextUrl.searchParams
    
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: 'Database connection not available' },
        { status: 500 }
      )
    }

    let office: string
    let level: string
    let state: string
    let district: string | null = null

    // Try to get office info from query params first (direct lookup)
    if (searchParams.get('office') && searchParams.get('state')) {
      office = searchParams.get('office')!
      level = searchParams.get('level') ?? 'federal'
      state = searchParams.get('state')!
      district = searchParams.get('district') ?? null
    } else {
      // Otherwise try to look up by representative ID
      const numericId = parseInt(id, 10)
      if (isNaN(numericId)) {
        // If ID is not numeric, try query params as fallback
        return NextResponse.json(
          { ok: false, error: 'Invalid representative ID. Provide office and state as query parameters.' },
          { status: 400 }
        )
      }

      const { data: representative } = await supabase
        .from('representatives_core')
        .select('office, level, state, district')
        .eq('id', numericId)
        .single()

      if (!representative) {
        return NextResponse.json(
          { ok: false, error: 'Representative not found' },
          { status: 404 }
        )
      }

      office = representative.office
      level = representative.level
      state = representative.state
      district = representative.district
    }

    // Find candidate platforms for the same office
    // Show candidates who are either:
    // 1. Officially verified (filing_status = 'verified' from FEC/state API) OR
    // 2. Admin-verified (verified = true)
    // This allows officially filed candidates to appear immediately while still allowing admin verification
    let query = supabase
      .from('candidate_platforms')
      .select('*')
      .eq('office', office)
      .eq('level', level)
      .eq('state', state)
      .eq('status', 'active')
      .or('verified.eq.true,filing_status.eq.verified')  // Show if verified OR filing_status verified

    // Match district if provided
    if (district && district !== 'N/A') {
      query = query.eq('district', district)
    } else {
      // If no district, match candidates with null district (statewide races)
      query = query.is('district', null)
    }

    const { data: candidatePlatforms, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch alternatives' },
        { status: 500 }
      )
    }

    // Transform to AlternativeCandidate format
    const alternatives = (candidatePlatforms ?? []).map((platform) => {
      const platformPositions = Array.isArray(platform.platform_positions) 
        ? platform.platform_positions
            .filter((pos): pos is { position?: string } => typeof pos === 'object' && pos !== null)
            .map((pos) => pos?.position ?? '')
            .filter(Boolean)
        : [];
      
      return {
        id: platform.id,
        name: platform.candidate_name,
        party: platform.party ?? 'Independent',
        platform: platformPositions,
        experience: platform.experience ?? '',
        endorsements: Array.isArray(platform.endorsements) ? platform.endorsements : [],
        funding: typeof platform.campaign_funding === 'object' && platform.campaign_funding !== null 
          ? platform.campaign_funding 
          : { total: 0, sources: [] },
        visibility: platform.visibility ?? 'medium'
      };
    })

    return NextResponse.json({
      ok: true,
      data: {
        office,
        level,
        state,
        district,
        alternatives
      }
    })
  } catch (error) {
    logger.error('Error fetching alternative candidates:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

