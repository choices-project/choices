import { type NextRequest, NextResponse } from 'next/server'

import { createFECClient } from '@/lib/integrations/fec'
import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

/**
 * POST /api/candidate/verify-fec
 * Verify candidate filing with FEC API
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    // Get current user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { platformId, fecId } = body

    if (!platformId || !fecId) {
      return NextResponse.json(
        { error: 'Platform ID and FEC ID are required' },
        { status: 400 }
      )
    }

    // Verify user owns the platform
    const { data: platform } = await supabase
      .from('candidate_platforms')
      .select('user_id, office, level')
      .eq('id', platformId)
      .single()

    if (!platform || platform.user_id !== authUser.id) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Verify with FEC API (only for federal offices)
    if (platform.level !== 'federal') {
      return NextResponse.json(
        { error: 'FEC verification only available for federal offices' },
        { status: 400 }
      )
    }

    const fecClient = createFECClient()
    const fecCandidate = await fecClient.verifyCandidate(fecId)

    if (!fecCandidate) {
      return NextResponse.json({
        success: false,
        verified: false,
        message: 'Candidate not found in FEC database'
      })
    }

    // Check if candidate is active
    const isActive = await fecClient.isCandidateActive(fecId)

    // Update platform with verified FEC information
    // CRITICAL: Auto-verify on FEC confirmation - FEC is official government verification
    // If FEC confirms they're a candidate, they should appear publicly immediately
    const updateData: any = {
      official_filing_id: fecId,
      filing_status: isActive ? 'verified' : 'filed',
      verification_method: 'api_verification',
      verified_at: new Date().toISOString(),
      verified: true  // Auto-verify: FEC confirmation is sufficient for public display
    }

    // Note: FEC API doesn't provide filing dates, so we don't set official_filing_date here
    // Users can manually add filing date if needed

    const { error: updateError } = await supabase
      .from('candidate_platforms')
      .update(updateData)
      .eq('id', platformId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update platform' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      verified: true,
      candidate: {
        name: fecCandidate.name,
        party: fecCandidate.party_full,
        office: fecCandidate.office_full,
        state: fecCandidate.state,
        district: fecCandidate.district,
        status: fecCandidate.candidate_status,
        active: isActive,
        electionYears: fecCandidate.election_years
      },
      message: isActive 
        ? 'Candidate verified and active in FEC database'
        : 'Candidate found in FEC database but not active for current cycle'
    })
  } catch (error) {
    logger.error('FEC verification error:', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/candidate/verify-fec?fecId=...
 * Public endpoint to check FEC candidate status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fecId = searchParams.get('fecId')

    if (!fecId) {
      return NextResponse.json(
        { error: 'FEC ID required' },
        { status: 400 }
      )
    }

    const fecClient = createFECClient()
    const candidate = await fecClient.verifyCandidate(fecId)

    if (!candidate) {
      return NextResponse.json({
        found: false,
        message: 'Candidate not found in FEC database'
      })
    }

    const isActive = await fecClient.isCandidateActive(fecId)

    return NextResponse.json({
      found: true,
      candidate: {
        id: candidate.candidate_id,
        name: candidate.name,
        party: candidate.party_full,
        office: candidate.office_full,
        state: candidate.state,
        district: candidate.district,
        status: candidate.candidate_status,
        active: isActive,
        electionYears: candidate.election_years
      }
    })
  } catch (error) {
    logger.error('FEC lookup error:', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

